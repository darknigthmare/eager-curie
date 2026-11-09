#!/usr/bin/env node
'use strict';
// Git's ignore engine checks the local Vercel upload policy. This is not proof
// of a deployed routing policy; HTTP/server checks must be run separately.
const assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const allowed=['index.html','vercel.json','src/game.js','src/game-systems.js','src/alien-base-library.js','src/industrial-layout.js',
  'src/css/alien-base.css','assets/vendor/three.r128.min.js','assets/models/rocketbox/medical-male-01.glb',
  'data/alien-base.snapshot.v1.json','data/alien-base.snapshot.v2.json','data/alien-base.media.v2.json'];
const privatePaths=['docs/CONTINUATION_20261109.md','docs/future-audit.json','.ai-tools/README.md',
  '.github/workflows/alien-base-sync.yml','AGENTS.md','CLAUDE.md','README.md','tools/qa-public-surface.cjs',
  '.tools/coherence-fix-20261109/proof.json','data/private.json','data/gameplay/hive-ascension.v1.json',
  'data/research/future.json','src/main.js','src/engine/AudioManager.js'];
const result=spawnSync('git',['-c','core.excludesFile='+path.join(root,'.vercelignore'),
  'check-ignore','--no-index','--',...allowed,...privatePaths],{cwd:root,encoding:'utf8'});
assert.ifError(result.error);assert.equal(result.status,0,result.stderr);
assert(result.stdout.trim(),'Ignore engine produced no evidence');
const ignored=new Set(result.stdout.trim().split(/\r?\n/));
for(const file of allowed)assert(!ignored.has(file),'Public runtime excluded: '+file);
for(const file of privatePaths)assert(ignored.has(file),'Private source included: '+file);
console.log(`${allowed.length} public runtime paths admitted; ${privatePaths.length} private paths excluded by local upload policy`);
