import { pickLanguage, applyLanguage, t, errorText } from './i18n.js';
import { SessionClock } from './session-clock.js';
import { VoiceRoom } from './voice.js';
import { initTelegram } from './telegram.js';
import { diagnosticReport, logEvent } from './diagnostics.js';
initTelegram();
const $ = id => document.getElementById(id);
const app = $('app');
const params = new URLSearchParams(location.search);
let roomId = /^[a-z0-9]{8,32}$/.test(params.get('r') || '') ? params.get('r') : null;
let room = null, view = 'welcome', statusKey = null, noteKey = null, noteError = false, members = [], unread = 0, muted = false, chatOpen = false;

const inviteUrl = () => `${location.origin}${location.pathname}?r=${roomId}`;
const setStatus = (key, vars) => { statusKey = key ? [key, vars] : null; $('status').textContent = key ? t(key, vars) : ''; };
const setNote = (text, error = false) => { $('start-note').textContent = text || ''; $('start-note').classList.toggle('error', error); };
const showView = next => {
  view = next; app.dataset.view = next;
  $('welcome').inert = next !== 'welcome'; $('room').inert = next !== 'room';
  setTimeout(() => (next === 'room' ? $('mute') : $('start')).focus({preventScroll:true}), 60);
};
const setPhase = phase => { app.dataset.phase = phase; $('start').disabled = phase === 'busy'; };
const refreshStart = () => { $('start-label').textContent = t(roomId ? 'join' : 'create'); if (roomId && !noteKey && !$('start-note').textContent) setNote(t('invited')); };

const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
let lastClock = ['off', 0];
const clock = new SessionClock({
  render: (mode, seconds) => { lastClock = [mode, seconds]; $('timer').textContent = mode === 'waiting' ? t('waiting', {s: seconds}) : mode === 'talking' ? t('talking', {t: fmt(seconds)}) : ''; },
  expire: () => room?.leave('waitclock')
});
let clockInterval;

function chatMessage(text, author) {
  const box = $('chat-messages'), p = document.createElement('p');
  p.className = 'chat-message ' + author; p.textContent = text; box.append(p);
  while (box.children.length > 100) box.firstChild.remove();
  box.scrollTop = box.scrollHeight;
  if (author === 'guest' && !chatOpen) { unread++; $('unread').hidden = false; }
}
function showChat(open) {
  chatOpen = open; $('chat-panel').dataset.open = String(open); $('chat-panel').inert = !open;
  $('chat-toggle').setAttribute('aria-expanded', String(open));
  if (open) { unread = 0; $('unread').hidden = true; $('chat-messages').scrollTop = $('chat-messages').scrollHeight; if (!$('chat-input').disabled) setTimeout(() => $('chat-input').focus({preventScroll:true}), 120); }
  else if (view === 'room') $('chat-toggle').focus({preventScroll:true});
}
function renderMembers() {
  const n = members.length, self = n > 0, guest = n > 1;
  $('seat-self').classList.toggle('present', self); $('seat-guest').classList.toggle('present', guest);
  $('self-state').textContent = self ? t('here') : '';
  $('guest-state').textContent = guest ? t('here') : t('free');
  $('guest-name').textContent = guest ? t('guest') : t('invite');
  $('guest-avatar').innerHTML = guest ? '<img src="/fox-neon.webp" alt="" width="104" height="104">' : '<span aria-hidden="true">+</span>';
  $('guest-avatar').classList.toggle('empty', !guest);
  $('seat-guest').disabled = guest;
  $('invite-box').toggleAttribute('data-off', guest);
}

function makeRoom() {
  return new VoiceRoom({
    roomId,
    state: s => {
      const key = {mic:'mic', joining:'joining', linking:'linking', connected:'connected', unstable:'unstable', failed:'failed', reconnecting:'reconnecting'}[s];
      if (view === 'room') setStatus(key); else setNote(t(key));
    },
    joined: () => {
      showView('room'); setPhase('idle'); setNote('');
      $('invite-link').value = inviteUrl();
      clearInterval(clockInterval); clockInterval = setInterval(() => clock.tick(), 250);
    },
    members: list => {
      members = list; renderMembers(); clock.update(list.length);
      if (list.length < 2) setStatus('waiting_hint');
    },
    chat: chatMessage,
    chatState: ready => { $('chat-input').disabled = !ready; $('chat-send').disabled = !ready; $('chat-input').setAttribute('data-i18n-ph', ready ? 'msg' : 'chatWait'); $('chat-input').placeholder = t(ready ? 'msg' : 'chatWait'); },
    level: ({local, remote}) => { $('avatar').style.setProperty('--level', local.toFixed(3)); $('seat-guest').style.setProperty('--gl', remote.toFixed(3)); },
    ended: reason => {
      clearInterval(clockInterval); clock.reset(); members = []; renderMembers();
      $('chat-messages').replaceChildren(); $('chat-input').value = ''; unread = 0; $('unread').hidden = true; showChat(false);
      muted = false; $('mute').setAttribute('aria-pressed', 'false'); $('enable-audio').hidden = true; setStatus(null);
      const normal = ['LEFT', 'WAIT_ENDED', 'waitclock'].includes(reason);
      if (!normal && roomId && ['ROOM_NOT_FOUND'].includes(reason)) { roomId = null; history.replaceState(null, '', location.pathname); }
      setPhase('idle'); showView('welcome'); refreshStart();
      setNote(normal ? t('ended_' + reason) : errorText(reason), !normal);
      if (!normal) $('log-open').dataset.hint = '1';
      room = null;
    }
  });
}

$('start').onclick = async () => {
  if (room) return;
  setPhase('busy'); setNote(t('preparing'));
  try {
    if (!roomId) { roomId = await VoiceRoom.create(); history.replaceState(null, '', `?r=${roomId}`); }
    room = makeRoom();
    await room.enter();
  } catch (error) {
    room = null; setPhase('idle');
    const code = error.message === 'Failed to fetch' ? 'NETWORK_ERROR' : error.message;
    logEvent('connection.error', {code}); setNote(errorText(code), true);
  }
};
$('mute').onclick = () => { if (!room) return; muted = room.mute(); $('mute').setAttribute('aria-pressed', String(muted)); $('mute').querySelector('span').textContent = t(muted ? 'unmute' : 'mute'); };
$('leave').onclick = () => room?.leave('LEFT');
$('invite').onclick = async () => {
  if (navigator.share) { try { await navigator.share({title: 'Black Rock Talk', url: inviteUrl()}); return; } catch (e) { if (e.name === 'AbortError') return; } }
  await copyInvite();
};
$('seat-guest').onclick = () => $('invite').click();
async function copyInvite() {
  try { await navigator.clipboard.writeText(inviteUrl()); setStatus('copied'); }
  catch { $('invite-link').focus(); $('invite-link').select(); setStatus('copyManual'); }
}
$('copy-invite').onclick = copyInvite;
$('enable-audio').onclick = async () => { try { await room.audio.play(); await room.context?.resume(); $('enable-audio').hidden = true; } catch {} };
document.addEventListener('audio-blocked', () => { $('enable-audio').hidden = false; });
$('chat-toggle').onclick = () => showChat(!chatOpen);
$('chat-close').onclick = () => showChat(false);
$('chat-form').onsubmit = e => { e.preventDefault(); if (room?.sendChat($('chat-input').value)) $('chat-input').value = ''; };
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (chatOpen) showChat(false); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { clock.tick(); room?.audio.paused && room.audio.srcObject && room.audio.play().catch(() => {}); room?.context?.resume?.(); } });
addEventListener('pagehide', () => { room?.leave('LEFT'); });
$('log-open').onclick = () => $('log-dialog').showModal();
$('log-close').onclick = () => $('log-dialog').close();
$('copy-diagnostics').onclick = async () => { try { await navigator.clipboard.writeText(diagnosticReport()); } catch { $('connection-log').focus(); } };

const syncViewport = () => { const h = window.visualViewport?.height; if (h) document.documentElement.style.setProperty('--vvh', h + 'px'); };
window.visualViewport?.addEventListener('resize', syncViewport); syncViewport();

$('language').onchange = e => setLang(e.target.value);
function setLang(code) {
  applyLanguage(code, () => {
    $('language').value = code; refreshStart(); renderMembers(); clock.tick(); if (lastClock[0] === 'off') $('timer').textContent = '';
    if (statusKey) setStatus(...statusKey);
    $('mute').querySelector('span').textContent = t(muted ? 'unmute' : 'mute');
    $('chat-input').placeholder = t($('chat-input').disabled ? 'chatWait' : 'msg');
    $('connection-log').textContent ||= t('logEmpty');
  });
}
setLang(pickLanguage());
renderMembers();
