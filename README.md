# UAP Game Engine

Minimalistic 3D game engine for web browsers. Built for simplicity, performance, and minimal dependencies.

## Quick Start

```bash
npm install
npm run build
npm run server
```

Open http://localhost:8080/dist/demo1.html

## Features

- Single HTML file output with all assets inlined
- 60 FPS game loop with delta timing
- WebGL2 shader support
- Entity-component system
- Keyboard input with named key mapping
- Async timer system
- Auto-resizing canvas
- Custom test suite (zero test dependencies)
- 12 dependency hard limit (currently 2)

## Usage

### Creating a Game

Install the engine:
```bash
npm install uap-game-engine
```

Create your game in a `src/` directory:
```javascript
// src/index.js
import { Game, Entity, Shader, Input } from 'uap-game-engine';

class MyGame extends Entity {
  init(game) {
    this.shader = new Shader(game.gl, vertexShader, fragmentShader);
  }

  update(delta) {
    // Game logic
  }

  render(gl) {
    // Rendering
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.add(new MyGame());
game.start();
```

### Building Your Game

Add to your `package.json`:
```json
{
  "scripts": {
    "build": "uap-build"
  }
}
```

Build your game:
```bash
npm run build
```

This compiles your game from `src/index.js` (and any files it imports) into a single self-contained HTML file at `dist/index.html`.

### Using Physics with Matter.js

For 2D physics simulation with rotation, collision detection, and realistic forces, you can use [Matter.js](https://brm.io/matter-js/):

```bash
npm install matter-js
```

Example usage:
```javascript
import { Game, Entity, ShaderManager, Input, mat4 } from 'uap-game-engine';
import Matter from 'matter-js';

class PhysicsGame extends Entity {
  init(game) {
    super.init(game);

    // Create Matter.js engine
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;

    // Configure gravity
    this.engine.gravity.y = 1;

    // Add physics bodies
    const box = Matter.Bodies.rectangle(400, 200, 80, 80);
    Matter.World.add(this.world, box);

    // Add static ground
    const ground = Matter.Bodies.rectangle(400, 600, 800, 50, { isStatic: true });
    Matter.World.add(this.world, ground);
  }

  update(delta) {
    // Update physics (delta is in seconds, Matter expects milliseconds)
    Matter.Engine.update(this.engine, delta * 1000);
  }

  render(gl) {
    // Render bodies using body.position.x, body.position.y, and body.angle
    for (const body of this.world.bodies) {
      // Use mat4 transformations to render rotated bodies
      mat4.identity(modelMatrix);
      mat4.translate(modelMatrix, modelMatrix, [body.position.x, body.position.y, 0]);
      mat4.rotateZ(modelMatrix, modelMatrix, body.angle);
      // ... render with WebGL
    }
  }
}
```

See `demos/physics-demo/` for a complete example with mouse interaction and multiple bodies.

## Commands

- `npm install` - Install dependencies (validates limit)
- `npm run build` - Build library and demos (validates limit)
- `npm test` - Run test suite
- `npm run deps` - Check dependency count and list all deps
- `npm run server` - Start development server

## Publishing to NPM

First-time setup:
```bash
npm login
```

Before publishing:
1. Update version: `npm version [patch|minor|major]`
2. Run tests: `npm test`
3. Build: `npm run build`

Publish:
```bash
npm publish
```

The `files` field in package.json ensures only `dist/index.js` and `README.md` are published, keeping the package minimal.

## Demos

1. Spinning RGB triangle
2. Mouse-reactive triangle
3. WASD box room navigation
4. Block game with terrain
5. Conway's Game of Life (2D)
6. Conway's Game of Life (3D)
7. Physics demo with Matter.js (drag to create boxes with rotation)

## Dependencies

- gl-matrix (3D math)
- esbuild (build tool)

See SPEC.md for complete documentation.
