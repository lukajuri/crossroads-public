import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import * as engine from '../public/engine.js';
import {landPath} from '../public/assets/land-path.js';

// Normally resolved from devDependencies. A transient external runtime can be used in CI sandboxes.
const require = createRequire(import.meta.url);
const {JSDOM, VirtualConsole} = process.env.CROSSROADS_TEST_RUNTIME
  ? createRequire(`${process.env.CROSSROADS_TEST_RUNTIME}/package.json`)('jsdom')
  : require('jsdom');
const root = new URL('../', import.meta.url);
const [html, source, missions] = await Promise.all([
  readFile(new URL('public/index.html', root), 'utf8'),
  readFile(new URL('public/app.js', root), 'utf8'),
  readFile(new URL('data/missions.json', root), 'utf8').then(JSON.parse),
]);
const flush = () => new Promise(resolve => setImmediate(resolve));
const best = options => [...options].sort((a,b) => b.quality-a.quality)[0].id;
const deferred = () => {let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const reply = (data, status=200, type='application/json') => ({ok:status>=200&&status<300,status,headers:{get:()=>type},json:async()=>data});
const feedback = {
  headline:'The connections behind your advice',
  strength:'You checked the evidence before drawing a conclusion.',
  nextStep:'Explain who bears the cost of a delay.',
  insideJob:'A risk analyst turns changing information into advice an operations team can use.',
  nextQuestion:'Which new observation would change your recommendation?',
};
function finished(m, recommendation='A cautious recommendation.') {
  return {...engine.freshRun(m,()=>.5),stage:5,read:m.sources.map(s=>s.id),observationId:best(m.question.options),observationSubmitted:true,actionId:best(m.choices),evidenceIds:m.sources.slice(0,2).map(s=>s.id),decisionSubmitted:true,updateId:best(m.development.options),updateSubmitted:true,recommendation};
}

async function open({saved, rawSave, onMentor, noStorage=false, dataFailure=false}={}) {
  const errors=[], calls=[], timers=new Map();let nextTimer=0;
  const virtualConsole=new VirtualConsole();
  virtualConsole.on('jsdomError', error=>errors.push(error));
  const dom=new JSDOM(html,{url:'https://game.example/crossroads/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
  const {window}=dom, doc=window.document;
  window.scrollTo=()=>{};
  window.HTMLElement.prototype.scrollIntoView=()=>{};
  window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  window.setTimeout=(callback,ms)=>{const id=++nextTimer;timers.set(id,{callback,ms});return id;};
  window.clearTimeout=id=>timers.delete(id);
  if(saved)window.localStorage.setItem(engine.SAVE_KEY,JSON.stringify(saved));
  if(rawSave!==undefined)window.localStorage.setItem(engine.SAVE_KEY,rawSave);
  if(noStorage)Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage unavailable');}});
  window.fetch=async(url,options={})=>{
    if(url==='data/missions.json'){
      if(dataFailure)throw new Error('Offline');
      return reply(missions);
    }
    assert.equal(url,'api/mentor.php','no unexpected network request');
    calls.push({url,...options,payload:JSON.parse(options.body)});
    return onMentor?onMentor(options,calls):reply({feedback});
  };
  window.__engine=engine;
  window.__landPath=landPath;
  const executable=source.replace(/import\s*\{landPath\}\s*from\s*['"]\.\/assets\/land-path\.js['"];?/, 'const landPath=window.__landPath;').replace(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/engine\.js['"];?/,(_,names)=>`const {${names.replace(/\s+as\s+/g,':')}}=window.__engine;`);
  window.eval(executable+'\n//# sourceURL=crossroads-app-runtime-test.js');
  await flush();
  const click=selector=>{const element=doc.querySelector(selector);assert.ok(element,`control exists: ${selector}`);assert.notEqual(element.disabled,true,`control enabled: ${selector}`);element.click();return element;};
  const savedRun=()=>JSON.parse(window.localStorage.getItem(engine.SAVE_KEY));
  const ask=()=>{click('[data-do="mentor-consent"]');assert.equal(doc.querySelector('#modal').open,true);click('[data-do="consent-mentor"]');};
  return {dom,window,doc,calls,errors,timers,click,ask,savedRun,close:()=>dom.window.close()};
}

async function completeMission(h,m,{recommendation=''}={}) {
  h.click('[data-do="start"]');
  assert.ok(h.doc.querySelector('[data-do="check-observation"]').disabled,'initial evidence gate');
  for(const s of m.sources)h.click(`[data-source="${s.id}"]`);
  h.click(`[data-observation="${best(m.question.options)}"]`);
  h.click('[data-do="check-observation"]');
  h.click('[data-do="to-decide"]');
  h.click(`[data-action="${best(m.choices)}"]`);
  for(const s of m.sources.slice(0,2))h.click(`[data-evidence="${s.id}"]`);
  h.click('[data-do="send-advice"]');
  h.click('[data-do="to-update"]');
  h.click(`[data-update="${best(m.development.options)}"]`);
  h.click('[data-do="check-update"]');
  h.click('[data-do="to-briefing"]');
  const input=h.doc.querySelector('#recommendation');
  input.value=recommendation;input.dispatchEvent(new h.window.Event('input',{bubbles:true}));
  h.click('[data-do="finish"]');
  assert.ok(h.doc.querySelector('.debrief'),'completed debrief rendered');
  assert.equal(h.savedRun().stage,5);
  assert.equal(h.savedRun().recommendation,recommendation);
}

for(const m of missions){
  test(`DOM mission completes with optional writing: ${m.id}`,async()=>{
    const h=await open({saved:engine.freshRun(m,()=>.5)});
    try{
      await completeMission(h,m,{recommendation:'Consider the evidence and affected people.'});
      assert.equal(h.calls.length,0,'AI never required to finish');
      assert.equal(h.doc.querySelectorAll('.career-tab').length,3);
      assert.equal(h.errors.length,0);
    }finally{h.close();}
  });
}

test('AI consent, waiting, safe success rendering and cached reload',async()=>{
  const pending=deferred(),malicious={...feedback,headline:'<img src=x onerror="window.injected=true">',insideJob:'<script>window.injected=true</script>'};
  const h=await open({saved:finished(missions[0]),onMentor:()=>pending.promise});
  let saved;
  try{
    assert.equal(h.calls.length,0);
    h.click('[data-do="mentor-consent"]');
    assert.equal(h.calls.length,0,'opening consent makes no AI request');
    h.click('[data-do="consent-mentor"]');
    assert.equal(h.doc.querySelector('.wait').getAttribute('aria-busy'),'true');
    assert.equal(h.doc.querySelector('[data-do="mentor-consent"]').disabled,true);
    assert.equal(h.calls.length,1);
    assert.equal(h.calls[0].payload.recommendation,'A cautious recommendation.');
    pending.resolve(reply({feedback:malicious}));await flush();
    assert.equal(h.doc.querySelector('.wait'),null);
    assert.equal(h.doc.querySelector('.ai-response h3').textContent,malicious.headline);
    assert.equal(h.doc.querySelector('.ai-response script'),null);
    assert.equal(h.doc.querySelector('.ai-response img'),null);
    assert.equal(h.window.injected,undefined);
    saved=h.savedRun();
    assert.deepEqual(saved.mentor,malicious);
  }finally{h.close();}
  const reloaded=await open({saved});
  try{
    assert.equal(reloaded.doc.querySelector('.ai-response h3').textContent,malicious.headline);
    reloaded.click('[data-do="mentor-consent"]');
    assert.equal(reloaded.calls.length,0,'saved same-payload feedback reused');
    assert.equal(reloaded.doc.querySelector('#modal').open,false,'cached feedback needs no resend');
  }finally{reloaded.close();}
});

test('AI failure keeps debrief and writing, then retry succeeds',async()=>{
  let number=0;
  const h=await open({saved:finished(missions[0],'Keep this text.'),onMentor:()=>++number===1?reply({message:'Private internal error'},503):reply({feedback})});
  try{
    h.ask();await flush();
    assert.ok(h.doc.querySelector('.ai-error'));
    assert.ok(h.doc.querySelector('.habit-list'),'authored feedback remains');
    assert.equal(h.savedRun().recommendation,'Keep this text.');
    assert.ok(!h.doc.body.textContent.includes('Private internal error'),'upstream errors not exposed');
    h.click('[data-do="ask-mentor"]');await flush();
    assert.ok(h.doc.querySelector('.ai-response'));
    assert.equal(h.calls.length,2);
  }finally{h.close();}
});

test('static-host HTML response and malformed JSON feedback remain recoverable',async()=>{
  for(const response of [reply(null,200,'text/html'),reply({feedback:{headline:'Missing fields'}})]){
    const h=await open({saved:finished(missions[0]),onMentor:()=>response});
    try{
      h.ask();await flush();
      assert.ok(h.doc.querySelector('.ai-error'));
      assert.equal(h.doc.querySelector('.wait'),null);
      assert.ok(h.doc.querySelector('.debrief'));
      assert.equal(h.savedRun().mentor,null);
    }finally{h.close();}
  }
});

test('AI timeout aborts once and preserves the completed briefing',async()=>{
  const h=await open({saved:finished(missions[0]),onMentor:options=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new h.window.DOMException('Timeout','AbortError'))))});
  try{
    h.ask();
    const timer=[...h.timers.values()].find(timer=>timer.ms===47000);
    assert.ok(timer,'request has a finite timeout');
    timer.callback();await flush();
    assert.equal(h.calls[0].signal.aborted,true);
    assert.match(h.doc.querySelector('.ai-error').textContent,/longer than expected/);
    assert.equal(h.savedRun().stage,5);
    assert.equal(h.calls.length,1,'no automatic paid retry');
  }finally{h.close();}
});

test('career change cancels pending AI and ignores a late old-perspective response',async()=>{
  const old=deferred(),fresh=deferred();
  const h=await open({saved:finished(missions[0]),onMentor:(options,calls)=>calls.length===1?old.promise:fresh.promise});
  try{
    h.ask();
    const newCareer=missions[0].careers[1];
    h.click(`[data-career="${newCareer.id}"]`);
    assert.equal(h.calls[0].signal.aborted,true);
    assert.equal(h.doc.querySelector('.wait'),null);
    old.resolve(reply({feedback:{...feedback,headline:'Stale response'}}));await flush();
    assert.equal(h.doc.querySelector('.ai-response'),null);
    assert.equal(h.savedRun().perspective,newCareer.id);
    assert.equal(h.savedRun().mentor,null);
    h.ask();fresh.resolve(reply({feedback:{...feedback,headline:'A different professional view'}}));await flush();
    assert.equal(h.doc.querySelector('.ai-response h3').textContent,'A different professional view');
    assert.equal(h.calls[1].payload.perspective,newCareer.id);
  }finally{h.close();}
});

test('restart cancels pending AI without letting a late response overwrite a fresh mission',async()=>{
  const pending=deferred();
  const h=await open({saved:finished(missions[0]),onMentor:()=>pending.promise});
  try{
    h.ask();h.click('[data-do="restart"]');h.click('[data-do="confirm-restart"]');
    assert.equal(h.calls[0].signal.aborted,true);
    pending.resolve(reply({feedback}));await flush();
    assert.equal(h.savedRun().stage,0);
    assert.equal(h.savedRun().mentor,null);
    assert.ok(h.doc.querySelector('.intro-shell'));
    assert.equal(h.doc.querySelector('.ai-response'),null);
  }finally{h.close();}
});

test('completed AI response is saved while mission collection stays open',async()=>{
  const pending=deferred();
  const h=await open({saved:finished(missions[0]),onMentor:()=>pending.promise});
  try{
    h.ask();h.click('[data-do="collection"]');
    pending.resolve(reply({feedback}));await flush();
    assert.ok(h.doc.querySelector('.collection'),'request does not change navigation');
    assert.equal(h.savedRun().mentor.headline,feedback.headline);
    h.click('#brand');h.click('[data-do="start"]');
    assert.equal(h.savedRun().mentor,null,'explicit replay starts a fresh mission');
  }finally{h.close();}
});

test('corrupt saved JSON and invalid save shapes fall back to a new mission',async()=>{
  for(const rawSave of ['not json',JSON.stringify({version:1,caseId:'koper',stage:99}),JSON.stringify({version:1,caseId:'koper',stage:5})]){
    const h=await open({rawSave});
    try{
      assert.ok(h.doc.querySelector('.intro-shell'));
      assert.ok(!h.doc.querySelector('#reload'),'corrupt progress does not break startup');
      h.click('[data-do="start"]');
      assert.equal(h.savedRun().stage,1);
      assert.equal(h.errors.length,0);
    }finally{h.close();}
  }
});

test('invalid saved mentor is discarded while legitimate completed work survives',async()=>{
  for(const mentor of [{...feedback,strength:''},{...feedback,extra:'Unexpected'}, {...feedback,insideJob:'x'.repeat(701)}]){
    const saved=finished(missions[0]);saved.mentor=mentor;saved.mentorKey=JSON.stringify(engine.mentorPayload(saved));
    const h=await open({saved});
    try{
      assert.ok(h.doc.querySelector('.debrief'));
      assert.equal(h.doc.querySelector('.ai-response'),null);
      assert.ok(h.doc.querySelector('.habit-list'));
    }finally{h.close();}
  }
});

test('blocked storage allows play and communicates the saving limitation',async()=>{
  const h=await open({noStorage:true});
  try{
    h.click('[data-do="start"]');
    assert.ok(h.doc.querySelector('.desk'));
    assert.match(h.doc.querySelector('#toast').textContent,/cannot save/);
    assert.equal(h.errors.length,0);
  }finally{h.close();}
});

test('data-loading failure offers recovery without invoking AI',async()=>{
  const h=await open({dataFailure:true});
  try{
    assert.ok(h.doc.querySelector('#reload'));
    assert.equal(h.calls.length,0);
  }finally{h.close();}
});
