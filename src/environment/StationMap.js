/* Station Acheron-9 Layout & Geometry Builder */
import * as THREE from 'three';
import { rendererEngine } from '../engine/Renderer2D3D.js';

export class StationMap {
  constructor() {
    this.rooms = [];
    this.walls = [];
    this.doors = [];
    this.vents = [];
  }

  buildMap() {
    const floorTex = rendererEngine.createTileTexture('floor');
    floorTex.repeat.set(10, 10);
    const wallTex = rendererEngine.createTileTexture('wall');

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.4,
      metalness: 0.6
    });

    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.5,
      metalness: 0.7
    });

    const ventMat = new THREE.MeshStandardMaterial({
      color: 0x312e81,
      roughness: 0.3,
      metalness: 0.8
    });

    // Main Station Floor Plane
    const floorGeo = new THREE.PlaneGeometry(120, 120);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    rendererEngine.mapGroup.add(floorMesh);

    // Wall Builder Helper
    const addWall = (x, z, width, height, depth) => {
      const wallGeo = new THREE.BoxGeometry(width, height, depth);
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(x, height / 2, z);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      rendererEngine.mapGroup.add(wallMesh);
      this.walls.push({ box: new THREE.Box3().setFromObject(wallMesh), mesh: wallMesh });
    };

    // Outer Station Boundaries
    addWall(0, -50, 100, 8, 2);
    addWall(0, 50, 100, 8, 2);
    addWall(-50, 0, 2, 8, 100);
    addWall(50, 0, 2, 8, 100);

    // Room 1: Incubator / Lab (Center Left)
    addWall(-20, -15, 30, 8, 2);
    addWall(-35, 0, 2, 8, 30);

    // Room 2: Medical Bay (Center Right)
    addWall(20, -15, 30, 8, 2);
    addWall(35, 0, 2, 8, 30);

    // Room 3: Hive Nest Chamber (Bottom Center)
    addWall(0, 25, 40, 8, 2);
    addWall(-20, 35, 2, 8, 20);
    addWall(20, 35, 2, 8, 20);

    // Add Ventilation Shafts (Conduits elevated on walls)
    const addVent = (x, z, width, depth) => {
      const ventGeo = new THREE.BoxGeometry(width, 2, depth);
      const ventMesh = new THREE.Mesh(ventGeo, ventMat);
      ventMesh.position.set(x, 6, z);
      rendererEngine.mapGroup.add(ventMesh);
      this.vents.push({ x, z, width, depth });
    };

    addVent(-25, -25, 15, 4);
    addVent(25, -25, 15, 4);
    addVent(0, 10, 4, 25);

    console.log('[Map] Station Acheron-9 map constructed.');
  }
}

export const stationMap = new StationMap();
