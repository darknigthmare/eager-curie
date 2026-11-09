import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),index=args.indexOf('--source');
if(index<0||!args[index+1]){console.error('Usage: node tools/sync-alien-base-media.mjs --source PATH [--check|--write]');process.exit(2)}
const src=resolve(root,args[index+1]),dst=join(root,'data','alien-base.media.v2.json');
const next=JSON.parse(readFileSync(src,'utf8')),old=readFileSync(dst,'utf8');
const keys=['id','localId','title','year','medium','continuity','provenanceTier','publicationStatus','sourceReview','fidelityVerified'];
if(next.schemaVersion!=='2.0.0'||next.scope!=='public-minimal-apex-media'||
 next.origin!=='darknigthmare/alien_base'||!Array.isArray(next.records)||
 next.records.length<29||next.records.length>1000)throw Error('Unsupported media export');
const ids=new Set();
for(const r of next.records){
 if(!r.id||r.id!=='work.'+r.localId||ids.has(r.id)||r.fidelityVerified!==false||
 r.sourceReview!=='project-declared-not-primary-verified'||Object.keys(r).some(k=>!keys.includes(k)))
 throw Error('Unsafe or duplicate media record '+String(r.id));
 ids.add(r.id);
}
const out=JSON.stringify(next,null,2)+'\n';
if(args.includes('--write')&&args.includes('--check'))throw Error('Choose one mode');
if(args.includes('--write')){writeFileSync(dst,out);console.log('Media updated:',ids.size);}
else if(args.includes('--check')){if(old!==out)throw Error('Media snapshot drift');console.log('Media export OK:',ids.size);}
else console.log('Compared',ids.size,'records; identical:',old===out);
