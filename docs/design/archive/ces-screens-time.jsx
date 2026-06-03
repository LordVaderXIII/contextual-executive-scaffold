// ces-screens-time.jsx — timeline (day) + focus / hyperfocus
const { useState:useTime, useEffect:useTimeE, useRef:useTimeR } = React;

// ---------------- Timeline ----------------
const DAY_START = 7, DAY_END = 22, HOUR_PX = 58;

function TimelineScreen({ store, nav }){
  const items = [
    { start:9.0,  dur:50, type:"session", ctx:"work",  title:"Refactor sync engine", state:"done" },
    { start:10.5, dur:20, type:"task",    ctx:"work",  title:"Reply to flagged emails", state:"planned" },
    { start:12.5, dur:40, type:"break",   ctx:null,    title:"Lunch & reset" },
    { start:13.5, dur:30, type:"session", ctx:"home",  title:"Health data review", state:"planned" },
    { start:15.0, dur:25, type:"task",    ctx:"work",  title:"Expense report", state:"planned" },
    { start:20.0, dur:15, type:"nudge",   ctx:"home",  title:"Evening review nudge" },
    { start:20.5, dur:45, type:"session", ctx:"study", title:"Read systems book", state:"planned" },
  ];
  const now = new Date();
  const nowDec = now.getHours() + now.getMinutes()/60;
  const nowClamped = Math.min(Math.max(nowDec, DAY_START), DAY_END);
  const totalH = (DAY_END-DAY_START)*HOUR_PX;
  const yFor = (h)=> (h-DAY_START)*HOUR_PX;

  return (
    <div className="scroll">
      <div className="muted" style={{ fontSize:14.5, lineHeight:1.45, margin:"4px 2px 18px" }}>
        Time made visible. Blocks are gentle suggestions — past sessions are filled, planned ones outlined.
      </div>
      <div style={{ position:"relative", height:totalH, marginLeft:2 }}>
        {/* hour grid */}
        {Array.from({length:DAY_END-DAY_START+1}).map((_,i)=>{
          const h = DAY_START+i;
          return (
            <div key={h} style={{ position:"absolute", top:yFor(h), left:0, right:0, height:1 }}>
              <span className="mono faint" style={{ position:"absolute", top:-8, left:0, fontSize:11, width:46 }}>{String(h).padStart(2,"0")}:00</span>
              <div style={{ position:"absolute", left:52, right:0, top:0, height:1, background:"var(--line-soft)" }} />
            </div>
          );
        })}
        {/* now line */}
        <div style={{ position:"absolute", top:yFor(nowClamped), left:52, right:0, height:2, background:"var(--clay)", zIndex:5 }}>
          <span style={{ position:"absolute", left:-6, top:-4, width:10, height:10, borderRadius:"50%", background:"var(--clay)" }} />
          <span className="mono" style={{ position:"absolute", right:0, top:-18, fontSize:10.5, color:"var(--clay-ink)", fontWeight:600 }}>NOW</span>
        </div>
        {/* blocks */}
        {items.map((it,i)=>{
          const top = yFor(it.start), height = Math.max((it.dur/60)*HOUR_PX, 30);
          const c = it.ctx ? ctxById(it.ctx) : null;
          const hue = c?c.hue:null;
          if(it.type==="break" || it.type==="nudge"){
            const isNudge = it.type==="nudge";
            return (
              <div key={i} style={{ position:"absolute", top, left:62, right:8, height,
                display:"flex", alignItems:"center", gap:8, paddingLeft:12, borderRadius:12,
                border:`1px dashed ${isNudge?"var(--clay-soft)":"var(--line)"}`,
                background: isNudge?"var(--clay-soft)":"transparent", color: isNudge?"var(--clay-ink)":"var(--ink-3)" }}>
                <Icon name={isNudge?"bell":"leaf"} size={15}/>
                <span className="mono" style={{ fontSize:12 }}>{it.title}</span>
              </div>
            );
          }
          const done = it.state==="done";
          return (
            <div key={i} style={{ position:"absolute", top, left:62, right:8, height, padding:"9px 12px",
              borderRadius:13, overflow:"hidden", display:"flex", flexDirection:"column", justifyContent:"center",
              borderLeft:`3px solid oklch(0.6 0.07 ${hue})`,
              border:`1px solid ${done?`oklch(0.88 0.04 ${hue})`:"var(--line)"}`,
              borderLeftWidth:3,
              background: done ? `oklch(0.96 0.022 ${hue})` : "var(--surface)",
              boxShadow: done ? "none" : "var(--shadow-sm)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <Icon name={it.type==="session"?"focus":"check"} size={13} color={`oklch(0.45 0.06 ${hue})`} stroke={2.2}/>
                <span style={{ fontWeight:700, fontSize:14, lineHeight:1.15, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{it.title}</span>
              </div>
              <span className="mono faint" style={{ fontSize:10.5, marginTop:3, paddingLeft:20 }}>
                {fmtTime(it.start)}–{fmtTime(it.start+it.dur/60)} · {it.dur}m{done?" · done":""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function fmtTime(h){ const hh=Math.floor(h), mm=Math.round((h-hh)*60); return `${hh}:${String(mm).padStart(2,"0")}`; }

// ---------------- Focus ----------------
const FKEY = "ces.focus.v1";
function loadFocus(){ try{ const r=localStorage.getItem(FKEY); if(r) return JSON.parse(r); }catch(e){} return null; }

function FocusScreen({ store, nav }){
  const task = store.state.tasks.find(t=>t.id===store.state.focusTaskId) || null;
  const [f,setF] = useTime(()=> loadFocus() || { duration:25, mode:"normal", endCond:"", running:false, startedAt:null, base:0 });
  const [tick,setTick] = useTime(0);
  const [reflect,setReflect] = useTime(false);

  useTimeE(()=>{ try{ localStorage.setItem(FKEY, JSON.stringify(f)); }catch(e){} },[f]);
  useTimeE(()=>{
    if(!f.running) return;
    const id=setInterval(()=>setTick(t=>t+1), 250);
    return ()=>clearInterval(id);
  },[f.running]);

  const elapsed = Math.floor(f.base + (f.running && f.startedAt ? (Date.now()-f.startedAt)/1000 : 0));
  const total = f.duration*60;
  const remaining = Math.max(total-elapsed, 0);
  const pct = Math.min(elapsed/total, 1);
  const over = elapsed>total;

  function start(){ setF({ ...f, running:true, startedAt:Date.now() }); }
  function pause(){ setF({ ...f, running:false, base:elapsed, startedAt:null }); }
  function end(){ setF({ ...f, running:false, base:0, startedAt:null }); setReflect(true); }
  function setDur(m){ if(f.running) return; setF({ ...f, duration:m, base:0 }); }
  function setMode(m){ setF({ ...f, mode:m }); }

  return (
    <div className="scroll" style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingTop:8 }}>
      {/* mode switch */}
      <div style={{ display:"flex", gap:6, padding:5, background:"var(--surface-2)", borderRadius:14, marginBottom:4, width:"100%" }}>
        {[["normal","Normal","focus"],["hyperfocus","Hyperfocus","flame"]].map(([m,label,ic])=>(
          <button key={m} onClick={()=>setMode(m)} style={{ flex:1, border:"none", cursor:"pointer", borderRadius:10, padding:"10px",
            display:"flex", alignItems:"center", justifyContent:"center", gap:7, fontFamily:"var(--font)", fontWeight:700, fontSize:14.5,
            background: f.mode===m ? "var(--surface)" : "transparent", color: f.mode===m ? (m==="hyperfocus"?"var(--clay-ink)":"var(--accent-ink)") : "var(--ink-3)",
            boxShadow: f.mode===m ? "var(--shadow-sm)" : "none" }}>
            <Icon name={ic} size={17}/> {label}
          </button>
        ))}
      </div>

      <div className="faint mono" style={{ fontSize:12, margin:"14px 0 2px" }}>
        {task ? "FOCUSING ON" : "FREE FOCUS"}
      </div>
      <div style={{ fontWeight:700, fontSize:17, textAlign:"center", maxWidth:"28ch", lineHeight:1.3, marginBottom:18,
        color: task?"var(--ink)":"var(--ink-3)" }}>
        {task ? task.desc : "No task attached — just protected time."}
      </div>

      <Ring size={228} stroke={13} pct={over?1:pct} color={f.mode==="hyperfocus"?"var(--clay)":"var(--accent)"}>
        <div className="mono" style={{ fontSize:46, fontWeight:600, letterSpacing:"-0.02em", color: over?"var(--clay-ink)":"var(--ink)" }}>
          {fmtClock(over?elapsed-total:remaining)}
        </div>
        <div className="mono faint" style={{ fontSize:11.5, marginTop:2 }}>
          {over ? "over · "+f.duration+"m planned" : (f.running?"remaining":`${f.duration} min`)}
        </div>
      </Ring>

      {!f.running && elapsed===0 && (
        <div className="chiprow" style={{ justifyContent:"center", marginTop:20, width:"100%" }}>
          {[15,25,50,90].map(m=> <Chip key={m} active={f.duration===m} onClick={()=>setDur(m)}>{m} min</Chip>)}
        </div>
      )}

      {f.mode==="hyperfocus" && (
        <div className="card card--inset enter" style={{ width:"100%", padding:"14px 15px", marginTop:18, borderColor:"var(--clay-soft)" }}>
          <div className="mono" style={{ fontSize:11, letterSpacing:"0.08em", color:"var(--clay-ink)", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
            <Icon name="flame" size={14}/> CONTAINMENT — END CONDITION
          </div>
          <textarea className="field" rows={2} value={f.endCond} placeholder="Stop when the test passes, or at 90 min — whichever comes first."
            onChange={e=>setF({ ...f, endCond:e.target.value })} style={{ background:"var(--surface)", fontSize:14.5, lineHeight:1.4 }} />
          <div className="faint" style={{ fontSize:12.5, marginTop:9, lineHeight:1.4 }}>
            A gentle checkpoint will surface every 30 min so a deep dive doesn't quietly swallow the evening.
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:10, marginTop:22, width:"100%" }}>
        {!f.running
          ? <Btn variant={f.mode==="hyperfocus"?"clay":"primary"} lg full icon="play" onClick={start}>{elapsed>0?"Resume":"Start"}</Btn>
          : <Btn variant="ghost" lg full icon="pause" onClick={pause}>Pause</Btn>}
        {elapsed>0 && <Btn variant="ghost" lg icon="check" onClick={end} style={{ flex:"0 0 auto" }}>End</Btn>}
      </div>

      {!task && <button onClick={()=>nav.go("tasks")} className="chip" style={{ marginTop:16 }}><Icon name="plus" size={14}/> attach a task</button>}

      {reflect && <ReflectSheet store={store} mode={f.mode} onClose={()=>setReflect(false)} />}
    </div>
  );
}
function fmtClock(sec){ const m=Math.floor(sec/60), s=sec%60; return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`; }

function ReflectSheet({ store, onClose, mode }){
  const [worked,setWorked] = useTime("");
  const [blocked,setBlocked] = useTime("");
  return (
    <Sheet title="Quick reflection" onClose={onClose}>
      <p className="muted" style={{ margin:"0 2px 16px", fontSize:14.5, lineHeight:1.45 }}>
        Two lines, no pressure. This feeds your weekly review — it's how the system learns your patterns.
      </p>
      <label className="inputlabel">What worked / what did you finish?</label>
      <textarea className="field" rows={2} autoFocus value={worked} onChange={e=>setWorked(e.target.value)} placeholder="Got into flow once the first test ran…" />
      <label className="inputlabel" style={{ marginTop:16 }}>What blocked you? (optional)</label>
      <textarea className="field" rows={2} value={blocked} onChange={e=>setBlocked(e.target.value)} placeholder="Stalled after the interesting part was solved." />
      <Btn variant="primary" lg full icon="check" style={{ marginTop:20 }}
        onClick={()=>{ store.addReflection(worked.trim(), blocked.trim(), ""); onClose(); }}>Log it</Btn>
    </Sheet>
  );
}

Object.assign(window, { TimelineScreen, FocusScreen });
