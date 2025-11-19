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

## Dependencies

- gl-matrix (3D math)
- esbuild (build tool)

See SPEC.md for complete documentation.
