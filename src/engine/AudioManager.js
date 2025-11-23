export class AudioManager {
  constructor() {
    this.context = null;
    this.initialized = false;
  }

  init() {
    if (!this.initialized) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    }
    return this.context;
  }

  getContext() {
    if (!this.initialized) {
      this.init();
    }
    return this.context;
  }

  createOscillator() {
    return this.getContext().createOscillator();
  }

  createGain() {
    return this.getContext().createGain();
  }

  getCurrentTime() {
    return this.getContext().currentTime;
  }

  getDestination() {
    return this.getContext().destination;
  }

  resume() {
    if (this.initialized && this.context.state === 'suspended') {
      return this.context.resume();
    }
    return Promise.resolve();
  }
}
