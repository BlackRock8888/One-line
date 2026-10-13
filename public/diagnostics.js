const entries = [];
const allowed = new Set(['action','http','code','state']);
export function logEvent(event, details = {}) {
  const data = Object.fromEntries(Object.entries(details).filter(([key]) => allowed.has(key)));
  entries.push({time:new Date().toISOString(),event,...data});
  if (entries.length > 80) entries.shift();
  const output = document.getElementById('connection-log');
  if (output) output.textContent = entries.map(e => `${e.time.slice(11,19)} ${e.event} ${JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k]) => !['time','event'].includes(k))))}`).join('\n');
}
export function diagnosticReport() { return JSON.stringify({product:'Black Rock Talk',events:entries},null,2); }
