# Test Game - UAP Game Engine Demo

This is a demonstration project showing how to use the [uap-game-engine](https://www.npmjs.com/package/uap-game-engine) npm package to build a game from scratch.

## Game Description

A simple game featuring a colorful rotating square that scales up and down. Demonstrates:
- Entity-component system
- WebGL shader usage
- Animation and transformation
- Single HTML file output

## Project Structure

```
test-game/
├── src/           # Game source code
│   └── index.js   # Main entry point
├── package.json   # Dependencies
├── dist/          # Build output (auto-created)
│   └── index.html # Self-contained game file
└── README.md      # This file
```

## Setup

Install dependencies:
```bash
npm install
```

## Build

Compile the game to a single HTML file:
```bash
npm run build
```

Output: `dist/index.html` (single file with all assets inlined)

## Run

Start a local server:
```bash
npm run server
```

Open http://localhost:8080/dist/index.html in your browser

## How It Works

1. **src/index.js** - Main game entry point:
   - Imports `Game`, `Entity`, `Shader`, and `mat4` from uap-game-engine
   - Extends the `Entity` class to create custom game objects
   - Implements `init()`, `update()`, and `render()` lifecycle hooks
   - Can import other modules from the `src/` directory

2. **uap-build** - Engine's build tool:
   - Provided by the uap-game-engine package
   - Auto-creates the `dist` folder
   - Bundles all code from `src/index.js` (and imports) into a single JavaScript file
   - Inlines the JavaScript into an HTML template
   - Produces a self-contained HTML file ready for distribution

3. **dist/index.html** - The final output:
   - Single HTML file (~21KB)
   - No external dependencies at runtime
   - Ready to deploy anywhere

## Customization

Modify `src/index.js` to create your own game:
- Create new Entity classes
- Add shaders for custom rendering
- Implement game logic in `update()` and `render()`
- Use the engine's input system for interactivity
- Split code into multiple files and import them in `src/index.js`

## Engine Documentation

See the [uap-game-engine repository](https://github.com/mirror12k/uap-game-engine) for complete API documentation and more examples.
