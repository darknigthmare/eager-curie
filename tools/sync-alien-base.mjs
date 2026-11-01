/* Offline-only consumer synchronizer. No GitHub credentials or network calls. */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const home=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2), option=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:null};
const file=resolve(home,option('--source')||'../alien_base/exports/hive-ascension.v2.json');
const target=join(home,'data/alien-base.snapshot.v2.json');
if(args.includes('--write')&&args.includes('--check'))throw Error('Use --write or --check');
const src=readFileSync(join(home,'src/content.js'),'utf8');
const blob=createHash('sha1').update('blob '+Buffer.byteLength(src)+'\0').update(src).digest('hex');
const input=JSON.parse(readFileSync(file,'utf8'));
if(input.schemaVersion!=='2.0.0'||input.format!=='alien-base-registry-consumer-v2'||input.scope!=='public-metadata-only')throw Error('Unsupported public snapshot format');
if(input.sourceContent?.repository!=='darknigthmare/eager-curie'||input.sourceContent?.blobSha!==blob)throw Error('Source/content pin mismatch: update upstream intake first');
if(!Array.isArray(input.records)||input.records.length<474||new Set(input.records.map(x=>x.id)).size!==input.records.length)throw Error('Incomplete or duplicate catalog');
if(input.records.some(x=>x.kind==='game-card'))throw Error('TCG gameplay cards may not enter this public reference export');
const allowed=['id','kind','name','classification','biology','originGame'];
if(input.records.some(x=>Object.keys(x).some(k=>!allowed.includes(k))))throw Error('Export contains non-public record fields');
const content=JSON.stringify(input,null,2)+'\n';
const old=readFileSync(target,'utf8');
if(args.includes('--write')){writeFileSync(target,content);console.log('Updated local snapshot to',input.records.length,'reference records');}
else if(args.includes('--check')){if(old!==content)throw Error('Snapshot drift: reexport/review from Alien Base');console.log('Snapshot synchronized:',input.records.length,'records');}
else console.log('Preview:',input.records.length,'records; current:',JSON.parse(old).records.length,'records;',old===content?'no drift':'update available. Use --write after review');
