// ces-screens-system.jsx — nudges, review, settings, more menu
const { useState:useSys } = React;

// ---------------- More menu ----------------
function MoreScreen({ store, nav }){
  return (
    <div className="scroll stagger">
      <div className="sectlabel" style={{ marginTop:6 }}>Scaffolding</div>
      <div className="card card--flat" style={{ overflow:"hidden" }}>
        <ListRow icon="bell" title="Gentle nudges" detail="External cues, on your terms" onClick={()=>nav.go("nudges")} />
        <ListRow icon="chart" title="Weekly review" detail="Patterns & reflections" onClick={()=>nav.go("review")} last />
      </div>
      <div className="sectlabel">System</div>
      <div className="card card--flat" style={{ overflow:"hidden" }}>
        <ListRow icon="gear" title="Settings" detail="Home Assistant · AI · data" onClick={()=>nav.go("settings")} last />
      </div>
      <div className="card card--inset" style={{ padding:"16px 16px", marginTop:22, display:"flex", gap:12 }}>
        <Icon name="leaf" size={20} color="var(--accent-ink)" />
        <div style={{ fontSize:13.5, lineHeight:1.5, color:"var(--ink-2)" }}>
          CES externalises structure where internal regulation is unreliable. It doesn't try to fix how your attention works — it builds reliable scaffolding around it.
        </div>
      </div>
    </div>
  );
}

// ---------------- Nudges ----------------
function NudgesScreen({ store, nav }){
  const { state } = store;
  const [addOpen,setAddOpen] = useSys(false);
  return (
    <div className="scroll">
      <div className="card enter" style={{ padding:"16px 18px", display:"flex", alignItems:"center", gap:14,
        borderColor: state.pauseNudges?"var(--clay-soft)":"var(--line)" }}>
        <span style={{ width:42, height:42, borderRadius:13, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
          background: state.pauseNudges?"var(--clay-soft)":"var(--accent-soft)", color: state.pauseNudges?"var(--clay-ink)":"var(--accent-ink)" }}>
          <Icon name={state.pauseNudges?"pause":"bell"} size={21}/>
        </span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:16 }}>{state.pauseNudges?"Nudges paused":"Nudges active"}</div>
          <div className="faint" style={{ fontSize:13, marginTop:1 }}>{state.pauseNudges?"Nothing will cue you. Resume anytime.":"You're always one tap from silence."}</div>
        </div>
        <Toggle on={!state.pauseNudges} onChange={(v)=>store.setPauseNudges(!v)} />
      </div>

      <button onClick={()=>nav.demoNudge()} className="btn btn--soft btn--full" style={{ marginTop:12, gap:9 }}>
        <Icon name="bell" size={18}/> Preview a gentle nudge
      </button>

      <div className="sectlabel">Your rules</div>
      <div className="stagger">
        {state.nudges.map(n=>{
          const c = ctxById(n.ctx);
          return (
            <div key={n.id} className="card" style={{ padding:"15px 16px", marginBottom:9, display:"flex", gap:13, alignItems:"flex-start",
              opacity: (state.pauseNudges||!n.enabled)?0.62:1, transition:"opacity .2s" }}>
              <span style={{ width:34, height:34, borderRadius:10, flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center",
                background:`oklch(0.95 0.024 ${c.hue})`, color:`oklch(0.45 0.06 ${c.hue})` }}>
                <Icon name={n.ctx==="home"?"home":n.ctx==="work"?"focus":"leaf"} size={18}/>
              </span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:15.5, lineHeight:1.25 }}>{n.name}</div>
                <div className="metatag" style={{ marginTop:6 }}><Icon name="clock" size={12}/> {n.when}</div>
                <div className="faint" style={{ fontSize:12.5, marginTop:5, lineHeight:1.4 }}>{n.trigger}</div>
                <span className="chip" style={{ marginTop:9, pointerEvents:"none", fontSize:10.5, padding:"4px 9px",
                  color: n.intensity==="Gentle"?"var(--accent-ink)":"var(--clay-ink)" }}>{n.intensity}</span>
              </div>
              <Toggle on={n.enabled} onChange={()=>store.toggleNudge(n.id)} />
            </div>
          );
        })}
      </div>

      <Btn variant="ghost" full icon="plus" style={{ marginTop:8, color:"var(--ink-2)", justifyContent:"flex-start" }}
        onClick={()=>setAddOpen(true)}>New nudge rule</Btn>

      <div className="card card--inset" style={{ padding:"15px 16px", marginTop:18, display:"flex", gap:11 }}>
        <Icon name="leaf" size={18} color="var(--good)" />
        <div style={{ fontSize:13, lineHeight:1.5, color:"var(--ink-2)" }}>
          Nudges never escalate, shame, or chain. Every cue is salient but easy to dismiss — accountability without harassment.
        </div>
      </div>

      {addOpen && <NewRuleSheet store={store} onClose={()=>setAddOpen(false)} />}
    </div>
  );
}

function NewRuleSheet({ store, onClose }){
  const [name,setName] = useSys("");
  const [ctx,setCtx] = useSys(store.state.currentCtx);
  const [when,setWhen] = useSys("Daily · 20:00");
  const [intensity,setIntensity] = useSys("Gentle");
  const can = name.trim().length>1;
  return (
    <Sheet title="New nudge rule" onClose={onClose}>
      <label className="inputlabel">Name it</label>
      <input className="field" autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Start wind-down before midnight" />
      <label className="inputlabel" style={{ marginTop:16 }}>Context</label>
      <div className="chiprow">{CONTEXTS.map(c=> <Chip key={c.id} active={ctx===c.id} onClick={()=>setCtx(c.id)}>{c.name}</Chip>)}</div>
      <label className="inputlabel" style={{ marginTop:16 }}>When</label>
      <div className="chiprow">{["Daily · 20:00","Daily · 23:30","Zone change","Tasks still open"].map(w=> <Chip key={w} active={when===w} onClick={()=>setWhen(w)}>{w}</Chip>)}</div>
      <label className="inputlabel" style={{ marginTop:16 }}>Intensity</label>
      <div className="chiprow">{["Gentle","Standard"].map(x=> <Chip key={x} active={intensity===x} onClick={()=>setIntensity(x)}>{x}</Chip>)}</div>
      <Btn variant="primary" lg full icon="check" style={{ marginTop:20, opacity:can?1:0.5, pointerEvents:can?"auto":"none" }}
        onClick={()=>{ store.addNudge(name.trim(), ctx, when, intensity==="Gentle"?"Soft light pulse, then check-in":"Quiet notification", intensity); onClose(); }}>Create rule</Btn>
    </Sheet>
  );
}

// ---------------- Review ----------------
function ReviewScreen({ store, nav }){
  const w = store.state.weekly;
  const focusByDay = [25, 50, 0, 45, 30, 0, 35]; // mins
  const maxF = Math.max(...focusByDay, 1);
  const days = ["M","T","W","T","F","S","S"];
  return (
    <div className="scroll stagger">
      <div className="muted" style={{ fontSize:14.5, lineHeight:1.45, margin:"4px 2px 16px" }}>
        A weekly look — for insight, not scoring. No streaks to protect, nothing to feel guilty about.
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <StatTile label="Focus time" value="3h 5m" icon="clock" />
        <StatTile label="Tasks completed" value={w.tasksDone} icon="check" />
      </div>

      <div className="card" style={{ padding:"16px 18px", marginTop:10 }}>
        <div className="mono faint" style={{ fontSize:11, letterSpacing:"0.08em" }}>FOCUS MINUTES · THIS WEEK</div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:9, height:96, marginTop:14 }}>
          {focusByDay.map((m,i)=>(
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:7 }}>
              <div style={{ width:"100%", height:`${(m/maxF)*70}px`, minHeight:m?6:0, borderRadius:6,
                background: m?"var(--accent)":"transparent", border: m?"none":"1px dashed var(--line)" }} />
              <span className="mono faint" style={{ fontSize:10.5 }}>{days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding:"16px 18px", marginTop:10, display:"flex", gap:13, alignItems:"flex-start",
        background:"linear-gradient(180deg, var(--accent-soft), var(--surface) 60%)", borderColor:"var(--accent-line)" }}>
        <Icon name="spark" size={20} color="var(--accent-ink)" />
        <div>
          <div className="mono" style={{ fontSize:11, letterSpacing:"0.08em", color:"var(--accent-ink)", marginBottom:5 }}>PATTERN NOTICED</div>
          <div style={{ fontSize:14.5, lineHeight:1.5 }}>Most stalls happened <em>after</em> the interesting part was solved — the post-insight trough, not a willpower problem. Tasks with a saved if-then plan were <strong>3× more likely</strong> to get started.</div>
        </div>
      </div>

      <div className="card" style={{ padding:"15px 18px", marginTop:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontWeight:700, fontSize:15 }}>Nudges answered</span>
          <span className="mono" style={{ fontSize:14, color:"var(--accent-ink)" }}>{w.nudgesAnswered}/{w.nudgesFired}</span>
        </div>
        <div className="bar" style={{ marginTop:10 }}><div className="bar__fill" style={{ width:`${w.nudgesAnswered/w.nudgesFired*100}%` }}/></div>
        <div className="faint" style={{ fontSize:12.5, marginTop:9 }}>Snoozed twice, dismissed nothing. The 20:00 home nudge had the best response.</div>
      </div>

      <div className="sectlabel">Reflections</div>
      <div className="card card--flat" style={{ overflow:"hidden" }}>
        {store.state.reflections.map((r,i)=>(
          <div key={r.id} style={{ padding:"14px 16px", borderBottom: i===store.state.reflections.length-1?"none":"1px solid var(--line-soft)" }}>
            <div className="mono faint" style={{ fontSize:11, marginBottom:7 }}>{r.day.toUpperCase()}</div>
            {r.worked && <div style={{ fontSize:14.5, display:"flex", gap:8, lineHeight:1.4 }}><Icon name="check" size={15} color="var(--good)" stroke={2.4} style={{ marginTop:2 }}/><span>{r.worked}</span></div>}
            {r.blocked && <div style={{ fontSize:14.5, display:"flex", gap:8, lineHeight:1.4, marginTop:6, color:"var(--ink-2)" }}><Icon name="x" size={15} color="var(--clay)" stroke={2.4} style={{ marginTop:2 }}/><span>{r.blocked}</span></div>}
            {r.note && <div className="faint" style={{ fontSize:13, marginTop:7, fontStyle:"italic", lineHeight:1.4 }}>“{r.note}”</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatTile({ label, value, icon }){
  return (
    <div className="card" style={{ padding:"15px 16px" }}>
      <Icon name={icon} size={19} color="var(--accent-ink)" />
      <div style={{ fontSize:26, fontWeight:700, letterSpacing:"-0.02em", marginTop:10 }}>{value}</div>
      <div className="faint mono" style={{ fontSize:11, marginTop:2, letterSpacing:"0.04em" }}>{label.toUpperCase()}</div>
    </div>
  );
}

// ---------------- Settings ----------------
function SettingsScreen({ store, nav }){
  const { state } = store;
  const [aiConfirm,setAiConfirm] = useSys(true);

  function exportData(){
    try{
      const blob = new Blob([JSON.stringify(state,null,2)], { type:"application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href=url; a.download="ces-export.json"; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 1000);
    }catch(e){ alert("Export blocked in this preview — works on a real device."); }
  }

  return (
    <div className="scroll stagger">
      <div className="sectlabel" style={{ marginTop:6 }}>Appearance</div>
      <div className="card card--flat" style={{ overflow:"hidden" }}>
        <ListRow icon={state.dark?"flame":"now"} title="Dark mode" detail={state.dark?"Easier on the eyes at night":"Bright, high-clarity"}
          right={<Toggle on={state.dark} onChange={(v)=>store.setDark(v)} />} last />
      </div>

      <div className="sectlabel">Home Assistant</div>
      <div className="card card--flat" style={{ overflow:"hidden" }}>
        <ListRow icon="pin" title="Connection" right={
          <span className="chip" style={{ pointerEvents:"none", color: state.haConnected?"var(--good)":"var(--ink-3)", fontSize:11 }}>
            {state.haConnected?"● connected":"○ offline"}</span>} />
        <ListRow icon="home" title="Instance URL" detail="homeassistant.local:8123" onClick={()=>{}} />
        <ListRow icon="gear" title="Long-lived token" detail="••••••••••••  ·  set" onClick={()=>{}} />
        <ListRow icon="bell" title="Webhook secret" detail="••••••  ·  set" onClick={()=>{}} />
        <ListRow icon="pin" title="Zone → context map" detail="3 zones mapped" onClick={()=>nav.openSheet("ctx")} last />
      </div>

      <div className="sectlabel">AI assistance</div>
      <div className="card card--flat" style={{ overflow:"hidden" }}>
        <ListRow icon="spark" title="Model" detail="gpt-4o-mini · on-demand only" onClick={()=>{}} />
        <ListRow icon="bell" title="Confirm before each call" right={<Toggle on={aiConfirm} onChange={setAiConfirm} />} />
        <ListRow icon="pencil" title="Paste-instead-of-call" detail="Save external Claude output by hand" onClick={()=>{}} last />
      </div>

      <div className="sectlabel">Contexts</div>
      <div className="card card--flat" style={{ overflow:"hidden" }}>
        {CONTEXTS.map((c,i)=>(
          <ListRow key={c.id} icon={c.id==="home"?"home":c.id==="work"?"focus":"leaf"} hue={c.hue}
            title={c.name} detail={`${c.zone} · ${c.rule}`} last={i===CONTEXTS.length-1} onClick={()=>{ store.setCurrentCtx(c.id); }} />
        ))}
      </div>

      <div className="sectlabel">Data & safeguards</div>
      <div className="card card--flat" style={{ overflow:"hidden" }}>
        <ListRow icon="pause" title="Pause all nudges" right={<Toggle on={state.pauseNudges} onChange={(v)=>store.setPauseNudges(v)} />} />
        <ListRow icon="arrowR" title="Export my data" detail="Download everything as JSON" onClick={exportData} />
        <ListRow icon="x" title="Reset demo data" detail="Restore the sample contexts & tasks" onClick={()=>{ if(confirm("Reset all demo data?")) store.reset(); }} last />
      </div>

      <div style={{ textAlign:"center", padding:"24px 0 8px" }}>
        <div className="mono faint" style={{ fontSize:11, letterSpacing:"0.1em" }}>CONTEXTUAL EXECUTIVE SCAFFOLD</div>
        <div className="faint" style={{ fontSize:12, marginTop:5 }}>Self-hosted · your data · v0.1 reference</div>
      </div>
    </div>
  );
}

Object.assign(window, { MoreScreen, NudgesScreen, ReviewScreen, SettingsScreen });
