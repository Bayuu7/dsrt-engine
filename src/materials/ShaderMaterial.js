// ==============================
// ShaderMaterial.js — DSRT Engine Core v1.1
// ==============================

import { Material } from './Material.js';
import { MaterialTexture } from './MaterialTexture.js';

/**
 * @fileoverview
 * ShaderMaterial
 * @module DSRT/materials/ShaderMaterial
 * @description
 * A programmable material that allows full control over vertex and fragment shaders.
 * 
 * ShaderMaterial acts as the bridge between CPU-side material parameters
 * (uniforms, defines, textures) and GPU-side shader programs.
 * 
 * It extends the base Material class with GLSL program compilation, uniform management,
 * and runtime binding of textures and lighting data.
 *
 * @version 1.1
 * @since DSRT Engine 1.1
 * @author
 * DSRT Engine System
 */

/**
 * FLOW OVERVIEW:
 * Geometry → ShaderMaterial → Renderer → GPU
 *
 * Runtime sequence:
 * 1. Geometry provides vertex attributes.
 * 2. ShaderMaterial compiles shaders & binds uniforms/textures.
 * 3. Renderer activates GPU pipeline and executes draw call.
 */

class ShaderMaterial extends Material {

  /**
   * Constructs a ShaderMaterial instance.
   * @param {object} [params={}] - Configuration options for shader and uniforms.
   */
  constructor( params = {} ) {
    super( params );

    /** @type {string} */
    this.type = 'ShaderMaterial';

    /** @type {string} GLSL vertex shader source. */
    this.vertexShader = params.vertexShader || ShaderMaterial.DefaultVertexShader;

    /** @type {string} GLSL fragment shader source. */
    this.fragmentShader = params.fragmentShader || ShaderMaterial.DefaultFragmentShader;

    /** @type {object} Uniform variables passed to shader. */
    this.uniforms = params.uniforms ? { ...params.uniforms } : {};

    /** @type {object<string, MaterialTexture>} Dictionary of textures bound to this material. */
    this.textures = {};

    /** @type {WebGLProgram|null} Compiled GPU program. */
    this.program = null;

    /** @type {boolean} Marks if shader program has been compiled successfully. */
    this.compiled = false;

    /** @type {boolean} If true, enables blending (for transparency, particles, etc). */
    this.transparent = params.transparent || false;

    /** @type {boolean} If true, depth writing is disabled. */
    this.depthWrite = params.depthWrite !== false;

    /** @type {boolean} If true, depth testing is active. */
    this.depthTest = params.depthTest !== false;

    /** @type {boolean} If true, material responds to lighting. */
    this.lit = params.lit !== false;

    /** @type {boolean} If true, material is double-sided. */
    this.doubleSided = params.doubleSided || false;
  }

  // ============================================================
  // SHADER COMPILATION & BINDING
  // ============================================================

  /**
   * Compiles shader program from vertex and fragment sources.
   * @param {WebGLRenderingContext} gl
   */
  compile( gl ) {
    const vs = this._compileShader( gl, gl.VERTEX_SHADER, this.vertexShader );
    const fs = this._compileShader( gl, gl.FRAGMENT_SHADER, this.fragmentShader );

    const program = gl.createProgram();
    gl.attachShader( program, vs );
    gl.attachShader( program, fs );
    gl.linkProgram( program );

    if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
      console.error( '[ShaderMaterial] Program linking failed:', gl.getProgramInfoLog( program ) );
      return;
    }

    this.program = program;
    this.compiled = true;
  }

  /**
   * Internal helper to compile a shader.
   * @param {WebGLRenderingContext} gl
   * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
   * @param {string} source - GLSL source code
   * @returns {WebGLShader}
   * @private
   */
  _compileShader( gl, type, source ) {
    const shader = gl.createShader( type );
    gl.shaderSource( shader, source );
    gl.compileShader( shader );

    if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
      console.error( `[ShaderMaterial] Shader compilation failed: ${gl.getShaderInfoLog( shader )}` );
      gl.deleteShader( shader );
      return null;
    }

    return shader;
  }

  // ============================================================
  // TEXTURE & UNIFORM MANAGEMENT
  // ============================================================

  /**
   * Assigns a texture to a specific channel.
   * @param {string} channel
   * @param {MaterialTexture} texture
   */
  setTexture( channel, texture ) {
    if ( !(texture instanceof MaterialTexture) ) {
      console.warn( `[ShaderMaterial] Invalid texture for channel '${channel}'.` );
      return;
    }
    this.textures[channel] = texture;
  }

  /**
   * Sets or updates a uniform variable.
   * @param {string} name
   * @param {*} value
   */
  setUniform( name, value ) {
    this.uniforms[name] = value;
  }

  /**
   * Binds this material’s program, uniforms, and textures.
   * @param {WebGLRenderingContext} gl
   */
  bind( gl ) {
    if ( !this.compiled ) this.compile( gl );
    gl.useProgram( this.program );

    // Upload all uniforms
    for ( const [name, value] of Object.entries( this.uniforms ) ) {
      const loc = gl.getUniformLocation( this.program, name );
      if ( loc === null ) continue;
      if ( typeof value === 'number' ) gl.uniform1f( loc, value );
      else if ( Array.isArray( value ) ) {
        switch ( value.length ) {
          case 2: gl.uniform2fv( loc, value ); break;
          case 3: gl.uniform3fv( loc, value ); break;
          case 4: gl.uniform4fv( loc, value ); break;
        }
      }
    }

    // Bind textures
    let unit = 0;
    for ( const [channel, tex] of Object.entries( this.textures ) ) {
      tex.activate( gl, unit );
      const loc = gl.getUniformLocation( this.program, channel );
      if ( loc ) gl.uniform1i( loc, unit );
      unit++;
    }
  }

  /**
   * Unbinds the shader and its textures.
   * @param {WebGLRenderingContext} gl
   */
  unbind( gl ) {
    for ( const tex of Object.values( this.textures ) ) tex.deactivate( gl );
    gl.useProgram( null );
  }

  // ============================================================
  // SERIALIZATION
  // ============================================================

  /**
   * Serializes this ShaderMaterial into JSON.
   * @returns {object}
   */
  toJSON() {
    const base = super.toJSON();
    return Object.assign( base, {
      type: 'ShaderMaterial',
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      uniforms: this.uniforms,
      textures: Object.keys( this.textures ),
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
    } );
  }

  /**
   * Disposes GPU program and texture bindings.
   * @param {WebGLRenderingContext} [gl]
   */
  dispose( gl ) {
    super.dispose();
    if ( gl && this.program ) gl.deleteProgram( this.program );
    for ( const tex of Object.values( this.textures ) ) tex.dispose( gl );
    this.program = null;
    this.textures = {};
    this.compiled = false;
  }

  // ============================================================
  // DEFAULT SHADERS (Fallback)
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
