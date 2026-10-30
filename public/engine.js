export const SAVE_KEY = 'crossroads-first-briefing-v1';
export const SETTINGS_KEY = 'crossroads-first-briefing-settings-v1';
export const PROGRESS_KEY = 'crossroads-first-briefing-completed-v1';
export const VERSION = 1;
export function shuffle(items, random = Math.random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i],out[j]] = [out[j],out[i]]; }
  return out;
}
export function freshRun(mission, random = Math.random) {
  return {version:VERSION,caseId:mission.id,stage:0,read:[],observationId:null,observationSubmitted:false,actionId:null,evidenceIds:[],decisionSubmitted:false,updateId:null,updateSubmitted:false,recommendation:'',perspective:mission.careers[0].id,orders:{question:shuffle(mission.question.options.map(o=>o.id),random),actions:shuffle(mission.choices.map(o=>o.id),random),updates:shuffle(mission.development.options.map(o=>o.id),random)},mentor:null,mentorKey:null};
}
export function validateRun(value, missions) {
  if (!value || typeof value !== 'object' || value.version !== VERSION) return null;
  const m = missions.find(m=>m.id===value.caseId); if (!m || !Number.isInteger(value.stage) || value.stage<0 || value.stage>5) return null;
  const validIds = (arr, choices, max) => Array.isArray(arr) && arr.length<=max && new Set(arr).size===arr.length && arr.every(id=>choices.some(c=>c.id===id));
  if (!validIds(value.read,m.sources,3) || !validIds(value.evidenceIds,m.sources,2)) return null;
  if (![null,...m.question.options.map(x=>x.id)].includes(value.observationId) || ![null,...m.choices.map(x=>x.id)].includes(value.actionId) || ![null,...m.development.options.map(x=>x.id)].includes(value.updateId)) return null;
  if (typeof value.recommendation!=='string' || value.recommendation.length>1200 || !m.careers.some(c=>c.id===value.perspective)) return null;
  for (const flag of ['observationSubmitted','decisionSubmitted','updateSubmitted']) if(typeof value[flag]!=='boolean') return null;
  if(value.observationSubmitted && (!value.observationId || value.read.length!==3)) return null;
  if(value.decisionSubmitted && (!value.actionId || value.evidenceIds.length!==2 || !value.observationSubmitted)) return null;
  if(value.updateSubmitted && (!value.updateId || !value.decisionSubmitted)) return null;
  if(value.stage>=2 && !value.observationSubmitted || value.stage>=3 && !value.decisionSubmitted || value.stage>=4 && !value.updateSubmitted) return null;
  const groups={question:m.question.options,actions:m.choices,updates:m.development.options};
  for(const [key,choices] of Object.entries(groups)) if(!validIds(value.orders?.[key],choices,choices.length) || value.orders[key].length!==choices.length) return null;
  const clean=freshRun(m);
  for(const key of Object.keys(clean)) if(!['mentor','mentorKey'].includes(key)) clean[key]=value[key];
  const limits={headline:100,strength:360,nextStep:360,insideJob:700,nextQuestion:240};
  if(value.mentor && typeof value.mentor==='object' && !Array.isArray(value.mentor) && Object.keys(value.mentor).length===5 && Object.entries(limits).every(([k,max])=>typeof value.mentor[k]==='string' && value.mentor[k].trim() && [...value.mentor[k]].length<=max) && value.mentorKey===JSON.stringify(mentorPayload(clean))){
    clean.mentor=Object.fromEntries(Object.keys(limits).map(k=>[k,value.mentor[k]]));clean.mentorKey=value.mentorKey;
  }
  return clean;
}
export function pickNext(missions,currentId,completed=[],random=Math.random) {
  const available=missions.filter(m=>m.id!==currentId && !completed.includes(m.id));
  const pool=available.length?available:missions.filter(m=>m.id!==currentId);
  return pool[Math.floor(random()*pool.length)] || missions[0];
}
export function mentorPayload(run) {
 return {caseId:run.caseId,actionId:run.actionId,evidenceIds:[...run.evidenceIds],observationId:run.observationId,updateId:run.updateId,perspective:run.perspective,recommendation:run.recommendation.trim()};
}
export function insight(m,run) {
 const q=m.question.options.find(o=>o.id===run.observationId);
 const a=m.choices.find(o=>o.id===run.actionId);
 const u=m.development.options.find(o=>o.id===run.updateId);
 const habits=[{name:'Checking the signal',icon:'search',quality:q?.quality||0,text:q?.feedback||''},{name:'Seeing the wider picture',icon:'network',quality:a?.quality||0,text:a?.consequence||''},{name:'Updating your judgement',icon:'spark',quality:u?.quality||0,text:u?.feedback||''}];
 const strongest=[...habits].sort((x,y)=>y.quality-x.quality)[0];
 const next=[...habits].sort((x,y)=>x.quality-y.quality)[0];
 return {habits,strongest,next,action:a};
}
export function escapeHTML(value) {return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
