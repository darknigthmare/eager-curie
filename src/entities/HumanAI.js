/* Human AI (Scientists, Guards, Clean-up Squad) for HIVE ASCENSION */
import * as THREE from 'three';
import { rendererEngine } from '../engine/Renderer2D3D.js';

export class HumanAI {
  constructor(id, type, x, z) {
    this.id = id;
    this.type = type; // 'scientist' | 'guard' | 'cleaner'
    this.x = x;
    this.z = z;
    this.hp = type === 'cleaner' ? 150 : (type === 'guard' ? 100 : 50);
    this.state = 'patrol'; // 'patrol' | 'investigate' | 'panic' | 'attack' | 'infected'
    this.mesh = null;
    this.targetPos = { x, z };
    this.flashLight = null;
  }

  createMesh() {
    const group = new THREE.Group();

    // Body Mesh
    const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 8);
    let color = 0x38bdf8; // Scientist Blue
    if (this.type === 'guard') color = 0xf59e0b; // Guard Amber
    if (this.type === 'cleaner') color = 0xef4444; // Cleaner Red

    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
    const mesh = new THREE.Mesh(bodyGeo, mat);
    mesh.position.y = 0.9;
    group.add(mesh);

    // Head Mesh
    const headGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfde047 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 2.0;
    group.add(headMesh);

    // Flashlight for Guards/Cleaners
    if (this.type !== 'scientist') {
      const spot = new THREE.SpotLight(0xffffff, 2.0, 15, Math.PI / 6);
      spot.position.set(0, 1.6, 0.5);
      spot.target.position.set(0, 0, 5);
      group.add(spot);
      group.add(spot.target);
      this.flashLight = spot;
    }

    group.position.set(this.x, 0, this.z);
    rendererEngine.scene.add(group);
    this.mesh = group;
  }

  update() {
    if (!this.mesh || this.state === 'infected') return;

    // Patrol logic towards target
    const dist = Math.hypot(this.targetPos.x - this.x, this.targetPos.z - this.z);
    if (dist > 0.5) {
      const speed = this.state === 'panic' ? 0.25 : 0.1;
      this.x += ((this.targetPos.x - this.x) / dist) * speed;
      this.z += ((this.targetPos.z - this.z) / dist) * speed;
      this.mesh.position.set(this.x, 0, this.z);
    } else {
      // Pick new random patrol target
      this.targetPos = {
        x: this.x + (Math.random() * 20 - 10),
        z: this.z + (Math.random() * 20 - 10)
      };
    }
  }

  infect() {
    this.state = 'infected';
    if (this.mesh) {
      // Change color to infected purple
      this.mesh.children[0].material.color.setHex(0x9d4edd);
    }
  }
}
