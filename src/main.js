/* Main Game Loop & State Machine for HIVE ASCENSION */
import { rendererEngine } from './engine/Renderer2D3D.js';
import { inputManager } from './engine/InputManager.js';
import { audioManager } from './engine/AudioManager.js';
import { visionSystem } from './systems/VisionSystem.js';
import { alarmSystem } from './systems/AlarmSystem.js';
import { pheromoneSystem } from './systems/PheromoneSystem.js';
import { stationMap } from './environment/StationMap.js';
import { resinGrid } from './environment/ResinGrid.js';
import { playerCreature } from './entities/PlayerCreature.js';
import { HumanAI } from './entities/HumanAI.js';
import { HiveUnit } from './entities/HiveUnit.js';

import { StageEgg } from './stages/StageEgg.js';
import { StageFacehugger } from './stages/StageFacehugger.js';
import { StageChestburster } from './stages/StageChestburster.js';
import { StageDrone } from './stages/StageDrone.js';
import { StageHiveRTS } from './stages/StageHiveRTS.js';

class GameMaster {
  constructor() {
    this.currentStageIndex = 1;
    this.currentStage = null;
    this.humans = [];
    this.hiveUnits = [];
    this.isRunning = false;
  }

  init() {
    console.log('[HIVE ASCENSION] Initializing system...');
    const canvas = document.getElementById('game-canvas');

    // Initialize core engines
    rendererEngine.init(canvas);
    inputManager.init(canvas);
    audioManager.init();
    visionSystem.init();
    alarmSystem.init();
    pheromoneSystem.init();

    // Build Station World
    stationMap.buildMap();
    resinGrid.init();

    // Spawn Humans
    this.spawnHumans();

    // Create Player Entity
    playerCreature.createMesh();

    // Start Stage 1 (Egg)
    this.loadStage(1);

    // Keyboard Shortcuts for Vision Switching (1, 2, 3)
    inputManager.on('keydown', (key) => {
      if (key === '1') visionSystem.setMode('normal');
      if (key === '2') visionSystem.setMode('thermal');
      if (key === '3') visionSystem.setMode('acoustic');

      if (this.currentStageIndex === 5) {
        if (key === 'q') pheromoneSystem.setCommand('HUNT');
        if (key === 'w') pheromoneSystem.setCommand('CAPTURE');
        if (key === 'e') pheromoneSystem.setCommand('DEFEND');
        if (key === 'r') pheromoneSystem.setCommand('INFEST');
      }
    });

    // Start Main Game Loop
    this.isRunning = true;
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  spawnHumans() {
    // Scientist in Lab
    const sc = new HumanAI(1, 'scientist', -20, -25);
    sc.createMesh();
    this.humans.push(sc);

    // Guards in Corridors
    const g1 = new HumanAI(2, 'guard', 10, -10);
    g1.createMesh();
    this.humans.push(g1);

    const g2 = new HumanAI(3, 'guard', 25, 10);
    g2.createMesh();
    this.humans.push(g2);
  }

  spawnCleaners() {
    for (let i = 0; i < 4; i++) {
      const cl = new HumanAI(10 + i, 'cleaner', -40 + (i * 10), 40);
      cl.createMesh();
      this.humans.push(cl);
    }
  }

  loadStage(index) {
    this.currentStageIndex = index;

    if (index === 1) this.currentStage = new StageEgg();
    else if (index === 2) this.currentStage = new StageFacehugger();
    else if (index === 3) this.currentStage = new StageChestburster();
    else if (index === 4) this.currentStage = new StageDrone();
    else if (index === 5) {
      this.currentStage = new StageHiveRTS();
      this.spawnCleaners();
    }

    if (this.currentStage) {
      this.currentStage.init();
    }
  }

  gameLoop(timestamp) {
    if (!this.isRunning) return;

    // 1. Update Player Entity
    playerCreature.update();

    // 2. Update Camera Position to Follow Player / RTS target
    const isRTS = this.currentStageIndex === 5;
    rendererEngine.setCameraTarget(playerCreature.x, playerCreature.z, 0, isRTS);

    // 3. Update Humans AI
    for (const human of this.humans) {
      human.update();
    }

    // 4. Update Hive Units AI
    for (const unit of this.hiveUnits) {
      unit.update(this.humans);
    }

    // 5. Update Current Stage Logic & Check Progression
    if (this.currentStage) {
      this.currentStage.update();

      if (this.currentStage.isCompleted) {
        if (this.currentStageIndex < 5) {
          this.loadStage(this.currentStageIndex + 1);
        }
      }
    }

    // 6. Render 2.5D Scene
    rendererEngine.render();

    requestAnimationFrame((time) => this.gameLoop(time));
  }
}

// Start Game on window load
window.addEventListener('DOMContentLoaded', () => {
  const game = new GameMaster();
  game.init();
});
