import { Input } from './Input.js';
import { AudioManager } from './AudioManager.js';

export class Game {
  constructor(canvas, targetFps = 60) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2');
    this.targetFps = targetFps;
    this.frameTime = 1000 / targetFps;
    this.lastTime = 0;
    this.entities = [];
    this.camera = null;
    this.running = false;
    this.timers = [];

    // Initialize Input and AudioManager as member variables
    this.input = new Input();
    this.audio = new AudioManager();

    this.setupResize();
  }

  setupResize() {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      if (this.onResize) this.onResize();
    };
    window.addEventListener('resize', resize);
    resize();
  }

  add(entity) {
    this.entities.push(entity);
    if (entity.init) entity.init(this);
  }

  remove(entity) {
    const idx = this.entities.indexOf(entity);
    if (idx >= 0) this.entities.splice(idx, 1);
  }

  setCamera(camera) {
    this.camera = camera;
    if (camera.init) camera.init(this);
    // Add camera to entities if it has update or render methods
    if (camera.update || camera.render) {
      this.entities.push(camera);
    }
  }

  after(seconds, callback) {
    const timer = { time: seconds, callback, repeat: false };
    this.timers.push(timer);
    return timer;
  }

  every(seconds, callback) {
    const timer = { time: seconds, interval: seconds, callback, repeat: true };
    this.timers.push(timer);
    return timer;
  }

  clearEvent(timer) {
    const idx = this.timers.indexOf(timer);
    if (idx >= 0) this.timers.splice(idx, 1);
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.running = false;
  }

  loop() {
    if (!this.running) return;

    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;

    if (now - this.lastTime >= this.frameTime) {
      this.update(delta);
      this.render();
      this.lastTime = now;
    }

    this.updateTimers(delta);
    requestAnimationFrame(() => this.loop());
  }

  updateTimers(delta) {
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const timer = this.timers[i];
      timer.time -= delta;
      if (timer.time <= 0) {
        timer.callback();
        // Check if timer still exists (might have been cleared in callback)
        const timerStillExists = this.timers[i] === timer;
        if (timerStillExists) {
          if (timer.repeat) {
            // Reset timer for repeating timers, accounting for overflow
            timer.time = timer.interval + timer.time;
          } else {
            // Remove one-time timers
            this.timers.splice(i, 1);
          }
        }
      }
    }
  }

  update(delta) {
    for (const entity of this.entities) {
      if (entity.update) entity.update(delta);
    }
    // Update input states at the end of the frame for edge detection
    this.input.update();
  }

  render() {
    for (const entity of this.entities) {
      if (entity.render) entity.render(this.gl);
    }
  }
}
