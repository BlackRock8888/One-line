const $ = id => document.getElementById(id);
let stream, context, frame, muted = false, generation = 0;
const status = message => $('status').textContent = message;
function stop() {
  generation++;
  cancelAnimationFrame(frame);
  stream?.getTracks().forEach(track => track.stop());
  stream = null;
  context?.close().catch(() => {});
  context = null;
  muted = false;
  $('avatar').style.setProperty('--level', '0');
  $('controls').hidden = true;
  $('connect').hidden = false;
  $('connect').disabled = false;
  $('mute').textContent = 'Mute';
  $('mute').setAttribute('aria-pressed', 'false');
}
$('connect').onclick = async () => {
  const attempt = ++generation;
  $('connect').disabled = true;
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('HTTPS_REQUIRED');
    context = new AudioContext();
    await context.resume();
    const incoming = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
    if (attempt !== generation) { incoming.getTracks().forEach(t => t.stop()); return; }
    stream = incoming;
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    context.createMediaStreamSource(stream).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    let level = 0;
    const animate = () => {
      analyser.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
      level += ((muted ? 0 : Math.min(1, rms * 8)) - level) * .18;
      $('avatar').style.setProperty('--level', level.toFixed(3));
      frame = requestAnimationFrame(animate);
    };
    animate();
    $('connect').hidden = true;
    $('controls').hidden = false;
    status('Microphone preview · Speak to wake your fox. No call is connected.');
  } catch (error) {
    stop();
    status(error.name === 'NotAllowedError' ? 'Microphone permission denied. Allow access in your browser and try again.' : error.name === 'NotFoundError' ? 'No microphone found. Connect one and try again.' : 'Microphone unavailable. Open this page over HTTPS in Safari or Chrome.');
  }
};
$('mute').onclick = () => {
  muted = !muted;
  stream?.getAudioTracks().forEach(track => track.enabled = !muted);
  $('mute').textContent = muted ? 'Unmute' : 'Mute';
  $('mute').setAttribute('aria-pressed', String(muted));
};
$('leave').onclick = () => { stop(); status('Microphone off. Your next moment is one tap away.'); };
$('invite').onclick = async () => {
  try { await navigator.clipboard.writeText(location.origin + '/'); status('Preview link copied. Voice calls are not available in this stage.'); }
  catch { status('Copy the page address to share this preview.'); }
};
addEventListener('pagehide', stop);
