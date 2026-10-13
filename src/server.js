import { createApp } from './http.js';
import { iceConfiguration } from './ice.js';
createApp({getIce: id => iceConfiguration(id)}).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Black Rock Talk server ready'));
