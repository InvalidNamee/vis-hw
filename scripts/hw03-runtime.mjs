import {buildSync} from 'esbuild';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export function replayEngine(){return buildSync({entryPoints:[resolve(root,'src/homework/hw03/model.mjs')],bundle:true,format:'iife',globalName:'DataLoom',platform:'neutral',target:'es2022',write:false,legalComments:'inline'}).outputFiles[0].text;}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const path=resolve(root,'public/hw03/replay-engine.js');mkdirSync(dirname(path),{recursive:true});writeFileSync(path,replayEngine());console.log('HW03 replay engine generated.');}
