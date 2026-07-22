/* Autonomous Xenomorph Hive Units for Stage 5 RTS */
import * as THREE from 'three';
import { rendererEngine } from '../engine/Renderer2D3D.js';
import { pheromoneSystem } from '../systems/PheromoneSystem.js';

export class HiveUnit {
  constructor(id, caste, x, z) {
    this.id = id;
    this.caste = caste; // 'runner' | 'drone' | 'warrior' | 'praetorian'
    this.x = x;
    this.z = z;
    this.hp = caste === 'praetorian' ? 300 : (caste === 'warrior' ? 200 : 100);
    this.speed = caste === 'runner' ? 0.45 : 0.3;
    this.mesh = null;
    this.isControlled = false;
  }

  createMesh() {
    const group = new THREE.Group();

    // Biomechanical Body
    const geo = new THREE.SphereGeometry(this.caste === 'praetorian' ? 1.4 : 0.8, 12, 12);
    let color = 0x1e1b4b;
    if (this.caste === 'runner') color = 0x431407;
    if (this.caste === 'warrior') color = 0x0f172a;
    if (this.caste === 'praetorian') color = 0x581c87;

    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.2,
      metalness: 0.8
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.8;
    group.add(mesh);

    group.position.set(this.x, 0, this.z);
    rendererEngine.scene.add(group);
    this.mesh = group;
  }

  update(humans) {
    if (!this.mesh || this.isControlled) return;

    // Interpret Pheromone Command Zones
    const activeZone = pheromoneSystem.commandZones[pheromoneSystem.commandZones.length - 1];

    if (activeZone) {
      const dist = Math.hypot(activeZone.x - this.x, activeZone.z - this.z);
      if (dist > 1.0) {
        this.x += ((activeZone.x - this.x) / dist) * this.speed;
        this.z += ((activeZone.z - this.z) / dist) * this.speed;
        this.mesh.position.set(this.x, 0, this.z);
      }
    }
  }
}
