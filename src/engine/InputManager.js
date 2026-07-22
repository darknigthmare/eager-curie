/* Input Manager for HIVE ASCENSION */
export class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, isDown: false, rightDown: false };
    this.listeners = [];
  }

  init(canvasElement) {
    this.canvas = canvasElement;

    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;
      this.emit('keydown', e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
      this.emit('keyup', e.key.toLowerCase());
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.emit('mousemove', this.mouse);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.isDown = true;
      if (e.button === 2) this.mouse.rightDown = true;
      this.emit('mousedown', { button: e.button, x: this.mouse.x, y: this.mouse.y });
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.isDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
      this.emit('mouseup', { button: e.button, x: this.mouse.x, y: this.mouse.y });
    });

    // Disable context menu on right click for RTS controls
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  isKeyPressed(key) {
    return !!this.keys[key.toLowerCase()];
  }

  getMovementVector() {
    let dx = 0;
    let dy = 0;
    if (this.isKeyPressed('w') || this.isKeyPressed('z') || this.isKeyPressed('arrowup')) dy -= 1;
    if (this.isKeyPressed('s') || this.isKeyPressed('arrowdown')) dy += 1;
    if (this.isKeyPressed('a') || this.isKeyPressed('q') || this.isKeyPressed('arrowleft')) dx -= 1;
    if (this.isKeyPressed('d') || this.isKeyPressed('arrowright')) dx += 1;

    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
    }
    return { dx, dy };
  }

  on(event, callback) {
    this.listeners.push({ event, callback });
  }

  emit(event, payload) {
    for (const l of this.listeners) {
      if (l.event === event) l.callback(payload);
    }
  }
}

export const inputManager = new InputManager();
