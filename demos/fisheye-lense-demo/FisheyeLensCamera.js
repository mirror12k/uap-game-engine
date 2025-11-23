import { Camera } from '../../src/index.js';

export class FisheyeLensCamera extends Camera {
  constructor(options = {}) {
    super(options);
    this.fisheyeStrength = options.fisheyeStrength || 0.5;
  }

  getFisheyeStrength() {
    return this.fisheyeStrength;
  }

  setFisheyeStrength(strength) {
    this.fisheyeStrength = strength;
  }
}
