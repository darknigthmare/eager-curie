/* Resin Grid Propagation System for HIVE ASCENSION */
import * as THREE from 'three';
import { rendererEngine } from '../engine/Renderer2D3D.js';

export class ResinGrid {
  constructor() {
    this.nodes = [];
    this.totalCoverage = 0;
    this.resinMat = null;
  }

  init() {
    this.resinMat = new THREE.MeshStandardMaterial({
      color: 0x9d4edd,
      emissive: 0x3c096c,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
  }

  addResinPatch(x, z, radius = 4) {
    const geo = new THREE.CircleGeometry(radius, 16);
    const mesh = new THREE.Mesh(geo, this.resinMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.05, z);

    rendererEngine.resinGroup.add(mesh);
    this.nodes.push({ x, z, radius, mesh });

    this.totalCoverage = Math.min(100, this.nodes.length * 4);
    this.updateHUDCoverage();
  }

  updateHUDCoverage() {
    const el = document.getElementById('hive-resin');
    if (el) {
      el.textContent = `${this.totalCoverage}%`;
    }
  }

  isPositionOnResin(x, z) {
    for (const node of this.nodes) {
      const dist = Math.hypot(node.x - x, node.z - z);
      if (dist <= node.radius) return true;
    }
    return false;
  }
}

export const resinGrid = new ResinGrid();
