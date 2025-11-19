export class Entity {
  constructor() {
    this.game = null;
  }

  init(game) {
    this.game = game;
  }

  update(delta) {}

  render(gl) {}
}
