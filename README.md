# UAP Game Engine

Minimalistic 3D game engine for web browsers. Built for simplicity, performance, and minimal dependencies.

## Quick Start

```bash
make install
make build
make server
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

```javascript
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

const game = new Game(document.getElementById('canvas'));
game.add(new MyGame());
game.start();
```

## Commands

- `make install` - Install dependencies (validates limit)
- `make build` - Build library and demos (validates limit)
- `make test` - Run test suite
- `make deps` - Check dependency count and list all deps
- `make server` - Start development server
- `make clean` - Remove build artifacts

## Demos

1. Spinning RGB triangle
2. Mouse-reactive triangle
3. WASD box room navigation

## Dependencies

- gl-matrix (3D math)
- esbuild (build tool, dev only)

See SPEC.md for complete documentation.
