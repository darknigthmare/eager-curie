/* Player Creature Class for HIVE ASCENSION */
import * as THREE from 'three';
import { rendererEngine } from '../engine/Renderer2D3D.js';
import { inputManager } from '../engine/InputManager.js';
import { audioManager } from '../engine/AudioManager.js';

export class PlayerCreature {
  constructor() {
    this.form = 'egg'; // 'egg' | 'facehugger' | 'chestburster' | 'drone'
    this.x = -25;
    this.z = -30;
    this.speed = 0.25;
    this.mesh = null;
    this.health = 100;
    this.secondaryResource = 100; // Acid / Energy / Time
    this.selectedMutation = null;
    this.isWallClimbing = false;
    this.isAttachedToHost = false;
  }

  createMesh() {
    const group = new THREE.Group();

    if (this.form === 'egg') {
      // Alien Egg Geometry (Leather-like pod with 4 opening petals)
      const eggGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const eggMat = new THREE.MeshStandardMaterial({
        color: 0x2d3748,
        emissive: 0x1a202c,
        roughness: 0.8,
        metalness: 0.2
      });
      const eggMesh = new THREE.Mesh(eggGeo, eggMat);
      eggMesh.scale.set(1, 1.4, 1);
      eggMesh.position.y = 1.2;
      group.add(eggMesh);

      // Top Petals indicator
      const petalGeo = new THREE.ConeGeometry(0.6, 0.8, 4);
      const petalMat = new THREE.MeshStandardMaterial({ color: 0x39ff14, emissive: 0x39ff14 });
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(0, 2.4, 0);
      group.add(petal);
    } else if (this.form === 'facehugger') {
      // Facehugger Sprite Mesh
      const geo = new THREE.SphereGeometry(0.6, 8, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.6;
      group.add(mesh);
    } else if (this.form === 'chestburster') {
      // Chestburster Serpent Form
      const geo = new THREE.CylinderGeometry(0.2, 0.4, 1.8, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.z = Math.PI / 2;
      mesh.position.y = 0.5;
      group.add(mesh);
    } else if (this.form === 'drone') {
      // Full Xenomorph Drone (Black biomechanical chassis + elongated dome head)
      const headGeo = new THREE.SphereGeometry(0.65, 16, 12);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.1,
        metalness: 0.9
      });
      const headMesh = new THREE.Mesh(headGeo, mat);
      headMesh.scale.set(1, 1, 2.2);
      headMesh.position.y = 2.2;
      group.add(headMesh);

      const bodyGeo = new THREE.BoxGeometry(1.2, 2.0, 1.0);
      const bodyMesh = new THREE.Mesh(bodyGeo, mat);
      bodyMesh.position.y = 1.0;
      group.add(bodyMesh);
    }

    group.position.set(this.x, 0, this.z);
    rendererEngine.scene.add(group);
    this.mesh = group;
  }

  setForm(form) {
    this.form = form;
    if (this.mesh) {
      rendererEngine.scene.remove(this.mesh);
    }

    // Adjust stats per form
    if (form === 'facehugger') this.speed = 0.45;
    else if (form === 'chestburster') this.speed = 0.35;
    else if (form === 'drone') this.speed = 0.40;

    this.createMesh();
    console.log(`[Player] Form updated to: ${form.toUpperCase()}`);
  }

  update() {
    if (!this.mesh) return;

    if (this.form !== 'egg' && !this.isAttachedToHost) {
      const { dx, dy } = inputManager.getMovementVector();
      this.x += dx * this.speed;
      this.z += dy * this.speed;

      this.mesh.position.set(this.x, 0, this.z);

      // Rotate towards movement direction
      if (dx !== 0 || dy !== 0) {
        const angle = Math.atan2(dx, dy);
        this.mesh.rotation.y = angle;
      }
    }
  }
}

export const playerCreature = new PlayerCreature();
