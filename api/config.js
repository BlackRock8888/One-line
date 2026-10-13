import { proxy } from '../src/proxy.js';
export async function POST(request) { return proxy(request,'/api/config'); }
