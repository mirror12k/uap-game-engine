import { Entity } from './Entity.js';
import { Particle } from './Particle.js';

export class ParticleEmitter extends Entity {
  constructor(position, particleSettings, emitterSettings) {
    super();
    this.position = position || [0, 0, 0];
    this.particleSettings = {
      duration: particleSettings.duration || 1.0,
      color_start: particleSettings.color_start || [1, 1, 1, 1],
      color_end: particleSettings.color_end || [1, 1, 1, 0],
      velocity: particleSettings.velocity || [0, 0, 0],
      acceleration: particleSettings.acceleration || [0, 0, 0],
      size: particleSettings.size || 0.1
    };
    this.variance = {
      duration: emitterSettings.duration_variance || 0,
      velocity: emitterSettings.velocity_variance || [0, 0, 0],
      acceleration: emitterSettings.acceleration_variance || [0, 0, 0],
      size: emitterSettings.size_variance || 0
    };
    this.rate = emitterSettings.rate || 1.0;
    this.radial_spread = emitterSettings.radial_spread || 0;
    this.particles = [];
    this.timeSinceLastSpawn = 0;
  }

  update(delta) {
    this.timeSinceLastSpawn += delta;
    const spawnInterval = 1.0 / this.rate;
    while (this.timeSinceLastSpawn >= spawnInterval) {
      this.spawnParticle();
      this.timeSinceLastSpawn -= spawnInterval;
    }
  }

  spawnParticle() {
    const duration = this.particleSettings.duration +
      (Math.random() * 2 - 1) * this.variance.duration;
    const velocity = [
      this.particleSettings.velocity[0] + (Math.random() * 2 - 1) * this.variance.velocity[0],
      this.particleSettings.velocity[1] + (Math.random() * 2 - 1) * this.variance.velocity[1],
      this.particleSettings.velocity[2] + (Math.random() * 2 - 1) * this.variance.velocity[2]
    ];
    const acceleration = [
      this.particleSettings.acceleration[0] + (Math.random() * 2 - 1) * this.variance.acceleration[0],
      this.particleSettings.acceleration[1] + (Math.random() * 2 - 1) * this.variance.acceleration[1],
      this.particleSettings.acceleration[2] + (Math.random() * 2 - 1) * this.variance.acceleration[2]
    ];
    const size = this.particleSettings.size + (Math.random() * 2 - 1) * this.variance.size;
    let spawnPosition = [...this.position];
    if (this.radial_spread > 0) {
      const theta = (Math.random() * 2 - 1) * this.radial_spread;
      const phi = Math.random() * Math.PI * 2;
      const spreadX = Math.sin(theta) * Math.cos(phi);
      const spreadY = Math.cos(theta);
      const spreadZ = Math.sin(theta) * Math.sin(phi);
      spawnPosition[0] += spreadX;
      spawnPosition[1] += spreadY;
      spawnPosition[2] += spreadZ;
    }
    const particle = new Particle({
      position: spawnPosition,
      velocity: velocity,
      acceleration: acceleration,
      color_start: this.particleSettings.color_start,
      color_end: this.particleSettings.color_end,
      duration: Math.max(duration, 0.1),
      size: Math.max(size, 0.01)
    });
    this.particles.push(particle);
  }

  getParticles() {
    return this.particles;
  }
}
