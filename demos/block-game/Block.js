import { Entity, Shader, mat4 } from '../../src/index.js';

export class BlockRenderer extends Entity {
  constructor(texture, blocks) {
    super();
    this.texturePath = texture;
    this.blocks = blocks;
    this.model = mat4.create();
  }

  init(game) {
    super.init(game);
    const gl = game.gl;

    this.shader = new Shader(gl, `
      attribute vec3 position;
      attribute vec2 texCoord;
      attribute vec3 color;

      uniform mat4 model;
      uniform mat4 view;
      uniform mat4 projection;

      varying vec2 vTexCoord;
      varying vec3 vColor;

      void main() {
        vTexCoord = texCoord;
        vColor = color;
        gl_Position = projection * view * model * vec4(position, 1.0);
      }
    `, `
      precision mediump float;

      uniform sampler2D uTexture;

      varying vec2 vTexCoord;
      varying vec3 vColor;

      void main() {
        vec4 texColor = texture2D(uTexture, vTexCoord);
        gl_FragColor = vec4(texColor.rgb * vColor, texColor.a);
      }
    `);

    // Load texture from embedded assets
    this.texture = gl.createTexture();
    const image = new Image();
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };

    // Use embedded asset if available, otherwise fall back to file path
    if (typeof window !== 'undefined' && window.GAME_ASSETS && window.GAME_ASSETS[this.texturePath]) {
      image.src = window.GAME_ASSETS[this.texturePath];
    } else {
      image.src = this.texturePath;
    }

    // Build mesh from all blocks
    this.buildMesh(gl);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // Allow equal depth values to pass
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  buildMesh(gl) {
    const vertices = [];
    const indices = [];
    let vertexOffset = 0;

    for (const block of this.blocks) {
      const { position, topTile, sideTile, bottomTile, tint } = block;
      const [x, y, z] = position;
      const color = tint || [1, 1, 1];

      // Check if this is a grass block (needs two-layer sides)
      const isGrassBlock = bottomTile && sideTile &&
        (bottomTile[0] !== sideTile[0] || bottomTile[1] !== sideTile[1]) &&
        tint && (tint[0] !== 1 || tint[1] !== 1 || tint[2] !== 1);

      // Calculate UV coordinates for each tile
      const topUV = this.getTileUV(topTile);
      const sideUV = this.getTileUV(sideTile);
      const bottomUV = this.getTileUV(bottomTile || sideTile);
      const dirtUV = isGrassBlock ? this.getTileUV(bottomTile) : null;

      // Top face (y+)
      vertices.push(
        x - 0.5, y + 0.5, z - 0.5, topUV[0], topUV[3], ...color,
        x + 0.5, y + 0.5, z - 0.5, topUV[2], topUV[3], ...color,
        x + 0.5, y + 0.5, z + 0.5, topUV[2], topUV[1], ...color,
        x - 0.5, y + 0.5, z + 0.5, topUV[0], topUV[1], ...color
      );
      indices.push(
        vertexOffset + 2, vertexOffset + 1, vertexOffset + 0,
        vertexOffset + 3, vertexOffset + 2, vertexOffset + 0
      );
      vertexOffset += 4;

      // Bottom face (y-)
      const bottomColor = isGrassBlock ? [1, 1, 1] : color;
      vertices.push(
        x - 0.5, y - 0.5, z + 0.5, bottomUV[0], bottomUV[1], ...bottomColor,
        x + 0.5, y - 0.5, z + 0.5, bottomUV[2], bottomUV[1], ...bottomColor,
        x + 0.5, y - 0.5, z - 0.5, bottomUV[2], bottomUV[3], ...bottomColor,
        x - 0.5, y - 0.5, z - 0.5, bottomUV[0], bottomUV[3], ...bottomColor
      );
      indices.push(
        vertexOffset + 2, vertexOffset + 1, vertexOffset + 0,
        vertexOffset + 3, vertexOffset + 2, vertexOffset + 0
      );
      vertexOffset += 4;

      // Front face (z+)
      // First layer: dirt for grass blocks
      if (isGrassBlock) {
        vertices.push(
          x - 0.5, y - 0.5, z + 0.5, dirtUV[0], dirtUV[3], 1, 1, 1,
          x + 0.5, y - 0.5, z + 0.5, dirtUV[2], dirtUV[3], 1, 1, 1,
          x + 0.5, y + 0.5, z + 0.5, dirtUV[2], dirtUV[1], 1, 1, 1,
          x - 0.5, y + 0.5, z + 0.5, dirtUV[0], dirtUV[1], 1, 1, 1
        );
        indices.push(
          vertexOffset + 0, vertexOffset + 1, vertexOffset + 2,
          vertexOffset + 0, vertexOffset + 2, vertexOffset + 3
        );
        vertexOffset += 4;
      }
      // Second layer: grass overlay or regular texture (offset slightly forward)
      const offset = isGrassBlock ? 0.001 : 0;
      vertices.push(
        x - 0.5, y - 0.5, z + 0.5 + offset, sideUV[0], sideUV[3], ...color,
        x + 0.5, y - 0.5, z + 0.5 + offset, sideUV[2], sideUV[3], ...color,
        x + 0.5, y + 0.5, z + 0.5 + offset, sideUV[2], sideUV[1], ...color,
        x - 0.5, y + 0.5, z + 0.5 + offset, sideUV[0], sideUV[1], ...color
      );
      indices.push(
        vertexOffset + 0, vertexOffset + 1, vertexOffset + 2,
        vertexOffset + 0, vertexOffset + 2, vertexOffset + 3
      );
      vertexOffset += 4;

      // Back face (z-)
      // First layer: dirt for grass blocks
      if (isGrassBlock) {
        vertices.push(
          x + 0.5, y - 0.5, z - 0.5, dirtUV[0], dirtUV[3], 1, 1, 1,
          x - 0.5, y - 0.5, z - 0.5, dirtUV[2], dirtUV[3], 1, 1, 1,
          x - 0.5, y + 0.5, z - 0.5, dirtUV[2], dirtUV[1], 1, 1, 1,
          x + 0.5, y + 0.5, z - 0.5, dirtUV[0], dirtUV[1], 1, 1, 1
        );
        indices.push(
          vertexOffset + 0, vertexOffset + 1, vertexOffset + 2,
          vertexOffset + 0, vertexOffset + 2, vertexOffset + 3
        );
        vertexOffset += 4;
      }
      // Second layer: grass overlay or regular texture (offset slightly backward)
      vertices.push(
        x + 0.5, y - 0.5, z - 0.5 - offset, sideUV[0], sideUV[3], ...color,
        x - 0.5, y - 0.5, z - 0.5 - offset, sideUV[2], sideUV[3], ...color,
        x - 0.5, y + 0.5, z - 0.5 - offset, sideUV[2], sideUV[1], ...color,
        x + 0.5, y + 0.5, z - 0.5 - offset, sideUV[0], sideUV[1], ...color
      );
      indices.push(
        vertexOffset + 0, vertexOffset + 1, vertexOffset + 2,
        vertexOffset + 0, vertexOffset + 2, vertexOffset + 3
      );
      vertexOffset += 4;

      // Right face (x+)
      // First layer: dirt for grass blocks
      if (isGrassBlock) {
        vertices.push(
          x + 0.5, y - 0.5, z + 0.5, dirtUV[0], dirtUV[3], 1, 1, 1,
          x + 0.5, y - 0.5, z - 0.5, dirtUV[2], dirtUV[3], 1, 1, 1,
          x + 0.5, y + 0.5, z - 0.5, dirtUV[2], dirtUV[1], 1, 1, 1,
          x + 0.5, y + 0.5, z + 0.5, dirtUV[0], dirtUV[1], 1, 1, 1
        );
        indices.push(
          vertexOffset + 0, vertexOffset + 1, vertexOffset + 2,
          vertexOffset + 0, vertexOffset + 2, vertexOffset + 3
        );
        vertexOffset += 4;
      }
      // Second layer: grass overlay or regular texture (offset slightly right)
      vertices.push(
        x + 0.5 + offset, y - 0.5, z + 0.5, sideUV[0], sideUV[3], ...color,
        x + 0.5 + offset, y - 0.5, z - 0.5, sideUV[2], sideUV[3], ...color,
        x + 0.5 + offset, y + 0.5, z - 0.5, sideUV[2], sideUV[1], ...color,
        x + 0.5 + offset, y + 0.5, z + 0.5, sideUV[0], sideUV[1], ...color
      );
      indices.push(
        vertexOffset + 0, vertexOffset + 1, vertexOffset + 2,
        vertexOffset + 0, vertexOffset + 2, vertexOffset + 3
      );
      vertexOffset += 4;

      // Left face (x-)
      // First layer: dirt for grass blocks
      if (isGrassBlock) {
        vertices.push(
          x - 0.5, y - 0.5, z - 0.5, dirtUV[0], dirtUV[3], 1, 1, 1,
          x - 0.5, y - 0.5, z + 0.5, dirtUV[2], dirtUV[3], 1, 1, 1,
          x - 0.5, y + 0.5, z + 0.5, dirtUV[2], dirtUV[1], 1, 1, 1,
          x - 0.5, y + 0.5, z - 0.5, dirtUV[0], dirtUV[1], 1, 1, 1
        );
        indices.push(
          vertexOffset + 0, vertexOffset + 1, vertexOffset + 2,
          vertexOffset + 0, vertexOffset + 2, vertexOffset + 3
        );
        vertexOffset += 4;
      }
      // Second layer: grass overlay or regular texture (offset slightly left)
      vertices.push(
        x - 0.5 - offset, y - 0.5, z - 0.5, sideUV[0], sideUV[3], ...color,
        x - 0.5 - offset, y - 0.5, z + 0.5, sideUV[2], sideUV[3], ...color,
        x - 0.5 - offset, y + 0.5, z + 0.5, sideUV[2], sideUV[1], ...color,
        x - 0.5 - offset, y + 0.5, z - 0.5, sideUV[0], sideUV[1], ...color
      );
      indices.push(
        vertexOffset + 0, vertexOffset + 1, vertexOffset + 2,
        vertexOffset + 0, vertexOffset + 2, vertexOffset + 3
      );
      vertexOffset += 4;
    }

    this.vertexCount = indices.length;

    // Create buffers
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  }

  getTileUV(tile) {
    // Assuming 16x16 tiles in the texture
    const tileSize = 1 / 16;
    const [tileX, tileY] = tile;

    const u1 = tileX * tileSize;
    const v1 = tileY * tileSize;
    const u2 = (tileX + 1) * tileSize;
    const v2 = (tileY + 1) * tileSize;

    return [u1, v1, u2, v2];
  }

  render(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.shader.use();

    mat4.identity(this.model);

    this.shader.setUniformMatrix('model', this.model);
    this.shader.setUniformMatrix('view', this.game.camera.getViewMatrix());
    this.shader.setUniformMatrix('projection', this.game.camera.getProjectionMatrix());

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.shader.getUniform('uTexture'), 0);

    // Bind vertex data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    const stride = 8 * 4; // 8 floats per vertex (3 pos + 2 uv + 3 color)

    const posAttr = this.shader.getAttribute('position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, stride, 0);

    const texCoordAttr = this.shader.getAttribute('texCoord');
    gl.enableVertexAttribArray(texCoordAttr);
    gl.vertexAttribPointer(texCoordAttr, 2, gl.FLOAT, false, stride, 12);

    const colorAttr = this.shader.getAttribute('color');
    gl.enableVertexAttribArray(colorAttr);
    gl.vertexAttribPointer(colorAttr, 3, gl.FLOAT, false, stride, 20);

    // Draw
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);
  }
}
