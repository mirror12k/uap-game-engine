import { Game, Entity, ShaderManager, mat4 } from '../../src/index.js';

class PianoKeyboard extends Entity {
  init(game) {
    super.init(game);
    const gl = game.gl;

    // Piano key definitions (2 octaves starting from C4)
    this.whiteKeys = [
      { note: 'C4', freq: 261.63, keyCode: 'KeyA', x: 0 },
      { note: 'D4', freq: 293.66, keyCode: 'KeyS', x: 1 },
      { note: 'E4', freq: 329.63, keyCode: 'KeyD', x: 2 },
      { note: 'F4', freq: 349.23, keyCode: 'KeyF', x: 3 },
      { note: 'G4', freq: 392.00, keyCode: 'KeyG', x: 4 },
      { note: 'A4', freq: 440.00, keyCode: 'KeyH', x: 5 },
      { note: 'B4', freq: 493.88, keyCode: 'KeyJ', x: 6 },
      { note: 'C5', freq: 523.25, keyCode: 'KeyK', x: 7 },
      { note: 'D5', freq: 587.33, keyCode: 'KeyL', x: 8 },
      { note: 'E5', freq: 659.25, keyCode: 'Semicolon', x: 9 },
    ];

    this.blackKeys = [
      { note: 'C#4', freq: 277.18, keyCode: 'KeyW', x: 0.7 },
      { note: 'D#4', freq: 311.13, keyCode: 'KeyE', x: 1.7 },
      { note: 'F#4', freq: 369.99, keyCode: 'KeyT', x: 3.7 },
      { note: 'G#4', freq: 415.30, keyCode: 'KeyY', x: 4.7 },
      { note: 'A#4', freq: 466.16, keyCode: 'KeyU', x: 5.7 },
      { note: 'C#5', freq: 554.37, keyCode: 'KeyO', x: 7.7 },
      { note: 'D#5', freq: 622.25, keyCode: 'KeyP', x: 8.7 },
    ];

    this.allKeys = [...this.whiteKeys, ...this.blackKeys];

    // Track which keys are currently pressed
    this.activeKeys = new Set();
    this.activeOscillators = new Map();

    // Setup mouse listeners
    this.setupMouseListeners(game.canvas);

    // Create shader for rendering keys
    this.shader = ShaderManager.getShader(gl, `
      attribute vec2 position;
      uniform mat4 projection;
      uniform mat4 model;

      void main() {
        gl_Position = projection * model * vec4(position, 0.0, 1.0);
      }
    `, `
      precision mediump float;
      uniform vec3 color;

      void main() {
        gl_FragColor = vec4(color, 1.0);
      }
    `);

    // Create VBO for a single quad (will be reused for each key)
    const vertices = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1
    ]);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    this.projection = mat4.create();
    this.model = mat4.create();

    // Setup orthographic projection for 2D rendering
    const aspect = gl.canvas.width / gl.canvas.height;
    mat4.ortho(this.projection, 0, 10, 0, 10 / aspect, -1, 1);
  }

  setupMouseListeners(canvas) {
    const handleMouseEvent = (e, isDown) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert to normalized coordinates
      const normalizedX = (x / rect.width) * 10;
      const normalizedY = (1 - y / rect.height) * (10 / (rect.width / rect.height));

      // Check black keys first (they're on top)
      for (const key of this.blackKeys) {
        if (this.isPointInKey(normalizedX, normalizedY, key, true)) {
          if (isDown && !this.activeKeys.has(key.note)) {
            this.playNote(key.freq, key.note);
            this.activeKeys.add(key.note);
          } else if (!isDown) {
            this.stopNote(key.note);
            this.activeKeys.delete(key.note);
          }
          return;
        }
      }

      // Check white keys
      for (const key of this.whiteKeys) {
        if (this.isPointInKey(normalizedX, normalizedY, key, false)) {
          if (isDown && !this.activeKeys.has(key.note)) {
            this.playNote(key.freq, key.note);
            this.activeKeys.add(key.note);
          } else if (!isDown) {
            this.stopNote(key.note);
            this.activeKeys.delete(key.note);
          }
          return;
        }
      }
    };

    canvas.addEventListener('mousedown', (e) => handleMouseEvent(e, true));
    canvas.addEventListener('mouseup', (e) => handleMouseEvent(e, false));

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (let touch of e.touches) {
        handleMouseEvent(touch, true);
      }
    });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (let touch of e.changedTouches) {
        handleMouseEvent(touch, false);
      }
    });
  }

  isPointInKey(x, y, key, isBlack) {
    const keyWidth = 0.9;
    const whiteKeyHeight = 4;
    const blackKeyHeight = 2.5;
    const yOffset = 2;

    if (isBlack) {
      const keyX = key.x;
      const keyY = yOffset + whiteKeyHeight - blackKeyHeight;
      return x >= keyX && x <= keyX + keyWidth * 0.6 &&
             y >= keyY && y <= keyY + blackKeyHeight;
    } else {
      const keyX = key.x;
      const keyY = yOffset;
      return x >= keyX && x <= keyX + keyWidth &&
             y >= keyY && y <= keyY + whiteKeyHeight;
    }
  }

  playNote(frequency, noteName) {
    // Use game's AudioManager to create oscillator
    const oscillator = this.game.audio.createOscillator();
    const gainNode = this.game.audio.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.game.audio.getDestination());

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine'; // Piano-like sound

    // Envelope: quick attack, sustain
    const currentTime = this.game.audio.getCurrentTime();
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.01);

    oscillator.start();
    this.activeOscillators.set(noteName, { oscillator, gainNode });
  }

  stopNote(noteName) {
    const osc = this.activeOscillators.get(noteName);
    if (osc) {
      // Quick fade out
      const currentTime = this.game.audio.getCurrentTime();
      osc.gainNode.gain.setValueAtTime(osc.gainNode.gain.value, currentTime);
      osc.gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.1);
      osc.oscillator.stop(currentTime + 0.1);
      this.activeOscillators.delete(noteName);
    }
  }

  update(delta) {
    // Check keyboard input using game.input edge detection
    for (const key of this.allKeys) {
      // Key just pressed
      if (this.game.input.isKeyPressed(key.keyCode)) {
        if (!this.activeKeys.has(key.note)) {
          this.playNote(key.freq, key.note);
          this.activeKeys.add(key.note);
        }
      }
      // Key just released
      else if (this.game.input.isKeyReleased(key.keyCode)) {
        this.stopNote(key.note);
        this.activeKeys.delete(key.note);
      }
    }
  }

  render(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clearColor(0.15, 0.15, 0.2, 1.0);
    gl.disable(gl.DEPTH_TEST);

    this.shader.use();
    this.shader.setUniformMatrix('projection', this.projection);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    const posAttr = this.shader.getAttribute('position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const colorLoc = gl.getUniformLocation(this.shader.program, 'color');

    // Draw white keys
    for (const key of this.whiteKeys) {
      mat4.identity(this.model);
      mat4.translate(this.model, this.model, [key.x, 2, 0]);
      mat4.scale(this.model, this.model, [0.9, 4, 1]);

      this.shader.setUniformMatrix('model', this.model);

      // Color: white or yellow if pressed
      if (this.activeKeys.has(key.note)) {
        gl.uniform3f(colorLoc, 1.0, 1.0, 0.5);
      } else {
        gl.uniform3f(colorLoc, 0.95, 0.95, 0.95);
      }

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Draw border
      gl.uniform3f(colorLoc, 0.2, 0.2, 0.2);
      gl.drawArrays(gl.LINE_LOOP, 0, 4);
    }

    // Draw black keys on top
    for (const key of this.blackKeys) {
      mat4.identity(this.model);
      mat4.translate(this.model, this.model, [key.x, 4.5, 0]);
      mat4.scale(this.model, this.model, [0.54, 2.5, 1]);

      this.shader.setUniformMatrix('model', this.model);

      // Color: black or gray if pressed
      if (this.activeKeys.has(key.note)) {
        gl.uniform3f(colorLoc, 0.4, 0.4, 0.4);
      } else {
        gl.uniform3f(colorLoc, 0.1, 0.1, 0.1);
      }

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.add(new PianoKeyboard());
game.start();
