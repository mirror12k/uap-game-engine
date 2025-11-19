export class Game {
  constructor(canvas, targetFps = 60) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2');
    this.targetFps = targetFps;
    this.frameTime = 1000 / targetFps;
    this.lastTime = 0;
    this.entities = [];
    this.running = false;
    this.timers = [];

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

  after(seconds, callback) {
    this.timers.push({ time: seconds, callback });
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
      this.timers[i].time -= delta;
      if (this.timers[i].time <= 0) {
        this.timers[i].callback();
        this.timers.splice(i, 1);
      }
    }
  }

  update(delta) {
    for (const entity of this.entities) {
      if (entity.update) entity.update(delta);
    }
  }

  render() {
    for (const entity of this.entities) {
      if (entity.render) entity.render(this.gl);
    }
  }
}
