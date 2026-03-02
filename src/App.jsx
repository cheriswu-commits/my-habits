import { useState, useEffect, useMemo } from "react";

const API = "https://script.google.com/macros/s/AKfycbxpL7hf0D4TCulpR6rshbtcD0vMrvnVX0gDvBzv3DAVOGplrLL-TKAsNNw-IEKRBmcq0w/exec";

async function gGet(sheet) {
  const res = await fetch(`${API}?sheet=${sheet}`);
  return res.json();
}
async function gPost(action, sheet, data = {}, id = null, updates = null) {
  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({ action, sheet, data, id, updates }),
  });
  return res.json();
}

const DAYS_CN = ["日","一","二","三","四","五","六"];
const ICONS = ["🎧","💪","🧘","🎬","🏋️","⛳","📚","🔍","📈","🏃","🥗","💧","✍️","🎯","🎸","🌿","🧠","💊","📝","🌅"];
const COLORS = ["#6366f1","#d97706","#db2777","#059669","#ea580c","#65a30d","#7c3aed","#0284c7","#e11d48","#0d9488","#c026d3","#ca8a04"];
const FREQ_OPTIONS = [
  { key:"daily",   label:"每日", desc:"每天都要完成" },
  { key:"weekly",  label:"每周", desc:"本周完成一次" },
  { key:"monthly", label:"每月", desc:"本月完成一次" },
  { key:"anytime", label:"随时", desc:"有发生就打卡"  },
];
const TAG_COLORS = {
  "投资":"#6366f1","生活":"#059669","工作":"#d97706","想法":"#7c3aed",
  "阅读":"#0284c7","健康":"#db2777","其他":"#6b7280"
};
const T = {
  bg:"#f5f0e8", card:"#ede8dc", cardBorder:"#ddd6c8", divider:"#e0d8cc",
  textPrimary:"#2a2520", textSub:"#8a8070", textMuted:"#b0a898",
  todayBg:"rgba(99,102,241,0.12)", inputBg:"#e8e2d6",
};
const DEFAULT_HABITS = [
  {name:"英语播客 1h",icon:"🎧",color:"#6366f1",freq:"daily"},
  {name:"卷腹",icon:"💪",color:"#d97706",freq:"daily"},
  {name:"冥想",icon:"🧘",color:"#db2777",freq:"daily"},
  {name:"Netflix 2h",icon:"🎬",color:"#059669",freq:"weekly"},
  {name:"健身 ×2",icon:"🏋️",color:"#ea580c",freq:"weekly"},
  {name:"高尔夫",icon:"⛳",color:"#65a30d",freq:"weekly"},
  {name:"阅读 1/4本",icon:"📚",color:"#7c3aed",freq:"weekly"},
  {name:"研究一家公司",icon:"🔍",color:"#0284c7",freq:"monthly"},
  {name:"股票操作→小红书",icon:"📈",color:"#e11d48",freq:"anytime"},
];

const dk = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const wk = d => { const s=new Date(d); s.setDate(d.getDate()-d.getDay()); return dk(s); };
const mk = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
function getWeekDates(d) {
  const s=new Date(d); s.setDate(d.getDate()-d.getDay());
  return Array.from({length:7},(_,i)=>{ const x=new Date(s); x.setDate(s.getDate()+i); return x; });
}
function getDaysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function formatTime(ts) {
  const d=new Date(ts);
  return (d.getMonth()+1)+"/"+d.getDate()+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
}
function tagColor(t){ return TAG_COLORS[t]||"#6b7280"; }
function Label({children}){ return <div style={{fontSize:"11px",color:T.textSub,fontWeight:"700",letterSpacing:"0.5px",marginBottom:"7px"}}>{children}</div>; }
function SectionLabel({label,color,count}){
  return (
    <div style={{display:"flex",alignItems:"center",gap:"8px",margin:"18px 0 10px"}}>
      <div style={{width:"3px",height:"14px",borderRadius:"2px",background:color}}/>
      <span style={{fontSize:"12px",fontWeight:"700",color:T.textSub,letterSpacing:"0.5px"}}>{label}</span>
      {count!=null&&<span style={{fontSize:"11px",color:T.textMuted}}>({count})</span>}
    </div>
  );
}

function AddHabitModal({onClose,onAdd}){
  const [name,setName]=useState(""); const [icon,setIcon]=useState("🎯");
  const [color,setColor]=useState("#6366f1"); const [freq,setFreq]=useState("daily");
  function submit(){ if(!name.trim()) return; onAdd({name:name.trim(),icon,color,freq}); onClose(); }
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(42,37,32,0.45)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1000,backdropFilter:"blur(3px)"}}>
      <div style={{width:"100%",maxWidth:"520px",background:T.card,borderRadius:"20px 20px 0 0",padding:"24px 20px 44px",border:"1px solid "+T.cardBorder}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
          <span style={{fontSize:"16px",fontWeight:"800",color:T.textPrimary}}>新增习惯</span>
          <button onClick={onClose} style={{background:T.divider,border:"none",color:T.textSub,width:"28px",height:"28px",borderRadius:"50%",cursor:"pointer",fontSize:"15px"}}>×</button>
        </div>
        <div style={{marginBottom:"14px"}}>
          <Label>习惯名称</Label>
          <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="例如：早起 6:30、喝水 2L…" autoFocus
            style={{width:"100%",padding:"11px 14px",borderRadius:"10px",background:T.inputBg,border:"1.5px solid "+(name?"#6366f1":T.divider),color:T.textPrimary,fontSize:"14px",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:"14px"}}>
          <Label>频率</Label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
            {FREQ_OPTIONS.map(f=>(
              <div key={f.key} onClick={()=>setFreq(f.key)} style={{padding:"10px 12px",borderRadius:"10px",cursor:"pointer",background:freq===f.key?"rgba(99,102,241,0.12)":T.inputBg,border:"1.5px solid "+(freq===f.key?"#6366f1":T.divider)}}>
                <div style={{fontSize:"13px",fontWeight:"700",color:freq===f.key?"#6366f1":T.textSub}}>{f.label}</div>
                <div style={{fontSize:"11px",color:T.textMuted,marginTop:"2px"}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{marginBottom:"14px"}}>
          <Label>图标</Label>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {ICONS.map(ic=>(<button key={ic} onClick={()=>setIcon(ic)} style={{width:"36px",height:"36px",borderRadius:"9px",border:"none",background:icon===ic?"rgba(99,102,241,0.18)":T.inputBg,fontSize:"18px",cursor:"pointer",outline:icon===ic?"2px solid #6366f1":"none",outlineOffset:"1px"}}>{ic}</button>))}
          </div>
        </div>
        <div style={{marginBottom:"22px"}}>
          <Label>颜色</Label>
          <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
            {COLORS.map(c=>(<button key={c} onClick={()=>setColor(c)} style={{width:"28px",height:"28px",borderRadius:"50%",border:"none",background:c,cursor:"pointer",boxShadow:color===c?"0 0 0 3px "+T.bg+", 0 0 0 5px "+c:"none"}}/>))}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",flex:1,padding:"10px 12px",borderRadius:"10px",background:T.inputBg}}>
            <div style={{width:"30px",height:"30px",borderRadius:"8px",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"15px",flexShrink:0}}>{icon}</div>
            <span style={{fontSize:"13px",color:name?T.textPrimary:T.textMuted,fontWeight:"600",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name||"预览"}</span>
            <span style={{fontSize:"11px",padding:"2px 8px",borderRadius:"10px",background:color+"22",color:color,fontWeight:"700",flexShrink:0}}>{FREQ_OPTIONS.find(f=>f.key===freq)?.label}</span>
          </div>
          <button onClick={submit} style={{padding:"12px 20px",borderRadius:"10px",border:"none",background:name.trim()?"#6366f1":T.divider,color:name.trim()?"#fff":T.textMuted,fontWeight:"700",fontSize:"14px",cursor:name.trim()?"pointer":"default",flexShrink:0}}>添加</button>
        </div>
      </div>
    </div>
  );
}

function WeekGrid({habits,scope,label,color,weekDates,today,completions,onToggle,onDelete}){
  const todayKey=dk(today);
  if(!habits.length) return null;
  return (
    <div style={{marginBottom:"4px"}}>
      <SectionLabel label={label} color={color} count={habits.length}/>
      <div style={{background:T.card,borderRadius:"14px",overflow:"hidden",border:"1px solid "+T.cardBorder}}>
        <div style={{display:"grid",gridTemplateColumns:"108px repeat(7,1fr)",borderBottom:"1px solid "+T.divider}}>
          <div style={{padding:"8px 10px"}}/>
          {weekDates.map((d,i)=>{
            const k=dk(d),isT=k===todayKey;
            return (
              <div key={i} style={{textAlign:"center",padding:"8px 2px",background:isT?T.todayBg:"transparent"}}>
                <div style={{fontSize:"10px",color:isT?"#6366f1":T.textMuted,fontWeight:"700"}}>{DAYS_CN[d.getDay()]}</div>
                <div style={{fontSize:"12px",fontWeight:"800",width:"20px",height:"20px",borderRadius:"50%",background:isT?"rgba(99,102,241,0.25)":"transparent",color:isT?"#6366f1":T.textSub,display:"flex",alignItems:"center",justifyContent:"center",margin:"2px auto 0"}}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>
        {habits.map((h,hi)=>(
          <div key={h.id} style={{display:"grid",gridTemplateColumns:"108px repeat(7,1fr)",borderBottom:hi<habits.length-1?"1px solid "+T.divider:"none",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"9px 10px",borderRight:"1px solid "+T.divider}}>
              <span style={{fontSize:"14px"}}>{h.icon}</span>
              <span style={{fontSize:"11px",color:T.textSub,fontWeight:"500",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.name}</span>
              <button onClick={()=>onDelete(h.id)} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:"13px",padding:"0",flexShrink:0}}>×</button>
            </div>
            {weekDates.map((d,di)=>{
              const dkk=dk(d);
              const sk=scope==="daily"?dkk:scope==="weekly"?wk(d):mk(d);
              const done=completions[h.id+"__"+sk];
              const isT=dkk===todayKey,isFuture=d>today;
              return (
                <div key={di} onClick={()=>!isFuture&&onToggle(h.id,sk,done)} style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"9px 2px",background:isT?T.todayBg:"transparent",cursor:isFuture?"default":"pointer"}}>
                  {done?(<div style={{width:"20px",height:"20px",borderRadius:"50%",background:h.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",color:"#fff",fontWeight:"800"}}>✓</div>):isFuture?(<div style={{width:"20px",height:"20px"}}/>):(<div style={{width:"20px",height:"20px",borderRadius:"50%",border:"1.5px solid "+T.cardBorder}}/>)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewTab({habits,completions,today}){
  const [mode,setMode]=useState("week"); const [offset,setOffset]=useState(0);
  function pctColor(p){ return p===100?"#059669":p>=70?"#65a30d":p>=40?"#d97706":p>0?"#ea580c":T.textMuted; }
  const {periods,habitRows}=useMemo(()=>{
    if(mode==="week"){
      const anchor=new Date(today); anchor.setDate(anchor.getDate()-offset*4*7);
      const weeks=Array.from({length:4},(_,i)=>{ const d=new Date(anchor); d.setDate(anchor.getDate()-(3-i)*7); const dates=getWeekDates(d); return {label:(dates[0].getMonth()+1)+"/"+dates[0].getDate()+"–"+(dates[6].getMonth()+1)+"/"+dates[6].getDate(),dates,weekKey:wk(d)}; });
      const rows=[];
      const daily=habits.filter(h=>h.freq==="daily"); const weekly=habits.filter(h=>h.freq==="weekly"); const anytime=habits.filter(h=>h.freq==="anytime");
      if(daily.length) rows.push({groupLabel:"每日习惯",color:"#6366f1",habits:daily.map(h=>({...h,scores:weeks.map(w=>{ const done=w.dates.filter(d=>completions[h.id+"__"+dk(d)]).length; return {done,total:7,pct:Math.round(done/7*100)}; })}))});
      if(weekly.length) rows.push({groupLabel:"每周目标",color:"#f97316",habits:weekly.map(h=>({...h,scores:weeks.map(w=>{ const done=completions[h.id+"__"+w.weekKey]?1:0; return {done,total:1,pct:done*100}; })}))});
      if(anytime.length) rows.push({groupLabel:"随时触发",color:"#e11d48",habits:anytime.map(h=>({...h,scores:weeks.map(w=>{ const done=w.dates.filter(d=>completions[h.id+"__"+dk(d)]).length; return {done,total:7,pct:done>0?100:0}; })}))});
      return {periods:weeks.map(w=>w.label),habitRows:rows};
    } else {
      const anchor=new Date(today); anchor.setMonth(anchor.getMonth()-offset*4);
      const months=Array.from({length:4},(_,i)=>{ const d=new Date(anchor); d.setMonth(anchor.getMonth()-(3-i)); const y=d.getFullYear(),m=d.getMonth(),days=getDaysInMonth(y,m); return {label:(m+1)+"月",allDays:Array.from({length:days},(_,j)=>new Date(y,m,j+1)),monthKey:mk(d)}; });
      const rows=[];
      const daily=habits.filter(h=>h.freq==="daily"); const weekly=habits.filter(h=>h.freq==="weekly"); const monthly=habits.filter(h=>h.freq==="monthly"); const anytime=habits.filter(h=>h.freq==="anytime");
      if(daily.length) rows.push({groupLabel:"每日习惯",color:"#6366f1",habits:daily.map(h=>({...h,scores:months.map(mo=>{ const done=mo.allDays.filter(d=>completions[h.id+"__"+dk(d)]).length; return {done,total:mo.allDays.length,pct:Math.round(done/mo.allDays.length*100)}; })}))});
      if(weekly.length) rows.push({groupLabel:"每周目标",color:"#f97316",habits:weekly.map(h=>({...h,scores:months.map(mo=>{ const ws=new Set(mo.allDays.map(d=>wk(d))); const done=Array.from(ws).filter(w=>completions[h.id+"__"+w]).length; return {done,total:ws.size,pct:Math.round(done/ws.size*100)}; })}))});
      if(monthly.length) rows.push({groupLabel:"月度目标",color:"#0284c7",habits:monthly.map(h=>({...h,scores:months.map(mo=>{ const done=completions[h.id+"__"+mo.monthKey]?1:0; return {done,total:1,pct:done*100}; })}))});
      if(anytime.length) rows.push({groupLabel:"随时触发",color:"#e11d48",habits:anytime.map(h=>({...h,scores:months.map(mo=>{ const done=mo.allDays.filter(d=>completions[h.id+"__"+dk(d)]).length; return {done,total:mo.allDays.length,pct:done>0?100:0}; })}))});
      return {periods:months.map(m=>m.label),habitRows:rows};
    }
  },[mode,offset,habits,completions,today]);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"4px 0 16px"}}>
        <div style={{display:"flex",gap:"4px",background:T.card,borderRadius:"8px",padding:"3px",border:"1px solid "+T.cardBorder}}>
          {[["week","周度"],["month","月度"]].map(([m,l])=>(<button key={m} onClick={()=>{setMode(m);setOffset(0);}} style={{padding:"5px 14px",borderRadius:"6px",border:"none",background:mode===m?"#6366f1":"transparent",color:mode===m?"#fff":T.textSub,fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>{l}</button>))}
        </div>
        <div style={{display:"flex",gap:"6px"}}>
          <button onClick={()=>setOffset(o=>o+1)} style={{background:T.card,border:"1px solid "+T.cardBorder,color:T.textSub,padding:"5px 10px",borderRadius:"7px",cursor:"pointer",fontSize:"12px"}}>← 更早</button>
          {offset>0&&<button onClick={()=>setOffset(o=>o-1)} style={{background:T.card,border:"1px solid "+T.cardBorder,color:T.textSub,padding:"5px 10px",borderRadius:"7px",cursor:"pointer",fontSize:"12px"}}>更近 →</button>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"100px repeat(4,1fr)",marginBottom:"2px"}}>
        <div/>{periods.map((p,i)=>(<div key={i} style={{textAlign:"center",fontSize:"10px",color:T.textSub,fontWeight:"700",padding:"0 2px"}}>{p}</div>))}
      </div>
      {habitRows.map((group,gi)=>(
        <div key={gi} style={{marginBottom:"16px"}}>
          <SectionLabel label={group.groupLabel} color={group.color}/>
          <div style={{background:T.card,borderRadius:"14px",overflow:"hidden",border:"1px solid "+T.cardBorder}}>
            {group.habits.map((h,hi)=>(
              <div key={h.id} style={{display:"grid",gridTemplateColumns:"100px repeat(4,1fr)",borderBottom:hi<group.habits.length-1?"1px solid "+T.divider:"none",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px",borderRight:"1px solid "+T.divider}}>
                  <span style={{fontSize:"13px"}}>{h.icon}</span>
                  <span style={{fontSize:"11px",color:T.textSub,fontWeight:"500",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.name}</span>
                </div>
                {h.scores.map((s,si)=>(
                  <div key={si} style={{textAlign:"center",padding:"10px 4px"}}>
                    <div style={{position:"relative",height:"5px",background:T.divider,borderRadius:"3px",margin:"0 8px 5px"}}>
                      <div style={{position:"absolute",left:0,top:0,height:"100%",borderRadius:"3px",width:s.pct+"%",background:pctColor(s.pct)}}/>
                    </div>
                    <div style={{fontSize:"11px",fontWeight:"700",color:pctColor(s.pct)}}>{s.pct===0?"—":s.total===1?(s.done?"✓":"✗"):s.done+"/"+s.total}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
      {habitRows.length===0&&<div style={{textAlign:"center",color:T.textMuted,padding:"50px 0",fontSize:"13px"}}>先去打几次卡，复盘数据就会出现这里 📊</div>}
      <div style={{display:"flex",gap:"10px",justifyContent:"center",marginTop:"8px",flexWrap:"wrap"}}>
        {[["#059669","100%"],["#65a30d","≥70%"],["#d97706","≥40%"],["#ea580c",">0%"],[T.textMuted,"未完成"]].map(([c,l])=>(<div key={l} style={{display:"flex",alignItems:"center",gap:"4px"}}><div style={{width:"10px",height:"10px",borderRadius:"3px",background:c}}/><span style={{fontSize:"11px",color:T.textMuted}}>{l}</span></div>))}
      </div>
    </div>
  );
}

export default function App() {
  const [tab,setTab]=useState("habits");
  const [today]=useState(new Date());
  const [curDate,setCurDate]=useState(new Date());
  const [habits,setHabits]=useState([]);
  const [completions,setComp]=useState({});
  const [todos,setTodos]=useState([]);
  const [newTodo,setNewTodo]=useState("");
  const [ideas,setIdeas]=useState([]);
  const [newIdea,setNewIdea]=useState("");
  const [newTag,setNewTag]=useState("想法");
  const [editingIdea,setEd]=useState(null);
  const [filterTag,setFTag]=useState("全部");
  const [showModal,setModal]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    async function load(){
      setLoading(true);
      try {
        const [h,c,t,id] = await Promise.all([
          gGet("habits"), gGet("completions"), gGet("todos"), gGet("ideas")
        ]);
        let loadedHabits = Array.isArray(h) ? h : [];
        if(loadedHabits.length===0){
          const seeded = await Promise.all(DEFAULT_HABITS.map(dh=>gPost("insert","habits",dh)));
          loadedHabits = seeded;
        }
        setHabits(loadedHabits);
        const cmap={};
        (Array.isArray(c)?c:[]).forEach(r=>{ cmap[r.habit_id+"__"+r.scope_key]=true; });
        setComp(cmap);
        setTodos(Array.isArray(t)?t:[]);
        setIdeas(Array.isArray(id)?id:[]);
      } catch(e){ console.error(e); }
      setLoading(false);
    }
    load();
  },[]);

  async function toggleCompletion(hid,sk,isDone){
    setSaving(true);
    if(isDone){
      const allC = await gGet("completions");
      const found = allC.find(r=>String(r.habit_id)===String(hid)&&r.scope_key===sk);
      if(found) await gPost("delete","completions",{},found.id);
      setComp(p=>{ const n={...p}; delete n[hid+"__"+sk]; return n; });
    } else {
      const newC = await gPost("insert","completions",{habit_id:hid,scope_key:sk});
      setComp(p=>({...p,[hid+"__"+sk]:true}));
    }
    setSaving(false);
  }

  async function addHabit(h){
    setSaving(true);
    const data=await gPost("insert","habits",h);
    setHabits(p=>[...p,data]);
    setSaving(false);
  }

  async function deleteHabit(id){
    setSaving(true);
    await gPost("delete","habits",{},id);
    setHabits(p=>p.filter(h=>String(h.id)!==String(id)));
    setSaving(false);
  }

  async function addTodo(){
    if(!newTodo.trim()) return;
    setSaving(true);
    const data=await gPost("insert","todos",{text:newTodo,done:false,date:dk(curDate)});
    setTodos(p=>[...p,data]);
    setNewTodo("");
    setSaving(false);
  }

  async function toggleTodo(id,done){
    setSaving(true);
    await gPost("update","todos",{},id,{done:!done});
    setTodos(p=>p.map(t=>String(t.id)===String(id)?{...t,done:!done}:t));
    setSaving(false);
  }

  async function deleteTodo(id){
    setSaving(true);
    await gPost("delete","todos",{},id);
    setTodos(p=>p.filter(t=>String(t.id)!==String(id)));
    setSaving(false);
  }

  async function addIdea(){
    if(!newIdea.trim()) return;
    setSaving(true);
    const data=await gPost("insert","ideas",{text:newIdea,tag:newTag});
    setIdeas(p=>[data,...p]);
    setNewIdea("");
    setSaving(false);
  }

  async function updateIdea(id,text){
    setSaving(true);
    await gPost("update","ideas",{},id,{text});
    setIdeas(p=>p.map(x=>String(x.id)===String(id)?{...x,text}:x));
    setSaving(false);
  }

  async function deleteIdea(id){
    setSaving(true);
    await gPost("delete","ideas",{},id);
    setIdeas(p=>p.filter(x=>String(x.id)!==String(id)));
    setSaving(false);
  }

  const curKey=dk(curDate),todayKey=dk(today),weekDates=getWeekDates(curDate);
  const daily=habits.filter(h=>h.freq==="daily"), weekly=habits.filter(h=>h.freq==="weekly");
  const monthly=habits.filter(h=>h.freq==="monthly"), anytime=habits.filter(h=>h.freq==="anytime");
  const allTags=["全部",...Array.from(new Set(ideas.map(i=>i.tag)))];
  const filteredIdeas=filterTag==="全部"?ideas:ideas.filter(i=>i.tag===filterTag);
  const gridProps={weekDates,today,completions,onToggle:toggleCompletion,onDelete:deleteHabit};
  const TABS=[["habits","🔥","习惯"],["review","📊","复盘"],["todos","✅","待办"],["ideas","💡","想法"]];

  if(loading) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px"}}>
      <div style={{fontSize:"32px"}}>🌿</div>
      <div style={{fontSize:"14px",color:T.textSub}}>加载中…</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'DM Sans','PingFang SC',sans-serif",color:T.textPrimary,maxWidth:"520px",margin:"0 auto"}}>
      {showModal&&<AddHabitModal onClose={()=>setModal(false)} onAdd={addHabit}/>}
      {saving&&<div style={{position:"fixed",top:12,right:12,background:"#6366f1",color:"#fff",borderRadius:"20px",padding:"4px 12px",fontSize:"11px",fontWeight:"700",zIndex:999}}>保存中…</div>}

      <div style={{padding:"22px 20px 0",background:"linear-gradient(180deg,"+T.card+" 0%,transparent 100%)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <div>
            <div style={{fontSize:"20px",fontWeight:"800",letterSpacing:"-0.5px",color:T.textPrimary}}>
              {tab==="ideas"?"💡 想法记录":tab==="todos"?"✅ 待办事项":tab==="review"?"📊 复盘":"🔥 习惯追踪"}
            </div>
            <div style={{fontSize:"12px",color:T.textSub,marginTop:"3px"}}>
              {tab==="habits"&&"本周 "+weekDates[0].getDate()+"日 – "+weekDates[6].getDate()+"日 · "+habits.length+"个习惯"}
              {tab==="review"&&"追踪你的完成趋势"}
              {tab==="todos"&&(curKey===todayKey?"今天":curDate.getMonth()+1+"/"+curDate.getDate())}
              {tab==="ideas"&&ideas.length+" 条想法"}
            </div>
          </div>
          {tab==="habits"&&(
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              <button onClick={()=>setModal(true)} style={{background:"#6366f1",border:"none",color:"#fff",padding:"7px 14px",borderRadius:"9px",cursor:"pointer",fontSize:"13px",fontWeight:"700"}}>+ 新增</button>
              <div style={{background:T.card,border:"1px solid "+T.cardBorder,padding:"5px 8px",borderRadius:"8px",display:"flex",gap:"2px"}}>
                <button onClick={()=>{const d=new Date(curDate);d.setDate(d.getDate()-7);setCurDate(d);}} style={{background:"none",border:"none",color:T.textSub,cursor:"pointer",fontSize:"16px",padding:"0 2px"}}>←</button>
                <button onClick={()=>{const d=new Date(curDate);d.setDate(d.getDate()+7);setCurDate(d);}} style={{background:"none",border:"none",color:T.textSub,cursor:"pointer",fontSize:"16px",padding:"0 2px"}}>→</button>
              </div>
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:"3px",background:T.card,borderRadius:"10px",padding:"3px",border:"1px solid "+T.cardBorder}}>
          {TABS.map(([t,icon,l])=>(<button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"7px 0",borderRadius:"7px",border:"none",background:tab===t?"#6366f1":"transparent",color:tab===t?"#fff":T.textSub,fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>{icon} {l}</button>))}
        </div>
      </div>

      <div style={{padding:"14px 20px 110px"}}>
        {tab==="habits"&&(
          <>
            <WeekGrid habits={daily} scope="daily" label="每日习惯" color="#6366f1" {...gridProps}/>
            <WeekGrid habits={weekly} scope="weekly" label="每周目标" color="#f97316" {...gridProps}/>
            <WeekGrid habits={monthly} scope="monthly" label="月度目标" color="#0284c7" {...gridProps}/>
            <WeekGrid habits={anytime} scope="daily" label="随时触发" color="#e11d48" {...gridProps}/>
            <button onClick={()=>setModal(true)} style={{width:"100%",padding:"14px",borderRadius:"12px",border:"1.5px dashed "+T.cardBorder,background:"transparent",color:T.textMuted,fontSize:"13px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",marginTop:"8px"}}>+ 新增习惯</button>
          </>
        )}
        {tab==="review"&&<ReviewTab habits={habits} completions={completions} today={today}/>}
        {tab==="todos"&&(
          <>
            <div style={{display:"flex",alignItems:"center",gap:"8px",margin:"4px 0 14px"}}>
              <button onClick={()=>{const d=new Date(curDate);d.setDate(d.getDate()-1);setCurDate(d);}} style={{background:T.card,border:"1px solid "+T.cardBorder,color:T.textSub,padding:"6px 10px",borderRadius:"8px",cursor:"pointer"}}>←</button>
              <div style={{flex:1,textAlign:"center",fontSize:"13px",fontWeight:"600",color:curKey===todayKey?"#6366f1":T.textSub}}>
                {curKey===todayKey?"今天":curDate.getMonth()+1+"月"+curDate.getDate()+"日 "+["日","一","二","三","四","五","六"][curDate.getDay()]}
              </div>
              <button onClick={()=>{const d=new Date(curDate);d.setDate(d.getDate()+1);setCurDate(d);}} style={{background:T.card,border:"1px solid "+T.cardBorder,color:T.textSub,padding:"6px 10px",borderRadius:"8px",cursor:"pointer"}}>→</button>
            </div>
            <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
              <input value={newTodo} onChange={e=>setNewTodo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTodo()} placeholder="添加待办..."
                style={{flex:1,padding:"11px 14px",borderRadius:"10px",background:T.inputBg,border:"1.5px solid "+T.divider,color:T.textPrimary,fontSize:"14px",outline:"none"}}/>
              <button onClick={addTodo} style={{padding:"0 16px",borderRadius:"10px",border:"none",background:"#6366f1",color:"#fff",fontSize:"20px",cursor:"pointer"}}>+</button>
            </div>
            {todos.filter(t=>t.date===curKey).length===0&&<div style={{textAlign:"center",color:T.textMuted,padding:"40px 0",fontSize:"13px"}}>当天没有待办 ✨</div>}
            <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
              {todos.filter(t=>t.date===curKey).map(t=>(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"13px 14px",borderRadius:"12px",background:T.card,border:"1px solid "+T.cardBorder}}>
                  <div onClick={()=>toggleTodo(t.id,t.done)} style={{width:"20px",height:"20px",borderRadius:"6px",flexShrink:0,border:"2px solid "+(t.done?"#6366f1":T.cardBorder),background:t.done?"#6366f1":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",color:"#fff"}}>{t.done&&"✓"}</div>
                  <span style={{flex:1,fontSize:"14px",color:t.done?T.textMuted:T.textPrimary,textDecoration:t.done?"line-through":"none"}}>{t.text}</span>
                  <button onClick={()=>deleteTodo(t.id)} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:"18px"}}>×</button>
                </div>
              ))}
            </div>
          </>
        )}
        {tab==="ideas"&&(
          <>
            <div style={{background:T.card,borderRadius:"14px",padding:"14px",border:"1px solid "+T.cardBorder,marginBottom:"14px"}}>
              <textarea value={newIdea} onChange={e=>setNewIdea(e.target.value)} placeholder="记录一个想法..." rows={3}
                style={{width:"100%",background:"transparent",border:"none",color:T.textPrimary,fontSize:"14px",outline:"none",resize:"none",lineHeight:"1.6",boxSizing:"border-box"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"10px",paddingTop:"10px",borderTop:"1px solid "+T.divider}}>
                <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                  {Object.keys(TAG_COLORS).map(t=>(<button key={t} onClick={()=>setNewTag(t)} style={{padding:"3px 10px",borderRadius:"20px",border:"none",background:newTag===t?tagColor(t)+"22":T.inputBg,color:newTag===t?tagColor(t):T.textSub,fontSize:"11px",fontWeight:"600",cursor:"pointer"}}>#{t}</button>))}
                </div>
                <button onClick={addIdea} style={{padding:"7px 16px",borderRadius:"8px",border:"none",background:newIdea.trim()?"#6366f1":T.divider,color:newIdea.trim()?"#fff":T.textMuted,fontSize:"13px",fontWeight:"700",cursor:"pointer",flexShrink:0}}>保存</button>
              </div>
            </div>
            <div style={{display:"flex",gap:"6px",overflowX:"auto",paddingBottom:"4px",marginBottom:"12px"}}>
              {allTags.map(t=>(<button key={t} onClick={()=>setFTag(t)} style={{padding:"4px 12px",borderRadius:"20px",border:"1px solid "+(filterTag===t?"#6366f1":T.cardBorder),flexShrink:0,background:filterTag===t?"#6366f1":T.card,color:filterTag===t?"#fff":T.textSub,fontSize:"12px",fontWeight:"600",cursor:"pointer"}}>{t==="全部"?"全部 "+ideas.length:"#"+t+" "+ideas.filter(i=>i.tag===t).length}</button>))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {filteredIdeas.map(idea=>(
                <div key={idea.id} style={{background:T.card,borderRadius:"14px",padding:"14px",border:"1px solid "+T.cardBorder}}>
                  {editingIdea===idea.id?(
                    <textarea defaultValue={idea.text} autoFocus onBlur={e=>{updateIdea(idea.id,e.target.value);setEd(null);}} rows={3}
                      style={{width:"100%",background:"transparent",border:"none",color:T.textPrimary,fontSize:"14px",outline:"none",resize:"none",lineHeight:"1.6",boxSizing:"border-box"}}/>
                  ):(
                    <div style={{fontSize:"14px",color:T.textPrimary,lineHeight:"1.7",marginBottom:"10px",cursor:"text",whiteSpace:"pre-wrap"}} onDoubleClick={()=>setEd(idea.id)}>{idea.text}</div>
                  )}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                      <span style={{fontSize:"11px",fontWeight:"600",color:tagColor(idea.tag),background:tagColor(idea.tag)+"18",padding:"2px 8px",borderRadius:"10px"}}>#{idea.tag}</span>
                      <span style={{fontSize:"11px",color:T.textMuted}}>{formatTime(new Date(idea.created_at).getTime())}</span>
                    </div>
                    <div style={{display:"flex",gap:"8px"}}>
                      <button onClick={()=>setEd(idea.id)} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:"13px"}}>编辑</button>
                      <button onClick={()=>deleteIdea(idea.id)} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:"13px"}}>删除</button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredIdeas.length===0&&<div style={{textAlign:"center",color:T.textMuted,padding:"40px 0",fontSize:"13px"}}>还没有想法，随时记录 💡</div>}
            </div>
          </>
        )}
      </div>

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"520px",padding:"10px 20px 28px",background:"linear-gradient(0deg,"+T.bg+" 65%,transparent)",display:"flex",justifyContent:"space-around"}}>
        {TABS.map(([t,icon,label])=>(<button key={t} onClick={()=>setTab(t)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",background:"none",border:"none",cursor:"pointer",color:tab===t?"#6366f1":T.textMuted}}><span style={{fontSize:"20px"}}>{icon}</span><span style={{fontSize:"10px",fontWeight:"700"}}>{label}</span></button>))}
      </div>
    </div>
  );
}
