// ces-screens-tasks.jsx — task list + AI decomposition (hero flow)
const { useState:useTasks, useEffect:useTasksE, useRef:useTasksR } = React;

function TasksScreen({ store, nav }){
  const [filter,setFilter] = useTasks("ctx");
  const { state } = store;
  const ctx = ctxById(state.currentCtx);
  let list = state.tasks;
  if(filter==="ctx") list = list.filter(t=>t.ctx===state.currentCtx);
  else if(filter==="interest") list = list.filter(t=>t.preferred);
  else if(filter==="raw") list = list.filter(t=>t.steps.length===0 && t.status!=="done");

  const open = list.filter(t=>t.status!=="done");
  const done = list.filter(t=>t.status==="done");

  return (
    <div className="scroll">
      <div className="chiprow" style={{ marginBottom:6, position:"sticky", top:0 }}>
        <Chip active={filter==="ctx"} onClick={()=>setFilter("ctx")}>{ctx.name}</Chip>
        <Chip active={filter==="all"} onClick={()=>setFilter("all")}>All</Chip>
        <Chip active={filter==="interest"} onClick={()=>setFilter("interest")}>Interest</Chip>
        <Chip active={filter==="raw"} onClick={()=>setFilter("raw")}>Needs breakdown</Chip>
      </div>

      <div className="stagger">
        {open.length===0 && <div className="muted" style={{ padding:"30px 4px", textAlign:"center" }}>No open tasks here.</div>}
        {open.map(t=> <TaskRow key={t.id} task={t} store={store} onOpen={()=>nav.openTask(t.id)} />)}
      </div>

      {done.length>0 && <>
        <div className="sectlabel">Done</div>
        {done.map(t=> <TaskRow key={t.id} task={t} store={store} onOpen={()=>nav.openTask(t.id)} />)}
      </>}

      <Btn variant="ghost" full icon="plus" style={{ marginTop:18, justifyContent:"flex-start", color:"var(--ink-2)" }}
        onClick={()=>nav.openSheet("add")}>Add a task</Btn>
    </div>
  );
}

// ---------- Task detail + decomposition ----------
function TaskDetail({ store, nav, taskId }){
  const task = store.state.tasks.find(t=>t.id===taskId);
  if(!task) return <div className="scroll"><div className="muted" style={{ padding:30 }}>Task not found.</div></div>;
  const ctx = ctxById(task.ctx);
  const hasSteps = task.steps.length>0;

  return (
    <div className="scroll enter" style={{ "--accent-h": ctx.hue }}>
      <div style={{ display:"flex", gap:8, marginTop:4, marginBottom:13, flexWrap:"wrap" }}>
        <span className="chip" style={{ pointerEvents:"none" }}><span className="ctxbadge__dot" style={{ background:`oklch(0.6 0.07 ${ctx.hue})` }}/> {ctx.name}</span>
        {task.preferred && <span className="chip" style={{ pointerEvents:"none", color:"var(--accent-ink)" }}><Icon name="star" size={13}/> interest</span>}
        <span className="chip" style={{ pointerEvents:"none" }}><Icon name="clock" size={13}/> ~{task.est} min</span>
      </div>
      <h2 style={{ fontSize:25, fontWeight:700, lineHeight:1.22, letterSpacing:"-0.01em", margin:"0 0 4px" }}>{task.desc}</h2>

      <DecomposePanel key={task.id} task={task} store={store} nav={nav} />

      {hasSteps && (
        <Btn variant="primary" lg full icon="play" style={{ marginTop:22 }}
          onClick={()=>{ store.setFocusTask(task.id); nav.go("focus"); }}>Start a focus session</Btn>
      )}
    </div>
  );
}

function DecomposePanel({ task, store, nav }){
  const hasSteps = task.steps.length>0;
  const [mode,setMode] = useTasks(hasSteps ? "committed" : "idle"); // idle | loading | review | committed
  const [steps,setSteps] = useTasks([]);
  const [intention,setIntention] = useTasks("");
  const taRefs = useTasksR([]);

  async function run(){
    setMode("loading");
    const res = await decompose(task.desc);
    setSteps(res.micro_steps);
    setIntention(res.implementation_intention);
    setMode("review");
  }
  function save(){
    const clean = steps.map(s=>s.trim()).filter(Boolean);
    store.saveDecomposition(task.id, clean, intention.trim());
    setMode("committed");
  }

  // committed view (steps live on task)
  if(mode==="committed" && hasSteps){
    const done = task.steps.filter(s=>s.done).length;
    return (
      <div className="enter">
        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"20px 0 14px" }}>
          <div className="bar" style={{ flex:1 }}><div className="bar__fill" style={{ width:`${done/task.steps.length*100}%` }}/></div>
          <span className="mono faint" style={{ fontSize:12 }}>{done}/{task.steps.length}</span>
        </div>
        <div className="card card--flat" style={{ overflow:"hidden" }}>
          {task.steps.map((s,i)=>(
            <button key={i} onClick={()=>store.toggleStep(task.id,i)} style={{ display:"flex", gap:13, alignItems:"flex-start",
              width:"100%", textAlign:"left", background:"none", border:"none", cursor:"pointer",
              padding:"14px 15px", borderBottom: i===task.steps.length-1?"none":"1px solid var(--line-soft)" }}>
              <span className="taskrow__check" data-done={s.done} style={{ width:24, height:24 }}>{s.done && <Icon name="check" size={14} stroke={3} color="#fff"/>}</span>
              <span style={{ flex:1, fontSize:16, lineHeight:1.35, paddingTop:1,
                color:s.done?"var(--ink-3)":"var(--ink)", textDecoration:s.done?"line-through":"none", textDecorationColor:"var(--line)" }}>{s.t}</span>
            </button>
          ))}
        </div>
        {task.intention && <IntentionBand text={task.intention} />}
        <button onClick={()=>{ setSteps(task.steps.map(s=>s.t)); setIntention(task.intention); setMode("review"); }}
          className="btn btn--ghost btn--full" style={{ marginTop:14, color:"var(--ink-2)", gap:9 }}>
          <Icon name="spark" size={18} color="var(--ink-3)"/> Break down again
        </button>
      </div>
    );
  }

  // idle — invitation
  if(mode==="idle"){
    return (
      <div className="card enter" style={{ padding:"22px 20px", marginTop:18, textAlign:"center",
        background:"linear-gradient(180deg, var(--accent-soft), var(--surface) 50%)", borderColor:"var(--accent-line)" }}>
        <div style={{ width:48, height:48, borderRadius:15, margin:"0 auto 14px", display:"flex", alignItems:"center", justifyContent:"center",
          background:"var(--surface)", border:"1px solid var(--accent-line)", color:"var(--accent-ink)" }}>
          <Icon name="spark" size={24}/>
        </div>
        <div style={{ fontSize:18, fontWeight:700 }}>Feels big? Break it down.</div>
        <p className="muted" style={{ fontSize:14.5, lineHeight:1.5, margin:"8px auto 18px", maxWidth:"30ch" }}>
          Get a few concrete micro-steps and one if-then plan, so the first move costs almost nothing.
        </p>
        <Btn variant="primary" lg full icon="spark" onClick={run}>Break this down</Btn>
        <button onClick={()=>{ setSteps(["",""]); setIntention(""); setMode("review"); }}
          style={{ marginTop:12, background:"none", border:"none", color:"var(--ink-3)", fontFamily:"var(--mono)", fontSize:12.5, cursor:"pointer" }}>
          or paste your own steps
        </button>
      </div>
    );
  }

  // loading
  if(mode==="loading"){
    return (
      <div className="card enter" style={{ padding:"34px 20px", marginTop:18, textAlign:"center" }}>
        <div className="thinking"><span/><span/><span/></div>
        <div className="muted" style={{ marginTop:16, fontSize:15 }}>Finding the smallest first move…</div>
        <style>{`.thinking{display:flex;gap:8px;justify-content:center}.thinking span{width:11px;height:11px;border-radius:50%;background:var(--accent);animation:tk 1s var(--ease) infinite}.thinking span:nth-child(2){animation-delay:.15s}.thinking span:nth-child(3){animation-delay:.3s}@keyframes tk{0%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-6px)}}`}</style>
      </div>
    );
  }

  // review / edit
  return (
    <div className="enter" style={{ marginTop:18 }}>
      <div className="sectlabel" style={{ marginTop:0 }}>Micro-steps — edit anything</div>
      <div className="card card--flat" style={{ overflow:"hidden" }}>
        {steps.map((s,i)=>(
          <div key={i} style={{ display:"flex", gap:11, alignItems:"flex-start", padding:"11px 13px",
            borderBottom: i===steps.length-1?"none":"1px solid var(--line-soft)" }}>
            <span className="mono" style={{ color:"var(--accent-ink)", fontSize:13, paddingTop:13, width:16 }}>{i+1}</span>
            <textarea ref={el=>taRefs.current[i]=el} className="field" rows={1} value={s}
              onChange={e=>{ const n=[...steps]; n[i]=e.target.value; setSteps(n); }}
              style={{ border:"none", padding:"10px 4px", fontSize:15.5, background:"none", flex:1 }} />
            {steps.length>1 && <button onClick={()=>setSteps(steps.filter((_,j)=>j!==i))} className="iconbtn" style={{ width:30, height:30, border:"none", background:"none", color:"var(--ink-3)" }}><Icon name="x" size={16}/></button>}
          </div>
        ))}
      </div>
      <button onClick={()=>setSteps([...steps,""])} className="chip" style={{ marginTop:10 }}><Icon name="plus" size={14}/> add step</button>

      <div className="sectlabel">If-then plan</div>
      <textarea className="field" rows={2} value={intention} placeholder="When I &lt;cue&gt;, I will &lt;first action&gt;."
        onChange={e=>setIntention(e.target.value)} style={{ lineHeight:1.45 }} />

      <div style={{ display:"flex", gap:10, marginTop:18 }}>
        <Btn variant="ghost" icon="spark" onClick={run} style={{ flex:"0 0 auto" }}>Redo</Btn>
        <Btn variant="primary" full icon="check" onClick={save}>Save plan</Btn>
      </div>
    </div>
  );
}

function IntentionBand({ text }){
  return (
    <div style={{ marginTop:14, padding:"15px 16px", borderRadius:16, background:"var(--accent-soft)",
      border:"1px solid var(--accent-line)", display:"flex", gap:12 }}>
      <Icon name="arrowR" size={20} color="var(--accent-ink)" />
      <div>
        <div className="mono" style={{ fontSize:11, letterSpacing:"0.08em", color:"var(--accent-ink)", marginBottom:4 }}>IF-THEN PLAN</div>
        <div style={{ fontSize:15.5, lineHeight:1.45, color:"var(--ink)" }}>{text}</div>
      </div>
    </div>
  );
}

Object.assign(window, { TasksScreen, TaskDetail });
