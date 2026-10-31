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
  judgement:'Your contribution gives a practical reason for keeping essential traffic moving.',
  impact:'A targeted hold could protect workers while allowing essential deliveries. Your source judgement also avoids spreading an unverified claim.',
  studyPath:'Explore EMUNI’s MA in Mediterranean Geopolitics and Geoeconomics. Research Methodology and Analytical Tools can develop the evidence skills behind this work.',
  nextStep:'Explain who bears the cost of a delay.',
  insideJob:'A risk analyst turns changing information into advice an operations team can use.',
  nextQuestion:'Which new observation would change your recommendation?',
};
function finished(m, recommendation='A cautious recommendation.') {
  return {...engine.freshRun(m,()=>.5),stage:5,read:m.sources.map(s=>s.id),observationId:best(m.question.options),observationSubmitted:true,actionId:best(m.choices),evidenceIds:m.sources.slice(0,2).map(s=>s.id),decisionSubmitted:true,updateId:best(m.development.options),updateSubmitted:true,recommendation,assessmentSubmitted:true};
}

async function open({saved, rawSave, onMentor, noStorage=false, dataFailure=false, settings, blockAutoplay=false, random, openAtStory=true}={}) {
  const errors=[], calls=[], timers=new Map();let nextTimer=0;
  const virtualConsole=new VirtualConsole();
  virtualConsole.on('jsdomError', error=>errors.push(error));
  const dom=new JSDOM(html,{url:'https://game.example/crossroads/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
  const {window}=dom, doc=window.document;
  const audio={plays:0,pauses:0,paused:true,blockNext:blockAutoplay};
  Object.defineProperty(window.HTMLMediaElement.prototype,'paused',{get(){return audio.paused;}});
  window.HTMLMediaElement.prototype.play=function(){
    audio.plays++;
    if(audio.blockNext){audio.blockNext=false;return Promise.reject(new window.DOMException('A gesture is required.','NotAllowedError'));}
    audio.paused=false;return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause=function(){audio.pauses++;audio.paused=true;};
  if(settings!==undefined)window.localStorage.setItem(engine.SETTINGS_KEY,JSON.stringify(settings));
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
  window.__engine=random?{...engine,pickNext:(items,current,completed)=>engine.pickNext(items,current,completed,random)}:engine;
  window.__landPath=landPath;
  const executable=source.replace(/import\s*\{landPath\}\s*from\s*['"]\.\/assets\/land-path\.js['"];?/, 'const landPath=window.__landPath;').replace(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/engine\.js(?:\?v=\d+)?['"];?/,(_,names)=>`const {${names.replace(/\s+as\s+/g,':')}}=window.__engine;`);
  window.eval(executable+'\n//# sourceURL=crossroads-app-runtime-test.js');
  await flush();
  const click=selector=>{const element=doc.querySelector(selector);assert.ok(element,`control exists: ${selector}`);assert.notEqual(element.disabled,true,`control enabled: ${selector}`);element.click();return element;};
  // Most mission tests begin at a saved story; exercise the visible Continue
  // control as their setup. Opening-screen tests opt out of this navigation.
  if(saved&&openAtStory&&doc.querySelector('[data-do="resume"]'))click('[data-do="resume"]');
  const start=()=>{
    if(doc.querySelector('.welcome-shell')){
      if(doc.querySelector('[data-do="resume"]'))click('[data-do="resume"]');
      else {click('[data-do="collection"]');click('[data-mission="koper"]');}
    }
    if(doc.querySelector('.intro-shell'))click('[data-do="start"]');
  };
  const savedRun=()=>JSON.parse(window.localStorage.getItem(engine.SAVE_KEY));
  const ask=()=>click('[data-do="ask-mentor"]');
  return {dom,window,doc,calls,errors,timers,audio,click,start,ask,savedRun,close:()=>dom.window.close()};
}

async function completeMission(h,m,{recommendation='I would check the evidence and keep essential deliveries moving.'}={}) {
  h.start();
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
  h.click('#submit-briefing');
  assert.ok(h.doc.querySelector('.debrief'),'completed debrief rendered');
  assert.equal(h.savedRun().stage,5);
  assert.equal(h.savedRun().recommendation,recommendation);
}

for(const m of missions){
  test(`DOM mission submits writing and automatically requests an assessment: ${m.id}`,async()=>{
    const h=await open({saved:engine.freshRun(m,()=>.5)});
    try{
      await completeMission(h,m,{recommendation:'Consider the evidence and affected people.'});
      assert.equal(h.calls.length,1,'final submission automatically requests AI');
      assert.deepEqual(h.calls[0].payload,engine.mentorPayload(h.savedRun()));
      await flush();
      assert.ok(h.doc.querySelector('.ai-response'));
      assert.match(h.doc.querySelector('.ai-response').textContent,/written judgement|decisions matter/);
      assert.match(h.doc.querySelector('.ai-response').textContent,/Mediterranean Geopolitics and Geoeconomics/);
      assert.equal(h.doc.querySelectorAll('.career-tab').length,3);
      assert.equal(h.errors.length,0);
    }finally{h.close();}
  });
}

test('informed submission starts one request, shows waiting and safely restores the full assessment',async()=>{
  const pending=deferred(),malicious={...feedback,headline:'<img src=x onerror="window.injected=true">',judgement:'<script>window.injected=true</script>'};
  const savedDraft={...finished(missions[0]),stage:4,assessmentSubmitted:false};
  const h=await open({saved:savedDraft,onMentor:()=>pending.promise});
  let saved;
  try{
    h.start();
    assert.equal(h.calls.length,0,'viewing and writing never sends data');
    assert.match(h.doc.querySelector('#submission-notice').textContent,/OpenAI/);
    assert.equal(h.doc.querySelector('#recommendation').required,true);
    h.click('#submit-briefing');
    assert.equal(h.doc.querySelector('#modal').open,false,'no second opt-in dialog');
    assert.equal(h.doc.querySelector('.wait').getAttribute('aria-busy'),'true');
    assert.equal(h.doc.querySelector('#submit-briefing'),null,'submission form replaced');
    assert.equal(h.calls.length,1);
    assert.equal(h.calls[0].payload.recommendation,'A cautious recommendation.');
    assert.deepEqual(h.calls[0].payload.evidenceIds,savedDraft.evidenceIds);
    pending.resolve(reply({feedback:malicious}));await flush();
    assert.equal(h.doc.querySelector('.wait'),null);
    assert.equal(h.doc.querySelector('.ai-response h3').textContent,malicious.headline);
    assert.equal(h.doc.querySelector('.ai-response script'),null);
    assert.equal(h.doc.querySelector('.ai-response img'),null);
    assert.equal(h.window.injected,undefined);
    saved=h.savedRun();assert.deepEqual(saved.mentor,malicious);
  }finally{h.close();}
  const reloaded=await open({saved});
  try{
    assert.equal(reloaded.doc.querySelector('.ai-response h3').textContent,malicious.headline);
    assert.equal(reloaded.calls.length,0,'saved assessment is restored without sending again');
  }finally{reloaded.close();}
});

test('blank and whitespace-only writing cannot be submitted; a draft survives reload',async()=>{
  const draft={...finished(missions[0],''),stage:4,assessmentSubmitted:false};
  const h=await open({saved:draft});let saved;
  try{
    h.start();
    const input=h.doc.querySelector('#recommendation'),button=h.doc.querySelector('#submit-briefing');
    assert.equal(button.disabled,true);
    for(const value of ['   ', '\n\t', '\u00a0']){
      input.value=value;input.dispatchEvent(new h.window.Event('input',{bubbles:true}));
      assert.equal(button.disabled,true);
      h.doc.querySelector('#briefing-form').dispatchEvent(new h.window.Event('submit',{bubbles:true,cancelable:true}));
      assert.equal(h.calls.length,0);assert.equal(h.savedRun().stage,4);
    }
    input.value='I would investigate the warning while protecting essential deliveries.';
    input.dispatchEvent(new h.window.Event('input',{bubbles:true}));
    assert.equal(button.disabled,false);assert.equal(h.calls.length,0);saved=h.savedRun();
  }finally{h.close();}
  const reloaded=await open({saved});
  try{reloaded.start();assert.equal(reloaded.doc.querySelector('#recommendation').value,saved.recommendation);assert.equal(reloaded.calls.length,0);}finally{reloaded.close();}
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

test('career browsing keeps the submitted assessment pending without cancelling or resending',async()=>{
  const pending=deferred();
  const h=await open({saved:finished(missions[0]),onMentor:()=>pending.promise});
  try{
    h.ask();const payload=h.calls[0].payload;
    const newCareer=missions[0].careers[1];h.click(`[data-career="${newCareer.id}"]`);
    assert.equal(h.calls[0].signal.aborted,false);
    assert.ok(h.doc.querySelector('.wait'));
    pending.resolve(reply({feedback}));await flush();
    assert.equal(h.doc.querySelector('.ai-response h3').textContent,feedback.headline);
    assert.equal(h.savedRun().perspective,newCareer.id);
    assert.deepEqual(engine.mentorPayload(h.savedRun()),payload);
    assert.equal(h.calls.length,1);
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
    h.click('#brand');h.click('[data-do="surprise"]');
    assert.equal(h.savedRun().mentor,null,'choosing a story from home starts a fresh mission');
  }finally{h.close();}
});

test('corrupt saved JSON and invalid save shapes fall back to story selection',async()=>{
  for(const rawSave of ['not json',JSON.stringify({version:1,caseId:'koper',stage:99}),JSON.stringify({version:1,caseId:'koper',stage:5})]){
    const h=await open({rawSave});
    try{
      assert.ok(h.doc.querySelector('.welcome-shell'));
      assert.ok(!h.doc.querySelector('#reload'),'corrupt progress does not break startup');
      h.click('[data-do="collection"]');h.click('[data-mission="koper"]');h.start();
      assert.equal(h.savedRun().stage,1);
      assert.equal(h.errors.length,0);
    }finally{h.close();}
  }
});

test('invalid saved mentor is discarded while legitimate completed work survives',async()=>{
  for(const mentor of [{...feedback,strength:''},{...feedback,extra:'Unexpected'}, {...feedback,insideJob:'x'.repeat(601)}]){
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
    h.click('[data-do="surprise"]');h.start();
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


test('soundtrack defaults on, loops at 30%, and continues through navigation',async()=>{
  const h=await open();
  try{
    const track=h.doc.querySelector('#soundtrack');
    assert.equal(track.getAttribute('src'),'assets/ticking-clock.mp3');
    assert.equal(track.loop,true);
    assert.equal(track.volume,.3);
    assert.equal(h.doc.querySelector('#sound-button').getAttribute('aria-pressed'),'true');
    assert.equal(h.audio.paused,false);
    track.currentTime=12;
    h.click('[data-do="surprise"]');h.start();
    h.click('[data-source="s1"]');
    assert.equal(h.audio.plays,1,'navigation and selections do not restart music');
    assert.equal(track.currentTime,12);
    h.click('#sound-button');
    assert.equal(h.audio.paused,true);
    assert.equal(h.doc.querySelector('#sound-button').getAttribute('aria-pressed'),'false');
    assert.equal(JSON.parse(h.window.localStorage.getItem(engine.SETTINGS_KEY)).sound,false);
    h.click('#sound-button');await flush();
    assert.equal(h.audio.paused,false);
    assert.equal(track.currentTime,12,'sound resumes where it was paused');
    assert.equal(h.audio.plays,2);
    assert.equal(h.errors.length,0);
  }finally{h.close();}
});

test('saved sound-off is respected and can be enabled',async()=>{
  const h=await open({settings:{sound:false}});
  try{
    assert.equal(h.audio.plays,0);
    assert.equal(h.doc.querySelector('#sound-button').getAttribute('aria-pressed'),'false');
    h.doc.dispatchEvent(new h.window.Event('pointerdown',{bubbles:true}));
    assert.equal(h.audio.plays,0,'interaction respects sound-off');
    h.click('#sound-button');await flush();
    assert.equal(h.audio.plays,1);
    assert.equal(h.audio.paused,false);
    assert.equal(JSON.parse(h.window.localStorage.getItem(engine.SETTINGS_KEY)).sound,true);
  }finally{h.close();}
});

for(const gesture of ['pointerdown','keydown']){
  test(`blocked autoplay retries on ${gesture} and remains controllable`,async()=>{
    const h=await open({blockAutoplay:true});
    try{
      assert.equal(h.audio.paused,true);
      assert.equal(h.audio.plays,1);
      assert.equal(h.doc.querySelector('#sound-button').getAttribute('aria-pressed'),'true');
      h.doc.querySelector('#missions-button').dispatchEvent(new h.window.Event(gesture,{bubbles:true}));
      await flush();
      assert.equal(h.audio.paused,false);
      assert.equal(h.audio.plays,2);
      h.click('#sound-button');
      assert.equal(h.audio.paused,true);
      h.doc.dispatchEvent(new h.window.Event(gesture,{bubbles:true}));
      assert.equal(h.audio.plays,2,'muted playback stays paused');
      assert.equal(h.errors.length,0);
    }finally{h.close();}
  });
}

test('turning sound off after blocked autoplay never briefly starts the track',async()=>{
  const h=await open({blockAutoplay:true});
  try{
    h.doc.querySelector('#sound-button').dispatchEvent(new h.window.Event('pointerdown',{bubbles:true}));
    h.click('#sound-button');await flush();
    assert.equal(h.audio.plays,1);
    assert.equal(h.audio.paused,true);
    assert.equal(h.errors.length,0);
  }finally{h.close();}
});

test('source, answer, evidence and career controls follow their shuffled stable ID orders',async()=>{
 const m=missions[0],saved=engine.freshRun(m,()=>0);const h=await open({saved});
 const ids=selector=>[...h.doc.querySelectorAll(selector)].map(button=>Object.values(button.dataset)[0]);
 try{
  h.start();assert.deepEqual(ids('[data-source]'),saved.orders.sources);assert.deepEqual(ids('[data-observation]'),saved.orders.question);
  h.click('[data-source="s1"]');assert.deepEqual(ids('[data-source]'),saved.orders.sources);
  for(const source of m.sources)h.click(`[data-source="${source.id}"]`);
  h.click(`[data-observation="${best(m.question.options)}"]`);assert.deepEqual(ids('[data-observation]'),saved.orders.question);
  h.click('[data-do="check-observation"]');h.click('[data-do="to-decide"]');
  assert.deepEqual(ids('[data-action]'),saved.orders.actions);assert.deepEqual(ids('[data-evidence]'),saved.orders.sources);
  h.click(`[data-action="${best(m.choices)}"]`);assert.deepEqual(ids('[data-action]'),saved.orders.actions);
  for(const source of m.sources.slice(0,2))h.click(`[data-evidence="${source.id}"]`);
  h.click('[data-do="send-advice"]');h.click('[data-do="to-update"]');assert.deepEqual(ids('[data-update]'),saved.orders.updates);
  h.click(`[data-update="${best(m.development.options)}"]`);h.click('[data-do="check-update"]');h.click('[data-do="to-briefing"]');
  const input=h.doc.querySelector('#recommendation');input.value='I would check the evidence before attributing responsibility.';input.dispatchEvent(new h.window.Event('input',{bubbles:true}));h.click('#submit-briefing');await flush();
  assert.deepEqual(ids('[data-career]'),saved.orders.careers);
  assert.equal(h.calls[0].payload.observationId,best(m.question.options));
  assert.equal(h.calls[0].payload.actionId,best(m.choices));
  assert.equal(h.calls[0].payload.updateId,best(m.development.options));
 }finally{h.close();}
});

test('older optional debriefs resume at the required contribution without automatically sending',async()=>{
 const saved=finished(missions[0],'Earlier draft.');delete saved.assessmentSubmitted;delete saved.orders.sources;delete saved.orders.careers;
 const h=await open({saved});try{h.start();assert.ok(h.doc.querySelector('#briefing-form'));assert.equal(h.doc.querySelector('#recommendation').value,'Earlier draft.');assert.equal(h.calls.length,0);}finally{h.close();}
});


test('a first visit offers story selection and a random assignment before any story begins',async()=>{
 const h=await open();try{
  assert.ok(h.doc.querySelector('.welcome-shell'));
  assert.match(h.doc.querySelector('[data-do="collection"]').textContent,/Choose my story/);
  assert.match(h.doc.querySelector('[data-do="surprise"]').textContent,/Choose randomly for me/);
  assert.equal(h.doc.querySelector('.intro-shell'),null);
  assert.equal(h.savedRun(),null,'no story is persisted before the player chooses');
  assert.equal(h.calls.length,0);
  h.click('[data-do="collection"]');
  assert.equal(h.doc.querySelectorAll('[data-mission]').length,8);
  h.click('[data-mission="water"]');
  assert.ok(h.doc.querySelector('.intro-shell'));assert.equal(h.savedRun().caseId,'water');assert.equal(h.savedRun().stage,0);
  h.start();assert.equal(h.savedRun().stage,1);
 }finally{h.close();}
});

test('first-visit random assignment can select every one of the eight stories',async()=>{
 for(const [index,m] of missions.entries()){
  const h=await open({random:()=>(index+.5)/missions.length});try{
   h.click('[data-do="surprise"]');
   assert.equal(h.savedRun().caseId,m.id);assert.equal(h.savedRun().stage,0);assert.ok(h.doc.querySelector('.intro-shell'));
   assert.equal(h.doc.querySelector('#modal').open,false);assert.equal(h.calls.length,0);
  }finally{h.close();}
 }
});

test('home keeps an unfinished briefing available and protects it when another story is chosen',async()=>{
 const draft={...finished(missions[0],'Keep my written contribution.'),stage:4,assessmentSubmitted:false};
 const h=await open({saved:draft,openAtStory:false});try{
  h.click('#brand');assert.ok(h.doc.querySelector('.welcome-shell'));assert.ok(h.doc.querySelector('[data-do="resume"]'));
  h.click('[data-do="resume"]');assert.equal(h.doc.querySelector('#recommendation').value,draft.recommendation);
  h.click('#brand');h.click('[data-do="collection"]');h.click('[data-mission="water"]');
  assert.equal(h.doc.querySelector('#modal').open,true);assert.equal(h.savedRun().caseId,draft.caseId);
  h.click('[data-do="close-modal"]');h.click('#brand');h.click('[data-do="resume"]');
  assert.equal(h.doc.querySelector('#recommendation').value,draft.recommendation);assert.equal(h.calls.length,0);
 }finally{h.close();}
});

test('returning players also see story choices, with a direct link to their saved assessment',async()=>{
 const saved=finished(missions[0]);saved.mentor={...feedback};saved.mentorKey=JSON.stringify(engine.mentorPayload(saved));
 const h=await open({saved,openAtStory:false});try{
  assert.ok(h.doc.querySelector('.welcome-shell'));assert.ok(h.doc.querySelector('[data-do="collection"]'));assert.ok(h.doc.querySelector('[data-do="surprise"]'));
  h.click('[data-do="resume"]');assert.equal(h.doc.querySelector('.ai-response h3').textContent,feedback.headline);assert.equal(h.calls.length,0);
 }finally{h.close();}
});


test('a random redraw avoids the story already chosen for the current briefing',async()=>{
 const h=await open({saved:engine.freshRun(missions[0]),random:()=>0,openAtStory:false});try{
  h.click('[data-do="surprise"]');assert.equal(h.savedRun().caseId,missions[1].id);
 }finally{h.close();}
});
