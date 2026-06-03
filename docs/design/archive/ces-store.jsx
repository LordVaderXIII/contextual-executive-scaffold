// ces-store.jsx — data, persistence, AI decomposition
const { useState, useEffect, useRef, useCallback } = React;

// ---------- seed data ----------
const CONTEXTS = [
  { id:"home",  name:"Home",  zone:"Living Room",  rule:"person.you = home",      hue:182 },
  { id:"work",  name:"Work",  zone:"Office",        rule:"person.you = work",      hue:255 },
  { id:"study", name:"Study", zone:"Desk · evening", rule:"home AND 18:00–22:00",  hue:300 },
];

function seedTasks(){
  return [
    { id:"t1", desc:"Submit the quarterly expense report", ctx:"work", preferred:false,
      status:"pending", est:25, due:"today",
      steps:[], intention:"" },
    { id:"t2", desc:"Refactor the sync engine retry logic", ctx:"work", preferred:true,
      status:"in_progress", est:90, due:null,
      steps:[
        { t:"Reproduce the timeout in a failing test", done:true },
        { t:"Map where retries are swallowed", done:true },
        { t:"Add exponential backoff with jitter", done:false },
        { t:"Confirm the failing test now passes", done:false },
      ],
      intention:"When I open my laptop after lunch, I will run the failing test first." },
    { id:"t3", desc:"Book the dentist appointment", ctx:"home", preferred:false,
      status:"pending", est:10, due:"today", steps:[], intention:"" },
    { id:"t4", desc:"Tidy and wipe down the kitchen counters", ctx:"home", preferred:false,
      status:"pending", est:15, due:null, steps:[], intention:"" },
    { id:"t5", desc:"Maintain & review personal health data pipeline", ctx:"home", preferred:true,
      status:"in_progress", est:30, due:null,
      steps:[
        { t:"Open the dashboard and check yesterday's intake", done:true },
        { t:"Tag any meals that are missing macros", done:false },
        { t:"Skim the 7-day trend for anything off", done:false },
      ],
      intention:"When I make my evening tea, I will open the dashboard while it steeps." },
    { id:"t6", desc:"Read two chapters of the systems book", ctx:"study", preferred:true,
      status:"pending", est:45, due:null, steps:[], intention:"" },
    { id:"t7", desc:"Reply to the three flagged emails", ctx:"work", preferred:false,
      status:"pending", est:20, due:"today", steps:[], intention:"" },
  ];
}

function seedNudges(){
  return [
    { id:"n1", name:"Evening at home — pending review", ctx:"home",
      when:"Daily · 20:00", trigger:"Soft light pulse, then phone check-in",
      intensity:"Gentle", enabled:true },
    { id:"n2", name:"Wind-down before midnight", ctx:"home",
      when:"Daily · 23:30", trigger:"Dim lights + one-line reflection prompt",
      intensity:"Gentle", enabled:true },
    { id:"n3", name:"Left work, tasks still open", ctx:"work",
      when:"Zone: leaves Office", trigger:"Quiet notification, no sound",
      intensity:"Standard", enabled:false },
  ];
}

function seedReflections(){
  return [
    { id:"r1", day:"Yesterday", worked:"Backoff logic — got into flow for 50 min", blocked:"Expense report, still not started", note:"Insight came fast, execution stalled after." },
    { id:"r2", day:"Mon", worked:"Health pipeline review", blocked:"", note:"Wrapping it as 'data review' made it easy to start." },
    { id:"r3", day:"Sun", worked:"Read 2 chapters", blocked:"Dentist call — anxiety", note:"" },
  ];
}

// ---------- persistence ----------
const KEY = "ces.state.v1";
function load(){
  try{ const r = localStorage.getItem(KEY); if(r) return JSON.parse(r); }catch(e){}
  return null;
}
function defaultState(){
  return {
    currentCtx:"home",
    tasks: seedTasks(),
    nudges: seedNudges(),
    reflections: seedReflections(),
    pauseNudges:false,
    haConnected:true,
    focusTaskId:null,
    dark:false,
    weekly:{ focusMin:185, tasksDone:9, nudgesFired:11, nudgesAnswered:9 },
  };
}

function useStore(){
  const [state, setState] = useState(() => load() || defaultState());
  useEffect(() => {
    try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){}
  }, [state]);

  const api = {
    state,
    setCurrentCtx:(id)=> setState(s=>({ ...s, currentCtx:id })),
    setPauseNudges:(v)=> setState(s=>({ ...s, pauseNudges:v })),
    setDark:(v)=> setState(s=>({ ...s, dark:v })),
    addTask:(desc, ctx, preferred, est)=> setState(s=>({
      ...s, tasks:[{ id:"t"+Date.now(), desc, ctx, preferred, status:"pending",
        est:est||15, due:null, steps:[], intention:"" }, ...s.tasks] })),
    updateTask:(id, patch)=> setState(s=>({
      ...s, tasks: s.tasks.map(t=> t.id===id ? { ...t, ...patch } : t) })),
    toggleDone:(id)=> setState(s=>({
      ...s, tasks: s.tasks.map(t=> t.id===id
        ? { ...t, status: t.status==="done" ? "pending":"done" } : t) })),
    toggleStep:(id, i)=> setState(s=>({
      ...s, tasks: s.tasks.map(t=>{
        if(t.id!==id) return t;
        const steps = t.steps.map((st,j)=> j===i ? { ...st, done:!st.done } : st);
        const allDone = steps.length && steps.every(x=>x.done);
        return { ...t, steps, status: allDone ? "done" : (t.status==="done"?"in_progress":t.status) };
      }) })),
    saveDecomposition:(id, steps, intention)=> setState(s=>({
      ...s, tasks: s.tasks.map(t=> t.id===id
        ? { ...t, steps: steps.map(x=>({t:x, done:false})), intention,
            status: t.status==="pending" ? "in_progress" : t.status } : t) })),
    setFocusTask:(id)=> setState(s=>({ ...s, focusTaskId:id })),
    toggleNudge:(id)=> setState(s=>({
      ...s, nudges: s.nudges.map(n=> n.id===id ? { ...n, enabled:!n.enabled } : n) })),
    addNudge:(name, ctx, when, trigger, intensity)=> setState(s=>({
      ...s, nudges:[...s.nudges, { id:"n"+Date.now(), name, ctx, when, trigger, intensity, enabled:true }] })),
    addReflection:(worked, blocked, note)=> setState(s=>({
      ...s, reflections:[{ id:"r"+Date.now(), day:"Today", worked, blocked, note }, ...s.reflections] })),
    reset:()=> setState(defaultState()),
  };
  return api;
}

function ctxById(id){ return CONTEXTS.find(c=>c.id===id) || CONTEXTS[0]; }

// ---------- AI decomposition ----------
// Tries window.claude.complete; falls back to a structured local generator.
async function decompose(taskDesc){
  const prompt = `You help people with ADHD start aversive or vague tasks.
Break this task into 3 to 5 concrete, physical micro-steps. The FIRST step must be tiny and frictionless — something doable in under two minutes that creates momentum. Then write ONE implementation intention in the form "When I <specific cue>, I will <first action>."

Task: "${taskDesc}"

Respond ONLY with JSON: {"micro_steps":["...","..."],"implementation_intention":"When I ..., I will ..."}`;
  try{
    if(window.claude && typeof window.claude.complete === "function"){
      const raw = await window.claude.complete(prompt);
      const json = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}")+1));
      if(json.micro_steps && json.micro_steps.length) return json;
    }
  }catch(e){ /* fall through to local */ }
  return localDecompose(taskDesc);
}

function localDecompose(desc){
  const d = desc.toLowerCase();
  const lib = [
    { k:["report","expense","invoice","form","submit","file"],
      steps:["Open the report and just look at the first empty field","Fill in only the date and your name","Add the two largest line items from memory","Attach whatever receipts you already have","Hit submit — it doesn't have to be perfect"],
      it:"When I sit down with my coffee, I will open the form and fill in one field." },
    { k:["email","reply","message","respond","inbox"],
      steps:["Open the inbox and read just the first flagged email","Write a one-line reply — even \"got it, more soon\"","Send that one, then read the next","Reply to the second the same way","Archive anything that needs no reply"],
      it:"When I open my laptop, I will reply to the first email before anything else." },
    { k:["call","book","appointment","dentist","doctor","schedule","phone"],
      steps:["Find the phone number and put it on screen","Write the one sentence you need to say","Take a breath, then tap call","Ask for the soonest slot that works","Add it to your calendar right away"],
      it:"When I finish lunch, I will put the number on screen and tap call." },
    { k:["clean","tidy","wipe","kitchen","dishes","laundry","counter"],
      steps:["Set a 10-minute timer — you only owe it ten minutes","Clear just the flat surfaces of anything that doesn't belong","Wipe the counters in one pass","Deal with the sink","Stop when the timer ends, even if not perfect"],
      it:"When the kettle is boiling, I will clear one counter before it clicks off." },
    { k:["read","chapter","book","study","paper","review"],
      steps:["Open to the page you left off and read one paragraph","Read to the end of the current section","Note one sentence that stood out","Read the next section the same way","Bookmark and stop — momentum over volume"],
      it:"When I make my evening tea, I will read one paragraph while it steeps." },
    { k:["refactor","code","bug","fix","sync","engine","build","deploy"],
      steps:["Open the file and reread the part that already works","Write a failing test that captures the problem","Make the smallest change that could pass it","Run it; if red, change one thing and rerun","Commit the moment it's green"],
      it:"When I open my editor, I will run the failing test before reading anything else." },
    { k:["pipeline","data","dashboard","health","track","log","analytics"],
      steps:["Open the dashboard and just look at yesterday","Spot the one number that's missing or off","Fix or tag only that one thing","Skim the 7-day trend once","Close it — review, don't rebuild"],
      it:"When I sit at my desk, I will open the dashboard and check yesterday first." },
  ];
  for(const e of lib){ if(e.k.some(w=>d.includes(w))) return { micro_steps:e.steps, implementation_intention:e.it }; }
  // generic decomposition
  const noun = desc.replace(/^(the |a |an )/i,"").trim();
  return {
    micro_steps:[
      `Set a 5-minute timer and open whatever \u201c${noun}\u201d needs`,
      "Do the smallest visible first action — no decisions yet",
      "Keep going only while the timer runs",
      "Write down the very next action before you stop",
      "Mark this done or carry the next action forward",
    ],
    implementation_intention:`When I finish my next coffee, I will spend five minutes on \u201c${noun}.\u201d`,
  };
}

Object.assign(window, {
  useStore, CONTEXTS, ctxById, decompose,
});
