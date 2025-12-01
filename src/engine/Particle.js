export class Particle {
  constructor(options) {
    this.position = options.position || [0, 0, 0];
    this.velocity = options.velocity || [0, 0, 0];
    this.acceleration = options.acceleration || [0, 0, 0];
    this.color_start = options.color_start || [1, 1, 1, 1];
    this.color_end = options.color_end || [1, 1, 1, 0];
    this.duration = options.duration || 1.0;
    this.age = 0;
    this.size = options.size || 0.1;
  }

  update(delta) {
    this.age += delta;
    this.velocity[0] += this.acceleration[0] * delta;
    this.velocity[1] += this.acceleration[1] * delta;
    this.velocity[2] += this.acceleration[2] * delta;
    this.position[0] += this.velocity[0] * delta;
    this.position[1] += this.velocity[1] * delta;
    this.position[2] += this.velocity[2] * delta;
  }

  isDead() {
    return this.age >= this.duration;
  }

  getCurrentColor() {
    const t = Math.min(this.age / this.duration, 1.0);
    return [
      this.color_start[0] + (this.color_end[0] - this.color_start[0]) * t,
      this.color_start[1] + (this.color_end[1] - this.color_start[1]) * t,
      this.color_start[2] + (this.color_end[2] - this.color_start[2]) * t,
      this.color_start[3] + (this.color_end[3] - this.color_start[3]) * t
    ];
  }
}
