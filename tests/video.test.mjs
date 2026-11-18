import test from 'node:test';
import assert from 'node:assert/strict';
import {createVideoPlayer} from '../public/video.js';

function setup(reduced=false) {
  class FakeNode extends EventTarget {
    constructor(tag) { super(); this.tag=tag; this.children=[]; this.open=false; this.paused=true; this.ended=false; this.muted=false; this.loadCount=0; }
    setAttribute(k,v) { this[k]=v; } removeAttribute(k) { delete this[k]; }
    append(...children) { this.children.push(...children); }
    remove() { this.removed=true; }
    load() { this.loadCount++; }
    play() { this.paused=false; this.dispatchEvent(new Event('play')); return Promise.resolve(); }
    pause() { this.paused=true; this.dispatchEvent(new Event('pause')); }
    showModal() { this.open=true; } close() { this.open=false; } focus() {}
  }
  let nodes=[]; globalThis.document={body:new FakeNode('body'),createElement(tag){let n=new FakeNode(tag);nodes.push(n);return n;}};
  globalThis.matchMedia=()=>({matches:reduced}); let enabled=true,paused=0,resumed=0;
  const soundtrack={pause(){paused++;}};
  const player=createVideoPlayer({soundtrack,soundEnabled:()=>enabled,resumeSound:()=>resumed++});
  return {player,nodes,setEnabled(v){enabled=v;},get paused(){return paused;},get resumed(){return resumed;}};
}

test('opens valid scene on metadata, autoplays muted, pauses soundtrack, and closes',()=>{
 let x=setup();x.player.playClip('assets/videos/koper-opening.mp4','Opening',()=>true);let v=x.nodes[0]; assert.equal(v.src,'assets/videos/koper-opening.mp4');v.dispatchEvent(new Event('loadedmetadata'));let d=x.nodes.find(n=>n.tag==='dialog');assert.equal(d.open,true);assert.equal(v.muted,true);assert.equal(x.player.playing(),true);assert.equal(x.paused,1);d.children[3].dispatchEvent(new Event('click'));assert.equal(d.open,false);assert.equal(x.player.playing(),false);assert.ok(x.resumed>0);
});
test('rejects missing and unsafe paths without creating media',()=>{let x=setup();for (const p of [undefined,'https://external/x.mp4','assets/videos/../x.mp4','assets/videos/x.webm'])x.player.playClip(p,'x',()=>true);assert.equal(x.nodes.length,0);});
test('failed media and stale navigation leave game uninterrupted',()=>{let x=setup();x.player.playClip('assets/videos/koper-opening.mp4','Opening',()=>true);x.nodes[0].dispatchEvent(new Event('error'));assert.equal(x.nodes.some(n=>n.tag==='dialog'),false);x.player.playClip('assets/videos/punjab-opening.mp4','Opening',()=>false);x.nodes.at(-1).dispatchEvent(new Event('loadedmetadata'));assert.equal(x.nodes.some(n=>n.tag==='dialog'),false);});
test('reduced motion requires play and sound-off forces video mute',()=>{let x=setup(true);x.player.playClip('assets/videos/punjab-closing.mp4','Closing',()=>true,'Continue to assessment');let v=x.nodes[0];v.dispatchEvent(new Event('loadedmetadata'));assert.equal(v.paused,true);assert.equal(x.nodes.find(n=>n.tag==='button').textContent,'Continue to assessment');x.setEnabled(false);v.muted=false;v.dispatchEvent(new Event('volumechange'));assert.equal(v.muted,true);});
test('cancels a pending clip when another starts',()=>{let x=setup();x.player.playClip('assets/videos/koper-opening.mp4','Opening',()=>true);let first=x.nodes[0];x.player.playClip('assets/videos/punjab-opening.mp4','Opening',()=>true);first.dispatchEvent(new Event('loadedmetadata'));assert.equal(x.nodes.some(n=>n.tag==='dialog'),false);x.nodes.at(-1).dispatchEvent(new Event('loadedmetadata'));assert.equal(x.nodes.filter(n=>n.tag==='dialog').length,1);});
test('displays the scene-specific introduction as text',()=>{let x=setup(true);let intro='A mission-specific introduction?';x.player.playClip('assets/videos/koper-opening.mp4','Opening',()=>true,undefined,intro);x.nodes[0].dispatchEvent(new Event('loadedmetadata'));assert.equal(x.nodes.find(n=>n.tag==='p').textContent,intro);});
