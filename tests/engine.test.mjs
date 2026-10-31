import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {freshRun,validateRun,shuffle,pickNext,mentorPayload,insight,escapeHTML,SAVE_KEY,hasContribution,validFeedback,FEEDBACK_LIMITS} from '../public/engine.js';
const missions=JSON.parse(readFileSync(new URL('../data/missions.json',import.meta.url)));
function complete(m,worst=false){const r=freshRun(m);r.stage=5;r.read=m.sources.map(s=>s.id);r.evidenceIds=r.read.slice(0,2);r.observationId=[...m.question.options].sort((a,b)=>worst?a.quality-b.quality:b.quality-a.quality)[0].id;r.observationSubmitted=true;r.actionId=[...m.choices].sort((a,b)=>worst?a.quality-b.quality:b.quality-a.quality)[0].id;r.decisionSubmitted=true;r.updateId=[...m.development.options].sort((a,b)=>worst?a.quality-b.quality:b.quality-a.quality)[0].id;r.updateSubmitted=true;r.recommendation='Keep the response proportional and check the next evidence.';r.assessmentSubmitted=true;return r;}
for(const m of missions){
 test(`${m.id}: strong and weak decisions both complete and reload safely`,()=>{for(const weak of [false,true]){const r=complete(m,weak);assert.deepEqual(validateRun(JSON.parse(JSON.stringify(r)),missions),r);assert.equal(insight(m,r).habits.length,3);assert.equal(insight(m,r).action.id,r.actionId);assert.deepEqual(mentorPayload(r).evidenceIds,r.evidenceIds);}});
 test(`${m.id}: orders remain complete, independent and stable after reload`,()=>{const r=complete(m);assert.deepEqual(new Set(r.orders.actions),new Set(m.choices.map(x=>x.id)));assert.deepEqual(new Set(r.orders.question),new Set(m.question.options.map(x=>x.id)));assert.deepEqual(validateRun(r,missions).orders,r.orders);});
 test(`${m.id}: restart resets decisions, briefing and assessment`,()=>{const r=complete(m);r.recommendation='My recommendation';r.mentor={headline:'Old'};const reset=freshRun(m);assert.equal(reset.stage,0);assert.equal(reset.recommendation,'');assert.equal(reset.mentor,null);assert.deepEqual(reset.read,[]);assert.deepEqual(reset.evidenceIds,[]);assert.equal(reset.updateSubmitted,false);});
}
test('saves are isolated from the classroom game',()=>assert.equal(SAVE_KEY,'crossroads-first-briefing-v1'));
test('unknown case, out-of-range stage and mismatched identifiers invalidate saves',()=>{const r=complete(missions[0]);for(const patch of [{caseId:'fake'},{stage:-1},{stage:6},{stage:2.5},{actionId:'fake'},{observationId:'fake'},{updateId:'fake'},{perspective:'fake'}])assert.equal(validateRun({...r,...patch},missions),null);});
test('a partial or corrupt save cannot unlock later steps',()=>{const r=complete(missions[0]);for(const patch of [{decisionSubmitted:false},{observationSubmitted:false},{updateSubmitted:false},{read:['s1']},{evidenceIds:['s1','s1']},{evidenceIds:['s1','fake']},{orders:{question:[],actions:[],updates:[]}}])assert.equal(validateRun({...r,...patch},missions),null);});
test('missing fields and wrong types are rejected without throwing',()=>{for(const v of [null,[],{},true,3,'abc'])assert.equal(validateRun(v,missions),null);assert.equal(validateRun({...freshRun(missions[0]),recommendation:[]},missions),null);assert.equal(validateRun({...freshRun(missions[0]),recommendation:'x'.repeat(1201)},missions),null);});
test('random assignment visits unexplored missions before replaying',()=>{const remaining=missions[6];assert.equal(pickNext(missions,missions[0].id,missions.filter(m=>m!==remaining).map(m=>m.id)).id,remaining.id);assert.notEqual(pickNext(missions,missions[0].id,missions.map(m=>m.id)).id,missions[0].id);});
test('shuffle is non-mutating and preserves every option',()=>{const a=['a','b','c'];const b=shuffle(a,()=>0);assert.deepEqual(a,['a','b','c']);assert.equal(new Set(b).size,3);assert.notDeepEqual(a,b);});
test('untrusted writing and mentor strings render as text',()=>{assert.equal(escapeHTML('<script>"&\'</script>'),'&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;');});
test('mentor request contains all decisions and required writing, independent of career browsing',()=>{const r=complete(missions[0]);r.recommendation='  A short recommendation.  ';assert.deepEqual(Object.keys(mentorPayload(r)).sort(),['actionId','caseId','evidenceIds','observationId','recommendation','updateId'].sort());assert.equal(mentorPayload(r).recommendation,'A short recommendation.');});

test('all selectable groups are shuffled, with all six orders possible and no content mutation',()=>{
 const m=missions[0],original=JSON.stringify(m),groups={question:m.question.options,actions:m.choices,updates:m.development.options,sources:m.sources,careers:m.careers};
 const orders=Object.fromEntries(Object.keys(groups).map(key=>[key,new Set()]));
 for(const pair of [[0,0],[0,.9],[.5,0],[.5,.9],[.9,0],[.9,.9]]){
  let n=0;const r=freshRun(m,()=>pair[n++%2]);
  for(const [key,items] of Object.entries(groups)){
   assert.deepEqual(new Set(r.orders[key]),new Set(items.map(item=>item.id)));
   orders[key].add(r.orders[key].join(','));
  }
 }
 for(const values of Object.values(orders))assert.equal(values.size,6);
 assert.equal(JSON.stringify(m),original);
});
test('older completed saves return to the writing step without discarding choices or sending consent',()=>{
 for(const recommendation of ['', 'My earlier writing.']){
  const old=complete(missions[0]);delete old.assessmentSubmitted;delete old.orders.sources;delete old.orders.careers;old.recommendation=recommendation;old.mentor={headline:'Earlier optional feedback'};
  const restored=validateRun(old,missions);
  assert.equal(restored.stage,4);assert.equal(restored.assessmentSubmitted,false);assert.equal(restored.actionId,old.actionId);assert.equal(restored.recommendation,recommendation);assert.equal(restored.mentor,null);
  assert.equal(restored.orders.sources.length,3);assert.equal(restored.orders.careers.length,3);
 }
});
test('completed submissions require writing and cannot exist before the final stage',()=>{
 const r=complete(missions[0]);
 for(const recommendation of ['', '  \n\t ', '\u00a0'])assert.equal(validateRun({...r,recommendation},missions),null);
 assert.equal(validateRun({...r,stage:4},missions),null);
 assert.equal(hasContribution('  '),false);assert.equal(hasContribution('My own judgement.'),true);
});
test('career browsing does not invalidate the submitted assessment',()=>{
 const r=complete(missions[0]),payload=mentorPayload(r);r.perspective=missions[0].careers[1].id;assert.deepEqual(mentorPayload(r),payload);
});
test('new feedback must contain bounded writing, impact and programme assessments',()=>{
 const f=Object.fromEntries(Object.keys(FEEDBACK_LIMITS).map(key=>[key,'A useful assessment.']));assert.ok(validFeedback(f));
 for(const key of ['judgement','impact','studyPath']){const bad={...f};delete bad[key];assert.ok(!validFeedback(bad));assert.ok(!validFeedback({...f,[key]:'x'.repeat(FEEDBACK_LIMITS[key]+1)}));}
 assert.ok(!validFeedback({...f,extra:'Unexpected'}));
});
