#!/usr/bin/env node
'use strict';
// Run independent regressions against one frozen local candidate. No Git writes,
// source edits, deployment or network dependency. Evidence is private and unique.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawn,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const outputIndex=process.argv.indexOf('--output');
if(outputIndex<0||!process.argv[outputIndex+1])throw Error('Use --output .tools/a-new-evidence-directory');
const output=path.resolve(root,process.argv[outputIndex+1]);
if(!output.startsWith(path.join(root,'.tools')+path.sep)||fs.existsSync(output))throw Error('Require a new private evidence directory');
fs.mkdirSync(output,{recursive:true});
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const file=path.join(dir,entry.name);return entry.isDirectory()?walk(file):entry.isFile()?[file]:[];
});}
function inventory(files){return Object.fromEntries(files.sort().map(file=>[path.relative(root,file),hash(fs.readFileSync(file))]));}
function runtimeFiles(){return ['src','assets','data'].flatMap(name=>fs.existsSync(path.join(root,name))?walk(path.join(root,name)):[])
  .concat(['index.html','vercel.json','.vercelignore','server.ps1'].map(name=>path.join(root,name)));}
function toolFiles(){return walk(path.join(root,'tools')).filter(file=>/\.(?:cjs|mjs|js|py)$/.test(file));}
const report={started:new Date().toISOString(),scope:'Independent local suites, syntax and frozen-source checks. Browser/native PCM and human/cinema QA are separate.',
  sourceBefore:inventory(runtimeFiles()),toolsBefore:inventory(toolFiles()),commands:[],syntax:[],complete:false};
const save=()=>fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(report,null,2)+'\n');
save();
const nodeTests=['qa-models.cjs','qa-model-detail.cjs','qa-organic.cjs','qa-mortar-lifecycle.cjs',
  'qa-audio-boot.cjs','qa-acid-pool.cjs','qa-boot-contract.cjs','qa-controls-coherence.cjs','qa-ai-coherence.cjs','qa-pathfinding-coherence.cjs','qa-level-coherence.cjs',
  'qa-menu-cards.cjs','qa-animation-merge.cjs','qa-model-merge.cjs',
  'qa-creature-coherence.cjs','qa-cycle-coherence.cjs','qa-transport-coherence.cjs','qa-rts-lineage.cjs','qa-hud-coherence.cjs',
  'qa-alien-base.cjs','qa-alien-base-lore.cjs','qa-alien-base-media.cjs','qa-alien-base-ui.cjs','qa-public-surface.cjs'];
const layoutEvidence=path.join(output,'level-geometry.json');
const commands=nodeTests.map(name=>({name,program:process.execPath,args:['tools/'+name,
  ...(name==='qa-level-coherence.cjs'?['--output='+layoutEvidence]:[])]}));
commands.push({name:'sync-alien-base',program:process.execPath,args:['tools/sync-alien-base.mjs','--source','data/alien-base.snapshot.v2.json','--check']},
  {name:'sync-alien-base-media',program:process.execPath,args:['tools/sync-alien-base-media.mjs','--source','data/alien-base.media.v2.json','--check']},
  {name:'resource-origin-classifier',program:'python3',args:['tools/qa-resource-origins.py']},
  {name:'qa-server',program:'python3',args:['tools/qa-server.py','--output',path.join(output,'http')]},
  {name:'ai-tooling-unit-tests',program:'python3',args:['-B','-m','unittest','discover','-s','.ai-tools/tests','-v'],toolingOnly:true});
async function run(spec){
  const started=Date.now(),chunks=[],errors=[];
  const result={name:spec.name,command:[spec.program,...spec.args],toolingOnly:!!spec.toolingOnly};
  await new Promise(resolve=>{
    let child;
    try{child=spawn(spec.program,spec.args,{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});}
    catch(error){result.error=String(error);resolve();return;}
    child.stdout.on('data',data=>chunks.push(data));child.stderr.on('data',data=>errors.push(data));
    child.on('error',error=>{result.error=String(error);});
    child.on('close',(code,signal)=>{result.exitCode=code;result.signal=signal;resolve();});
  });
  const stdout=Buffer.concat(chunks).toString(),stderr=Buffer.concat(errors).toString();
  fs.writeFileSync(path.join(output,spec.name+'.stdout.log'),stdout);
  fs.writeFileSync(path.join(output,spec.name+'.stderr.log'),stderr);
  Object.assign(result,{durationMs:Date.now()-started,stdoutSha256:hash(stdout),stderrSha256:hash(stderr),
    footer:stdout.trim().split(/\r?\n/).slice(-3),passed:!result.error&&result.exitCode===0&&
      (spec.toolingOnly?stderr.includes('OK'):stdout.trim().length>0)});
  report.commands.push(result);save();
  console.log((result.passed?'PASS ':'FAIL ')+spec.name+' ('+result.durationMs+'ms)');
}
(async()=>{
  let next=0;
  await Promise.all([0,1].map(async()=>{while(next<commands.length)await run(commands[next++]);}));
  await run({name:'compiled-industrial-layout',program:process.execPath,
    args:['tools/generate-industrial-layout.cjs','--input='+layoutEvidence,'--check']});
  const syntaxFiles=walk(path.join(root,'src')).concat(toolFiles());
  for(const file of syntaxFiles){
    const kind=/\.(?:js|cjs|mjs)$/.test(file)?'javascript':file.endsWith('.py')?'python':null;
    if(!kind)continue;
    const command=kind==='javascript'?[process.execPath,['--check',file]]:
      ['python3',['-c','import ast, pathlib, sys; ast.parse(pathlib.Path(sys.argv[1]).read_text(), filename=sys.argv[1])',file]];
    const result=spawnSync(command[0],command[1],{cwd:root,encoding:'utf8'});
    report.syntax.push({file:path.relative(root,file),kind,exitCode:result.status,
      error:result.error?String(result.error):null,stderr:result.stderr,passed:!result.error&&result.status===0});
  }
  report.sourceAfter=inventory(runtimeFiles());report.toolsAfter=inventory(toolFiles());
  report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);
  report.toolsStable=JSON.stringify(report.toolsBefore)===JSON.stringify(report.toolsAfter);
  const check=spawnSync('git',['diff','--check'],{cwd:root,encoding:'utf8'});
  report.diffCheck={passed:!check.error&&check.status===0,stdout:check.stdout,stderr:check.stderr,error:check.error?String(check.error):null};
  report.complete=true;report.finished=new Date().toISOString();
  report.passed=report.sourceStable&&report.toolsStable&&report.diffCheck.passed&&report.commands.every(row=>row.passed)&&report.syntax.every(row=>row.passed);
  report.counts={commands:report.commands.length,commandsPassed:report.commands.filter(row=>row.passed).length,
    javascriptSyntax:report.syntax.filter(row=>row.kind==='javascript').length,pythonAst:report.syntax.filter(row=>row.kind==='python').length,
    syntaxPassed:report.syntax.filter(row=>row.passed).length,publicSourceFiles:Object.keys(report.sourceBefore).length,toolFiles:Object.keys(report.toolsBefore).length};
  save();console.log(JSON.stringify({passed:report.passed,counts:report.counts,sourceStable:report.sourceStable,toolsStable:report.toolsStable}));
  process.exitCode=report.passed?0:1;
})().catch(error=>{report.failure=error.stack||String(error);save();console.error(error);process.exitCode=1;});
