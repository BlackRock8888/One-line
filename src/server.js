import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'};
createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const file = path === '/' ? 'index.html' : path.slice(1);
  if (!['index.html','style.css','app.js','fox.svg'].includes(file)) { res.writeHead(404).end(); return; }
  try { const data = await readFile(new URL('../public/' + file, import.meta.url)); res.writeHead(200, {'Content-Type':types[file.slice(file.lastIndexOf('.'))], 'Cache-Control':'no-store'}).end(data); }
  catch { res.writeHead(500).end(); }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0');
