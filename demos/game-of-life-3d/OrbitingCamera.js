import { Camera } from '../../src/index.js';
import { mat4 } from 'gl-matrix';

export class OrbitingCamera extends Camera {
  constructor(options = {}) {
    super(options);
    this.orbitRadius = options.orbitRadius || 5;
    this.orbitSpeed = options.orbitSpeed || 0.3;
    this.orbitAngle = 0;
    this.orbitHeight = options.orbitHeight || 3;
    this.autoOrbit = options.autoOrbit !== undefined ? options.autoOrbit : true;

    // Mouse/touch control state
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.rotationX = 0; // Horizontal rotation
    this.rotationY = 0; // Vertical rotation
    this.dragSensitivity = options.dragSensitivity || 0.005;

    // Zoom/scroll configuration
    this.minRadius = options.minRadius || 2;
    this.maxRadius = options.maxRadius || 50;
    this.zoomSensitivity = options.zoomSensitivity || 0.1;

    // Set initial position based on orbit parameters
    this.updateOrbitPosition();
  }

  init(game) {
    super.init(game);
    this.setupMouseControls(game.canvas);
  }

  setupMouseControls(canvas) {
    // Mouse events
    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      e.preventDefault();
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;

        this.rotationX -= deltaX * this.dragSensitivity;
        this.rotationY += deltaY * this.dragSensitivity;

        // Clamp vertical rotation to avoid flipping
        this.rotationY = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.rotationY));

        this.updateOrbitPosition();

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });

    // Touch events
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
        e.preventDefault();
      }
    });

    canvas.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - this.lastMouseX;
        const deltaY = e.touches[0].clientY - this.lastMouseY;

        this.rotationX -= deltaX * this.dragSensitivity;
        this.rotationY += deltaY * this.dragSensitivity;

        // Clamp vertical rotation
        this.rotationY = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.rotationY));

        this.updateOrbitPosition();

        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
        e.preventDefault();
      }
    });

    canvas.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    canvas.addEventListener('touchcancel', () => {
      this.isDragging = false;
    });

    // Scroll/wheel events for zooming
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();

      // Adjust orbit radius based on scroll direction
      // Normalize deltaY (different browsers/devices use different values)
      const delta = Math.sign(e.deltaY);

      // Calculate new radius
      const zoomAmount = delta * this.zoomSensitivity * this.orbitRadius;
      this.orbitRadius = Math.max(this.minRadius, Math.min(this.maxRadius, this.orbitRadius + zoomAmount));

      // Update camera position with new radius
      this.updateOrbitPosition();
    }, { passive: false });
  }

  updateOrbitPosition() {
    // Calculate position on a sphere using rotation angles
    const cosY = Math.cos(this.rotationY);
    const sinY = Math.sin(this.rotationY);
    const cosX = Math.cos(this.rotationX);
    const sinX = Math.sin(this.rotationX);

    this.position[0] = this.target[0] + this.orbitRadius * cosY * sinX;
    this.position[1] = this.target[1] + this.orbitRadius * sinY;
    this.position[2] = this.target[2] + this.orbitRadius * cosY * cosX;

    mat4.lookAt(this.view, this.position, this.target, this.up);
  }

  update(delta) {
    // Only auto-orbit if not dragging and auto-orbit is enabled
    if (this.autoOrbit && !this.isDragging) {
      this.rotationX += delta * this.orbitSpeed;
      this.updateOrbitPosition();
    }
  }
}
