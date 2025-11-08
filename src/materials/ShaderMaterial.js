// ============================================================
// ShaderMaterial.js — Engine Core v1.2 (Enhanced Revision)
// ============================================================

import { Material } from './Material.js';
import { MaterialTexture } from './MaterialTexture.js';

/**
 * @fileoverview
 * ShaderMaterial
 * @module Engine/materials/ShaderMaterial
 *
 * @description
 * ShaderMaterial provides a programmable pipeline interface between
 * CPU-side material configuration (uniforms, defines, and textures)
 * and GPU-side shader execution (vertex & fragment stages).
 *
 * It serves as a flexible low-level layer for defining custom
 * rendering behavior via GLSL code, used for:
 *  - Post-processing effects
 *  - Particle shaders
 *  - Water, reflection, refraction, etc.
 *
 * @aspect
 * Acts as a “bridge” between engine abstractions and raw GPU logic.
 * It contains data, shader code, binding, and state controls
 * needed to execute draw calls with user-defined GPU programs.
 *
 * @flow
 * Geometry → ShaderMaterial → Renderer → GPU
 * 
 * @components
 *  - vertexShader / fragmentShader: GLSL source strings
 *  - uniforms: Data sent from CPU → GPU
 *  - textures: Bound GPU images (samplers)
 *  - compile(): Converts GLSL source into executable GPU program
 *  - bind(): Activates uniforms/textures before rendering
 *  - unbind(): Cleans up GPU state post-render
 *
 * @author
 * Engine System
 * @version 1.2
 * @since Engine Core v1.2
 */

class ShaderMaterial extends Material {

  /**
   * @constructor
   * Creates a programmable shader material.
   * 
   * @param {object} [params={}]
   * Configuration object for shader setup:
   *   - vertexShader: GLSL source for vertex stage
   *   - fragmentShader: GLSL source for fragment stage
   *   - uniforms: CPU variables passed to GPU
   *   - transparent, depthWrite, depthTest, lit, doubleSided: rendering flags
   */
  constructor(params = {}) {
    super(params);

    /** @type {string} Identifies this material type. */
    this.type = 'ShaderMaterial';

    /** @type {string} GLSL vertex shader source. */
    this.vertexShader = params.vertexShader || ShaderMaterial.DefaultVertexShader;

    /** @type {string} GLSL fragment shader source. */
    this.fragmentShader = params.fragmentShader || ShaderMaterial.DefaultFragmentShader;

    /** @type {object} Uniform variables passed from CPU to GPU. */
    this.uniforms = params.uniforms ? { ...params.uniforms } : {};

    /** @type {Object.<string, MaterialTexture>} Bound texture samplers. */
    this.textures = {};

    /** @type {WebGLProgram|null} Compiled GPU program handle. */
    this.program = null;

    /** @type {boolean} Whether this shader program was successfully compiled. */
    this.compiled = false;

    // ------------------------
    // Rendering State Flags
    // ------------------------

    /** @type {boolean} Enables alpha blending (for transparency). */
    this.transparent = params.transparent || false;

    /** @type {boolean} Controls depth writing. */
    this.depthWrite = params.depthWrite !== false;

    /** @type {boolean} Controls depth testing. */
    this.depthTest = params.depthTest !== false;

    /** @type {boolean} Determines whether lighting is applied. */
    this.lit = params.lit !== false;

    /** @type {boolean} Renders both sides of geometry if true. */
    this.doubleSided = params.doubleSided || false;
  }

  // ============================================================
  // === GPU PROGRAM COMPILATION LOGIC ===
  // ============================================================

  /**
   * Compiles vertex and fragment shaders into a GPU program.
   * 
   * @param {WebGLRenderingContext} gl
   */
  compile(gl) {
    const vs = this._compileShader(gl, gl.VERTEX_SHADER, this.vertexShader);
    const fs = this._compileShader(gl, gl.FRAGMENT_SHADER, this.fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    // Validation check
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[ShaderMaterial] Program linking failed:', gl.getProgramInfoLog(program));
      return;
    }

    this.program = program;
    this.compiled = true;
  }

  /**
   * Compiles an individual GLSL shader stage.
   * 
   * @param {WebGLRenderingContext} gl
   * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
   * @param {string} source - GLSL source code
   * @returns {WebGLShader|null}
   * @private
   */
  _compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(`[ShaderMaterial] Shader compilation failed: ${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  // ============================================================
  // === UNIFORM & TEXTURE MANAGEMENT ===
  // ============================================================

  /**
   * Assigns a texture to a sampler channel.
   * @param {string} channel
   * @param {MaterialTexture} texture
   */
  setTexture(channel, texture) {
    if (!(texture instanceof MaterialTexture)) {
      console.warn(`[ShaderMaterial] Invalid texture for channel '${channel}'.`);
      return;
    }
    this.textures[channel] = texture;
  }

  /**
   * Updates or adds a uniform variable.
   * @param {string} name
   * @param {*} value
   */
  setUniform(name, value) {
    this.uniforms[name] = value;
  }

  /**
   * Binds the shader program, uniforms, and textures for rendering.
   * @param {WebGLRenderingContext} gl
   */
  bind(gl) {
    if (!this.compiled) this.compile(gl);
    gl.useProgram(this.program);

    // Upload uniform data
    for (const [name, value] of Object.entries(this.uniforms)) {
      const loc = gl.getUniformLocation(this.program, name);
      if (loc === null) continue;

      if (typeof value === 'number') gl.uniform1f(loc, value);
      else if (Array.isArray(value)) {
        switch (value.length) {
          case 2: gl.uniform2fv(loc, value); break;
          case 3: gl.uniform3fv(loc, value); break;
          case 4: gl.uniform4fv(loc, value); break;
        }
      }
    }

    // Bind texture units
    let unit = 0;
    for (const [channel, tex] of Object.entries(this.textures)) {
      tex.activate(gl, unit);
      const loc = gl.getUniformLocation(this.program, channel);
      if (loc) gl.uniform1i(loc, unit);
      unit++;
    }
  }

  /**
   * Unbinds shader program and texture states after rendering.
   * @param {WebGLRenderingContext} gl
   */
  unbind(gl) {
    for (const tex of Object.values(this.textures)) tex.deactivate(gl);
    gl.useProgram(null);
  }

  // ============================================================
  // === SERIALIZATION & CLEANUP ===
  // ============================================================

  /**
   * Serializes ShaderMaterial for saving or export.
   * @returns {object}
   */
  toJSON() {
    const base = super.toJSON();
    return Object.assign(base, {
      type: 'ShaderMaterial',
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      uniforms: this.uniforms,
      textures: Object.keys(this.textures),
      flags: {
        transparent: this.transparent,
        depthWrite: this.depthWrite,
        depthTest: this.depthTest,
        lit: this.lit,
        doubleSided: this.doubleSided,
        compiled: this.compiled
      },
      metadata: {
        ...base.metadata,
        class: 'ShaderMaterial'
      }
    });
  }

  /**
   * Releases GPU resources associated with this material.
   * @param {WebGLRenderingContext} [gl]
   */
  dispose(gl) {
    super.dispose();
    if (gl && this.program) gl.deleteProgram(this.program);
    for (const tex of Object.values(this.textures)) tex.dispose(gl);
    this.program = null;
    this.textures = {};
    this.compiled = false;
  }

  // ============================================================
  // === DEFAULT FALLBACK SHADERS ===
  // ============================================================

  static DefaultVertexShader = `
    attribute vec3 position;
    attribute vec2 uv;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  static DefaultFragmentShader = `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D albedo;
    void main() {
      vec4 color = texture2D(albedo, vUv);
      gl_FragColor = color;
    }
  `;
}

export { ShaderMaterial };
