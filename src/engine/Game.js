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
    this.continuousCallbacks = [];

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

  until(condition, callback) {
    const timer = { time: 0, interval: 0, condition, callback, repeat: true, checkCondition: true };
    this.timers.push(timer);
    return timer;
  }

  continuous(callback) {
    const handle = { callback };
    this.continuousCallbacks.push(handle);
    return handle;
  }

  clearEvent(timer) {
    // Check if it's a timer
    const timerIdx = this.timers.indexOf(timer);
    if (timerIdx >= 0) {
      this.timers.splice(timerIdx, 1);
      return;
    }
    // Check if it's a continuous callback
    const continuousIdx = this.continuousCallbacks.indexOf(timer);
    if (continuousIdx >= 0) {
      this.continuousCallbacks.splice(continuousIdx, 1);
      return;
    }
    // Nothing was found to remove
    console.warn('clearEvent: No matching timer or continuous callback found to remove');
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
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);

    if (now - this.lastTime >= this.frameTime) {
      this.update(delta);
      this.render();
      this.lastTime = now;
    }

    this.updateTimers(delta);
    this.updateContinuous(delta);
    requestAnimationFrame(() => this.loop());
  }

  updateTimers(delta) {
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const timer = this.timers[i];

      // Handle until() timers with condition checking
      if (timer.checkCondition) {
        // Check if condition is met
        if (timer.condition()) {
          // Condition met, remove timer
          this.timers.splice(i, 1);
          continue;
        }
        // Execute callback every frame until condition is met
        timer.callback(delta);
        continue;
      }

      // Handle regular timers (after/every)
      timer.time -= delta;
      if (timer.time <= 0) {
        timer.callback(delta);
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

  updateContinuous(delta) {
    for (const handle of this.continuousCallbacks) {
      handle.callback(delta);
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
