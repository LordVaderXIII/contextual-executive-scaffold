// ces-app.jsx — root: navigation, chrome, nudge banner, mount
const { useState:useApp, useEffect:useAppE } = React;
const { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle } = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "paper": "warm",
  "colorMode": "context",
  "calm": false
}/*EDITMODE-END*/;

const TABS = [
  { id:"now",      label:"Now",      icon:"now" },
  { id:"tasks",    label:"Tasks",    icon:"tasks" },
  { id:"timeline", label:"Today",    icon:"timeline" },
  { id:"focus",    label:"Focus",    icon:"focus" },
  { id:"more",     label:"More",     icon:"more" },
];
const TAB_IDS = TABS.map(t=>t.id);

const META = {
  now:      { title:"Now" },
  tasks:    { title:"Tasks",    eyebrow:"YOUR LIST" },
  timeline: { title:"Today" },
  focus:    { title:"Focus",    eyebrow:"PROTECTED TIME" },
  more:     { title:"More",     eyebrow:"CES" },
  nudges:   { title:"Nudges",   eyebrow:"GENTLE PERSISTENCE" },
  review:   { title:"Review",   eyebrow:"WEEKLY" },
  settings: { title:"Settings", eyebrow:"SYSTEM" },
  task:     { title:"Task",     eyebrow:"BREAK IT DOWN" },
};

function App(){
  const store = useStore();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [stack,setStack] = useApp([{ name:"now" }]);
  const [sheet,setSheet] = useApp(null);
  const [nudge,setNudge] = useApp(false);
  const cur = stack[stack.length-1];
  const base = stack[0].name;
  const pushed = stack.length>1;

  const nav = {
    go:(name)=> setStack(TAB_IDS.includes(name) ? [{ name }] : [...stack, { name }]),
    openTask:(id)=> setStack([...stack, { name:"task", id }]),
    back:()=> setStack(stack.slice(0,-1)),
    openSheet:(s)=> setSheet(s),
    demoNudge:()=> setNudge(true),
  };

  useAppE(()=>{ if(!nudge) return; const t=setTimeout(()=>setNudge(false), 9000); return ()=>clearTimeout(t); },[nudge]);
  useAppE(()=>{ document.body.setAttribute("data-theme", store.state.dark?"dark":"light"); },[store.state.dark]);

  const dateStr = new Date().toLocaleDateString("en-GB",{ weekday:"short", day:"numeric", month:"short" }).toUpperCase();
  const meta = META[cur.name] || { title:"CES" };
  const ctx = ctxById(store.state.currentCtx);
  const accentH = t.colorMode==="single" ? 182 : ctx.hue;

  function renderScreen(){
    switch(cur.name){
      case "now":      return <NowScreen store={store} nav={nav} />;
      case "tasks":    return <TasksScreen store={store} nav={nav} />;
      case "timeline": return <TimelineScreen store={store} nav={nav} />;
      case "focus":    return <FocusScreen store={store} nav={nav} />;
      case "more":     return <MoreScreen store={store} nav={nav} />;
      case "nudges":   return <NudgesScreen store={store} nav={nav} />;
      case "review":   return <ReviewScreen store={store} nav={nav} />;
      case "settings": return <SettingsScreen store={store} nav={nav} />;
      case "task":     return <TaskDetail store={store} nav={nav} taskId={cur.id} />;
      default:         return null;
    }
  }

  return (
    <React.Fragment>
    <IOSDevice dark={store.state.dark}>
      <div className={"app"+(t.calm?" calm":"")} data-paper={t.paper} data-theme={store.state.dark?"dark":"light"} style={{ "--accent-h": accentH }}>
        {/* app bar */}
        <div className="appbar">
          <div className="appbar__row">
            <div style={{ display:"flex", alignItems:"center", gap:11, minWidth:0 }}>
              {pushed && (
                <button className="iconbtn" onClick={nav.back} style={{ marginLeft:-2 }}><Icon name="chevL" size={20}/></button>
              )}
              <div style={{ minWidth:0 }}>
                <div className="appbar__eyebrow">{meta.eyebrow || (cur.name==="now"||cur.name==="timeline" ? dateStr : "CES")}</div>
                <h1 className="appbar__title">{meta.title}</h1>
              </div>
            </div>
            {!pushed && cur.name!=="settings" && (
              <button className="iconbtn" onClick={()=>nav.go("settings")} aria-label="Settings"><Icon name="gear" size={21}/></button>
            )}
          </div>
        </div>

        {renderScreen()}

        {/* gentle nudge banner */}
        {nudge && <NudgeBanner store={store} ctx={ctx} onAction={()=>setNudge(false)} nav={nav} />}

        {/* bottom tabs */}
        <nav className="tabbar">
          <div className="tabbar__inner">
            {TABS.map(t=>(
              <button key={t.id} className="tab" data-active={base===t.id} onClick={()=>nav.go(t.id)}>
                <Icon name={t.icon} size={22} stroke={base===t.id?2.1:1.85} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* sheets */}
        {sheet==="add" && <QuickAddSheet store={store} onClose={()=>setSheet(null)} />}
        {sheet==="ctx" && <CtxSwitchSheet store={store} onClose={()=>setSheet(null)} />}
      </div>
    </IOSDevice>

      <TweaksPanel>
        <TweakSection label="Comfort" />
        <TweakToggle label="Dark mode" value={store.state.dark} onChange={(v)=>store.setDark(v)} />
        <TweakRadio label="Paper tone" value={t.paper} options={["warm","cool","grey"]}
          onChange={(v)=>setTweak("paper", v)} />
        <TweakRadio label="Colour coding" value={t.colorMode} options={["context","single"]}
          onChange={(v)=>setTweak("colorMode", v)} />
        <TweakToggle label="Reduce motion" value={t.calm} onChange={(v)=>setTweak("calm", v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

function NudgeBanner({ store, ctx, onAction, nav }){
  const pending = store.state.tasks.filter(t=>t.ctx===store.state.currentCtx && t.status!=="done").length;
  return (
    <div className="nudge">
      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
        <span style={{ width:36, height:36, borderRadius:11, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
          background:"var(--clay-soft)", color:"var(--clay-ink)" }}><Icon name="bell" size={19}/></span>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="mono" style={{ fontSize:10.5, letterSpacing:"0.1em", color:"var(--clay-ink)" }}>CES · GENTLE NUDGE</div>
          <div style={{ fontSize:15, fontWeight:700, marginTop:3, lineHeight:1.3 }}>
            {pending>0 ? `${pending} item${pending>1?"s":""} pending in ${ctx.name}.` : `You're clear in ${ctx.name}.`}
          </div>
          <div className="faint" style={{ fontSize:13, marginTop:2, lineHeight:1.35 }}>No rush — just a quiet check-in. Want to glance at them?</div>
        </div>
        <button className="iconbtn" onClick={onAction} style={{ width:32, height:32, border:"none", background:"none", color:"var(--ink-3)" }}><Icon name="x" size={17}/></button>
      </div>
      <div style={{ display:"flex", gap:8, marginTop:13 }}>
        <button className="btn btn--clay" style={{ flex:1, minHeight:42, fontSize:14 }} onClick={()=>{ onAction(); nav.go("tasks"); }}>Take a look</button>
        <button className="btn btn--ghost" style={{ minHeight:42, fontSize:14, gap:7 }} onClick={onAction}><Icon name="snooze" size={16}/> Snooze 1h</button>
        <button className="btn btn--ghost" style={{ minHeight:42, fontSize:14 }} onClick={onAction}>Dismiss</button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("stage")).render(<App />);
