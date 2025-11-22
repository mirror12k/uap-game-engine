import { Entity } from './Entity.js';
import { mat4 } from 'gl-matrix';

export class Camera extends Entity {
  constructor(options = {}) {
    super();
    this.position = options.position || [0, 0, 5];
    this.target = options.target || [0, 0, 0];
    this.up = options.up || [0, 1, 0];
    this.fov = options.fov || 45 * Math.PI / 180;
    this.near = options.near || 0.1;
    this.far = options.far || 100;

    this.view = mat4.create();
    this.projection = mat4.create();
  }

  init(game) {
    super.init(game);
    const aspect = game.canvas.width / game.canvas.height;
    mat4.perspective(this.projection, this.fov, aspect, this.near, this.far);
    mat4.lookAt(this.view, this.position, this.target, this.up);
  }

  setPosition(x, y, z) {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    mat4.lookAt(this.view, this.position, this.target, this.up);
  }

  setTarget(x, y, z) {
    this.target[0] = x;
    this.target[1] = y;
    this.target[2] = z;
    mat4.lookAt(this.view, this.position, this.target, this.up);
  }

  getViewMatrix() {
    return this.view;
  }

  getProjectionMatrix() {
    return this.projection;
  }
}
