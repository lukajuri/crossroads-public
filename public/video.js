// A clip is optional. Missing or unsupported files never block the mission.
export function createVideoPlayer({soundtrack, soundEnabled, resumeSound}) {
  let pending = null;
  let active = null;
  function cancel() {
    if (pending) { pending.cancelled = true; pending.video.removeAttribute('src'); pending.video.load(); pending = null; }
    if (active) {
      const old = active; active = null;
      old.video.pause();
      if (old.dialog.open) old.dialog.close();
      old.dialog.remove();
    }
    resumeSound();
  }
  function playing() { return Boolean(active && !active.video.paused && !active.video.ended); }
  function playClip(path, title, stillCurrent, buttonText = 'Continue to the briefing') {
    cancel();
    // Only local MP4 assets specified by the game are accepted.
    if (typeof path !== 'string' || !/^assets\/videos\/[a-z0-9-]+\.mp4$/.test(path)) return;
    const video = document.createElement('video');
    video.preload = 'metadata'; video.playsInline = true; video.controls = true;
    video.muted = true; // Mobile browsers allow muted autoplay; players can unmute.
    const item = {video, cancelled:false}; pending = item;
    const discard = () => {
      if (active?.video === video) { cancel(); return; }
      if (pending === item) pending = null;
      video.removeAttribute('src'); video.load();
    };
    video.addEventListener('error', discard, {once:true});
    video.addEventListener('loadedmetadata', () => {
      if (pending !== item || item.cancelled || !stillCurrent()) { discard(); return; }
      pending = null;
      const dialog = document.createElement('dialog');
      dialog.className = 'video-dialog';
      dialog.setAttribute('aria-label', title);
      const heading = document.createElement('h2'); heading.textContent = title;
      const note = document.createElement('p'); note.textContent = 'A geopolitical crisis unfolds. Can your decisions shape events?';
      const close = document.createElement('button'); close.type='button'; close.className='primary video-continue'; close.textContent=buttonText;
      dialog.append(heading, video, note, close); document.body.append(dialog);
      active = {dialog, video};
      close.addEventListener('click', cancel);
      dialog.addEventListener('cancel', event => { event.preventDefault(); cancel(); });
      video.addEventListener('play', () => soundtrack.pause());
      video.addEventListener('pause', () => { if (active?.video === video) resumeSound(); });
      video.addEventListener('ended', () => { if (active?.video === video) resumeSound(); });
      video.addEventListener('volumechange', () => { if (!soundEnabled() && !video.muted) video.muted = true; });
      dialog.showModal(); close.focus();
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) video.play().catch(() => {});
    }, {once:true});
    video.src = path; video.load();
  }
  function syncSound() { if (active && !soundEnabled()) active.video.muted = true; }
  return {playClip, cancel, playing, syncSound};
}
