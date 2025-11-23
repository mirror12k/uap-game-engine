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
    this.previousKeys = {};
    this.mouse = { x: 0, y: 0, buttons: {}, previousButtons: {} };

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

  update() {
    // Update previous key states for edge detection
    this.previousKeys = { ...this.keys };

    // Update previous mouse button states
    this.mouse.previousButtons = { ...this.mouse.buttons };
  }

  isKeyDown(key) {
    return !!this.keys[key];
  }

  isKeyPressed(key) {
    return !!this.keys[key] && !this.previousKeys[key];
  }

  isKeyReleased(key) {
    return !this.keys[key] && !!this.previousKeys[key];
  }

  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  isMouseButtonDown(button = 0) {
    return !!this.mouse.buttons[button];
  }

  isMouseButtonPressed(button = 0) {
    return !!this.mouse.buttons[button] && !this.mouse.previousButtons[button];
  }

  isMouseButtonReleased(button = 0) {
    return !this.mouse.buttons[button] && !!this.mouse.previousButtons[button];
  }
}
