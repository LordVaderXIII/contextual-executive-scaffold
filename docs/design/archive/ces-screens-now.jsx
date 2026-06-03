// ces-screens-now.jsx — dashboard "Now", quick add, context switcher
const { useState: useNow } = React;

function pickNextThing(tasks, ctx) {
  const pool = tasks.filter((t) => t.ctx === ctx && t.status !== "done");
  if (!pool.length) return null;
  const score = (t) => (t.status === "in_progress" ? 100 : 0) + (t.due === "today" ? 40 : 0) + (t.preferred ? 15 : 0) - (t.steps.length ? 0 : 5);
  return [...pool].sort((a, b) => score(b) - score(a))[0];
}

function NowScreen({ store, nav }) {
  const { state } = store;
  const ctx = ctxById(state.currentCtx);
  const hero = pickNextThing(state.tasks, state.currentCtx);
  const others = state.tasks.filter((t) => t.ctx === state.currentCtx && t.status !== "done" && (!hero || t.id !== hero.id));

  return (
    <div className="scroll stagger">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, marginBottom: 18 }}>
        <ContextBadge ctx={ctx} onClick={() => nav.openSheet("ctx")} />
        <span className="metatag" style={{ fontSize: 11.5 }}>
          <Icon name="pin" size={13} color="var(--ink-3)" /> {state.haConnected ? `via Home Assistant · ${ctx.zone}` : "manual"}
        </span>
      </div>

      <div className="sectlabel" style={{ marginTop: 0 }}>Your one next thing</div>
      {hero ? <HeroCard task={hero} store={store} nav={nav} /> :
      <div className="card" style={{ padding: "28px 22px", textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Nothing pending here.</div>
          <div className="muted" style={{ marginTop: 6, fontSize: 15 }}>Nothing demands your attention in {ctx.name} right now. That's allowed.</div>
        </div>
      }

      {others.length > 0 && <>
        <div className="sectlabel">Also in {ctx.name}</div>
        <div>
          {others.slice(0, 4).map((t) =>
          <TaskRow key={t.id} task={t} store={store} onOpen={() => nav.openTask(t.id)} />
          )}
        </div>
      </>}

      <button onClick={() => nav.openSheet("add")} className="btn btn--ghost btn--full" style={{ marginTop: 18, justifyContent: "flex-start", gap: 11, color: "var(--ink-2)" }}>
        <Icon name="plus" size={20} color="var(--ink-3)" /> <span>Add something to {ctx.name}</span>
      </button>
    </div>);

}

function HeroCard({ task, store, nav }) {
  const done = task.steps.filter((s) => s.done).length;
  const hasSteps = task.steps.length > 0;
  const pct = hasSteps ? done / task.steps.length : 0;
  return (
    <div className="card enter" style={{ padding: "20px 20px 18px", borderColor: "var(--accent-line)",
      background: "linear-gradient(180deg, var(--accent-soft), var(--surface) 38%)" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 13 }}>
        {task.preferred && <span className="metatag metatag--accent"><Icon name="star" size={13} /> interest task</span>}
        <span className="metatag"><Icon name="clock" size={13} /> ~{task.est} min</span>
        {task.due === "today" && <span className="metatag metatag--clay"><Icon name="bell" size={13} /> today</span>}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.01em" }}>{task.desc}</div>

      {hasSteps ? <>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 4px" }}>
          <div className="bar" style={{ flex: 1 }}><div className="bar__fill" style={{ width: `${pct * 100}%` }} /></div>
          <span className="mono faint" style={{ fontSize: 12 }}>{done}/{task.steps.length}</span>
        </div>
        <div className="card--inset" style={{ borderRadius: 14, padding: "12px 14px", margin: "12px 0 16px", display: "flex", gap: 10 }}>
          <Icon name="spark" size={18} color="var(--accent-ink)" />
          <div style={{ fontSize: 14.5, lineHeight: 1.4 }}><span className="mono faint" style={{ fontSize: 11, display: "block", marginBottom: 3, letterSpacing: "0.06em" }}>NEXT MICRO-STEP</span>{task.steps.find((s) => !s.done)?.t || "All steps done — mark it complete."}</div>
        </div>
      </> :
      <div className="muted" style={{ fontSize: 15, margin: "12px 0 16px", lineHeight: 1.45 }}>
          Feels big or vague? Break it into a tiny first move so starting costs nothing.
        </div>
      }

      <div style={{ display: "flex", gap: 10, marginTop: hasSteps ? 0 : 2 }}>
        <Btn variant="primary" icon="play" onClick={() => {store.setFocusTask(task.id);nav.go("focus");}} style={{ flex: 1 }}>Start focus</Btn>
        {hasSteps ?
        <Btn variant="soft" icon="arrowR" onClick={() => nav.openTask(task.id)}>Steps</Btn> :
        <Btn variant="soft" icon="spark" onClick={() => nav.openTask(task.id)}>Break it down</Btn>}
      </div>
    </div>);

}

function TaskRow({ task, store, onOpen }) {
  const done = task.status === "done";
  const stepsDone = task.steps.filter((s) => s.done).length;
  return (
    <div className="taskrow" onClick={onOpen}>
      <button className="taskrow__check" data-done={done}
      onClick={(e) => {e.stopPropagation();store.toggleDone(task.id);}}>
        {done && <Icon name="check" size={15} stroke={3} color="#fff" />}
      </button>
      <div className="taskrow__body">
        <div className="taskrow__title" data-done={done}>{task.desc}</div>
        <div className="taskrow__meta">
          {task.preferred && <span className="metatag metatag--accent"><Icon name="star" size={12} /> interest</span>}
          <span className="metatag"><Icon name="clock" size={12} /> ~{task.est}m</span>
          {task.steps.length > 0 && <span className="metatag"><Icon name="check" size={12} /> {stepsDone}/{task.steps.length} steps</span>}
          {task.due === "today" && <span className="metatag metatag--clay">today</span>}
        </div>
      </div>
      <Icon name="chevR" size={16} color="var(--ink-3)" stroke={2} />
    </div>);

}

// ---------- shared sheets ----------
function CtxSwitchSheet({ store, onClose }) {
  const cur = store.state.currentCtx;
  return (
    <Sheet title="Switch context" onClose={onClose}>
      <p className="muted" style={{ margin: "0 2px 16px", fontSize: 14.5, lineHeight: 1.45 }}>
        Contexts surface different tasks and scaffolding. Normally resolved from your location via Home Assistant — you can override it here.
      </p>
      <div className="card card--flat" style={{ overflow: "hidden" }}>
        {CONTEXTS.map((c, i) =>
        <ListRow key={c.id} icon={c.id === "home" ? "home" : c.id === "work" ? "focus" : "leaf"} hue={c.hue}
        title={c.name} detail={`${c.zone} · ${c.rule}`}
        last={i === CONTEXTS.length - 1}
        right={cur === c.id ? <span className="chip" data-active="true" style={{ pointerEvents: "none" }}>active</span> : <Icon name="chevR" size={16} color="var(--ink-3)" stroke={2} />}
        onClick={() => {store.setCurrentCtx(c.id);onClose();}} />
        )}
      </div>
    </Sheet>);

}

function QuickAddSheet({ store, defaultCtx, onClose }) {
  const [desc, setDesc] = useNow("");
  const [ctx, setCtx] = useNow(defaultCtx || store.state.currentCtx);
  const [pref, setPref] = useNow(false);
  const [est, setEst] = useNow(15);
  const can = desc.trim().length > 1;
  return (
    <Sheet title="Add a task" onClose={onClose}>
      <label className="inputlabel">What needs doing?</label>
      <textarea className="field" rows={2} autoFocus placeholder="e.g. Sort out the car insurance renewal" value={desc} onChange={(e) => setDesc(e.target.value)} />

      <label className="inputlabel" style={{ marginTop: 18 }}>Context</label>
      <div className="chiprow">
        {CONTEXTS.map((c) => <Chip key={c.id} active={ctx === c.id} onClick={() => setCtx(c.id)}>{c.name}</Chip>)}
      </div>

      <label className="inputlabel" style={{ marginTop: 18 }}>Rough size</label>
      <div className="chiprow">
        {[10, 15, 25, 45, 90].map((m) => <Chip key={m} active={est === m} onClick={() => setEst(m)}>{m} min</Chip>)}
      </div>

      <button onClick={() => setPref(!pref)} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%",
        background: "var(--surface-2)", border: "1px solid var(--line-soft)", borderRadius: 14, padding: "13px 15px",
        marginTop: 18, cursor: "pointer", textAlign: "left" }}>
        <Icon name="star" size={19} color={pref ? "var(--accent-ink)" : "var(--ink-3)"} />
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>Interest task</span>
          <span className="faint" style={{ fontSize: 12.5 }}>Novel or genuinely engaging — easier to start</span>
        </span>
        <Toggle on={pref} onChange={setPref} />
      </button>

      <Btn variant="primary" lg full icon="plus" style={{ marginTop: 20, opacity: can ? 1 : 0.5, pointerEvents: can ? "auto" : "none" }}
      onClick={() => {store.addTask(desc.trim(), ctx, pref, est);onClose();}}>Add task</Btn>
    </Sheet>);

}

Object.assign(window, { NowScreen, TaskRow, CtxSwitchSheet, QuickAddSheet });