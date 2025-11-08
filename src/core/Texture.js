// ==============================
// Texture.js — DSRT Engine Core v1.1
// ==============================

import { EventDispatcher } from '../core/EventDispatcher.js';

/**
 * @fileoverview
 * Texture
 * @module DSRT/core/Texture
 * @description
 * Represents an image or data-based texture resource within the DSRT rendering pipeline.
 * Textures are fundamental components in material shading and visual appearance.
 * They can be 2D images, video frames, cube maps, or procedural data.
 *
 * Each texture maintains internal states such as filtering, wrapping, and anisotropy,
 * which are used by the GPU during rendering. The Texture class also provides
 * lifecycle control (init, bind, dispose) for efficient GPU resource management.
 *
 * @version 1.1
 * @author
 * DSRT Engine System
 */

/**
 * FLOW OVERVIEW:
 * Texture (base class)
 * ├── ImageTexture
 * ├── DataTexture
 * ├── CubeTexture
 * └── VideoTexture
 *
 * Used by:
 * └── Material → Mesh → Renderer
 */

class Texture extends EventDispatcher {

  /**
   * Constructs a new Texture instance.
   * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|null} image - The image source.
   * @param {object} [options={}] - Texture configuration parameters.
   */
  constructor( image = null, options = {} ) {
    super();

    /** @type {string} Human-readable name for debugging and identification. */
    this.name = options.name || 'Texture';

    /** @type {string} Type identifier used for serialization. */
    this.type = 'Texture';

    /** @type {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|null} */
    this.image = image;

    /** @type {number} Minification filter type (e.g., LinearMipmapLinearFilter). */
    this.minFilter = options.minFilter || Texture.LINEAR_MIPMAP_LINEAR;

    /** @type {number} Magnification filter type (e.g., LinearFilter). */
    this.magFilter = options.magFilter || Texture.LINEAR;

    /** @type {number} Horizontal wrap mode (Repeat, ClampToEdge, or MirroredRepeat). */
    this.wrapS = options.wrapS || Texture.REPEAT;

    /** @type {number} Vertical wrap mode (Repeat, ClampToEdge, or MirroredRepeat). */
    this.wrapT = options.wrapT || Texture.REPEAT;

    /** @type {number} Texture anisotropy for improving texture sharpness at oblique angles. */
    this.anisotropy = options.anisotropy || 1;

    /** @type {boolean} Indicates whether mipmaps are generated. */
    this.generateMipmaps = options.generateMipmaps !== false;

    /** @type {boolean} Marks whether texture is loaded and ready for GPU use. */
    this.loaded = false;

    /** @type {boolean} Tracks if the texture has been uploaded to GPU memory. */
    this.uploaded = false;

    /** @type {boolean} Lifecycle state indicating if the texture is disposed. */
    this.disposed = false;

    /** @type {object|null} Backend-specific GPU handle (e.g., WebGLTexture). */
    this._glTexture = null;
  }

  // ============================================================
  // LIFECYCLE METHODS
  // ============================================================

  /**
   * Initializes the texture from its image or data source.
   * Called before rendering or GPU upload.
   * @returns {Promise<void>}
   */
  async init() {
    if ( this.loaded ) return;

    if ( this.image instanceof HTMLImageElement ) {
      if ( !this.image.complete ) {
        await new Promise( ( resolve, reject ) => {
          this.image.onload = resolve;
          this.image.onerror = reject;
        } );
      }
    }

    this.loaded = true;
    this.dispatchEvent( { type: 'load', texture: this } );
  }

  /**
   * Uploads the texture to the GPU.
   * (This is typically called by the renderer.)
   * @param {WebGLRenderingContext} gl
   */
  upload( gl ) {
    if ( this.uploaded || this.disposed ) return;

    const tex = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, tex );
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image );

    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT );

    if ( this.generateMipmaps ) gl.generateMipmap( gl.TEXTURE_2D );

    gl.bindTexture( gl.TEXTURE_2D, null );

    this._glTexture = tex;
    this.uploaded = true;
  }

  /**
   * Binds this texture to the current WebGL context at a given texture unit.
   * @param {WebGLRenderingContext} gl
   * @param {number} unit - The texture unit index (e.g., 0 for TEXTURE0).
   */
  bind( gl, unit = 0 ) {
    if ( !this._glTexture ) return;
    gl.activeTexture( gl.TEXTURE0 + unit );
    gl.bindTexture( gl.TEXTURE_2D, this._glTexture );
  }

  /**
   * Unbinds this texture from the given texture unit.
   * @param {WebGLRenderingContext} gl
   * @param {number} unit
   */
  unbind( gl, unit = 0 ) {
    gl.activeTexture( gl.TEXTURE0 + unit );
    gl.bindTexture( gl.TEXTURE_2D, null );
  }

  /**
   * Disposes of the texture and releases GPU memory.
   * @param {WebGLRenderingContext} [gl]
   */
  dispose( gl ) {
    if ( this.disposed ) return;
    if ( gl && this._glTexture ) {
      gl.deleteTexture( this._glTexture );
      this._glTexture = null;
    }
    this.disposed = true;
    this.dispatchEvent( { type: 'dispose', texture: this } );
  }

  // ============================================================
  // SERIALIZATION
  // ============================================================

  /**
   * Converts this texture into a JSON-serializable format.
   * @returns {object}
   */
  toJSON() {
    return {
      type: this.type,
      name: this.name,
      wrapS: this.wrapS,
      wrapT: this.wrapT,
      minFilter: this.minFilter,
      magFilter: this.magFilter,
      anisotropy: this.anisotropy,
      generateMipmaps: this.generateMipmaps,
      loaded: this.loaded,
      disposed: this.disposed,
      metadata: {
        createdAt: (new Date()).toISOString(),
        revision: 'v1.1',
        author: 'DSRT Engine System'
      }
    };
  }
}

// ============================================================
// STATIC ENUMS AND CONSTANTS
// ============================================================

Texture.REPEAT = 0x2901;
Texture.CLAMP_TO_EDGE = 0x812F;
Texture.MIRRORED_REPEAT = 0x8370;

Texture.NEAREST = 0x2600;
Texture.LINEAR = 0x2601;
Texture.NEAREST_MIPMAP_NEAREST = 0x2700;
Texture.LINEAR_MIPMAP_NEAREST = 0x2701;
Texture.NEAREST_MIPMAP_LINEAR = 0x2702;
Texture.LINEAR_MIPMAP_LINEAR = 0x2703;

export { Texture };
