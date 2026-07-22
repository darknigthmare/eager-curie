/* 2.5D WebGL Renderer with Three.js for HIVE ASCENSION */
import * as THREE from 'three';

export class Renderer2D3D {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.lights = {};
    this.sprites = new Map();
    this.mapGroup = null;
    this.resinGroup = null;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }

  init(canvas) {
    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070a);
    this.scene.fog = new THREE.FogExp2(0x05070a, 0.025);

    // 2. Camera setup - Semi-isometric perspective (45 deg tilt)
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 35, 30);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting setup
    const ambient = new THREE.AmbientLight(0x1a2436, 0.7);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x406090, 0.8);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    // Red emergency light source
    const redEmergency = new THREE.PointLight(0xff0044, 2.0, 25);
    redEmergency.position.set(-15, 6, -10);
    this.scene.add(redEmergency);

    // Bio-green light source
    const bioGreen = new THREE.PointLight(0x39ff14, 1.5, 20);
    bioGreen.position.set(15, 4, 10);
    this.scene.add(bioGreen);

    this.lights = { ambient, dirLight, redEmergency, bioGreen };

    // 5. Groups setup
    this.mapGroup = new THREE.Group();
    this.resinGroup = new THREE.Group();
    this.scene.add(this.mapGroup);
    this.scene.add(this.resinGroup);

    // Window Resize handling
    window.addEventListener('resize', () => this.onWindowResize());
  }

  onWindowResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  // Set camera target position (follows player or RTS view smoothly)
  setCameraTarget(x, z, heightOffset = 0, isRTS = false) {
    const targetY = isRTS ? 45 : 30 + heightOffset;
    const targetZ = isRTS ? z + 35 : z + 25;

    this.camera.position.x += (x - this.camera.position.x) * 0.1;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.1;

    this.camera.lookAt(x, 0, z);
  }

  // Create procedural wall/floor texture for station
  createTileTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (type === 'floor') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, 120, 120);
      // Metal grid lines
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, 0); ctx.lineTo(32, 128);
      ctx.moveTo(64, 0); ctx.lineTo(64, 128);
      ctx.moveTo(96, 0); ctx.lineTo(96, 128);
      ctx.stroke();
    } else if (type === 'wall') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(8, 8, 112, 112);
      ctx.fillStyle = '#334155';
      ctx.fillRect(16, 16, 96, 10);
      ctx.fillRect(16, 102, 96, 10);
    } else if (type === 'vent') {
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#312e81';
      for (let i = 0; i < 128; i += 16) {
        ctx.fillRect(0, i, 128, 6);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Render loop call
  render() {
    // Pulse lights dynamically
    if (this.lights.redEmergency) {
      this.lights.redEmergency.intensity = 1.8 + Math.sin(Date.now() * 0.005) * 0.7;
    }
    if (this.lights.bioGreen) {
      this.lights.bioGreen.intensity = 1.4 + Math.sin(Date.now() * 0.003) * 0.4;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

export const rendererEngine = new Renderer2D3D();
