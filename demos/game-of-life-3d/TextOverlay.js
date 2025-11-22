import { Entity } from '../../src/index.js';

export class TextOverlay extends Entity {
  constructor(gameOfLife3D) {
    super();
    this.gameOfLife3D = gameOfLife3D;
    this.overlayCanvas = null;
    this.ctx = null;
  }

  init(game) {
    super.init(game);

    // Create overlay canvas for text
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = game.canvas.width;
    this.overlayCanvas.height = game.canvas.height;
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.top = '0';
    this.overlayCanvas.style.left = '0';
    this.overlayCanvas.style.pointerEvents = 'none';

    // Insert after the WebGL canvas
    game.canvas.parentNode.insertBefore(this.overlayCanvas, game.canvas.nextSibling);

    this.ctx = this.overlayCanvas.getContext('2d');

    // Handle resize
    const originalOnResize = game.onResize;
    game.onResize = () => {
      if (originalOnResize) originalOnResize();
      this.overlayCanvas.width = game.canvas.width;
      this.overlayCanvas.height = game.canvas.height;
    };
  }

  render() {
    if (!this.ctx) return;

    // Clear previous frame
    this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    // Set text style
    this.ctx.fillStyle = 'black';
    this.ctx.font = '20px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    // Draw cell count
    const text = `cells: ${this.gameOfLife3D.aliveCount}`;
    this.ctx.fillText(text, 10, 10);
  }
}
