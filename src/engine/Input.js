const KEY_MAP = {
  KeyW: 'forward',
  KeyA: 'left',
  KeyS: 'backward',
  KeyD: 'right',
  Space: 'jump',
  ShiftLeft: 'sprint',
  ShiftRight: 'sprint',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Escape: 'escape',
  Enter: 'enter'
};

export class Input {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0, buttons: {} };

    window.addEventListener('keydown', (e) => {
      const name = KEY_MAP[e.code] || e.code;
      this.keys[name] = true;
    });

    window.addEventListener('keyup', (e) => {
      const name = KEY_MAP[e.code] || e.code;
      this.keys[name] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      this.mouse.buttons[e.button] = true;
    });

    window.addEventListener('mouseup', (e) => {
      this.mouse.buttons[e.button] = false;
    });
  }

  isKeyDown(key) {
    return !!this.keys[key];
  }

  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  isMouseButtonDown(button = 0) {
    return !!this.mouse.buttons[button];
  }
}
