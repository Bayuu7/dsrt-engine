// ==============================
// MaterialTexture.js — DSRT Engine Core v1.1
// ==============================

import { Texture } from './Texture.js';

/**
 * @fileoverview
 * MaterialTexture
 * @module DSRT/core/MaterialTexture
 * @description
 * Extends the base Texture class with material-specific context.
 * MaterialTexture represents a texture that is bound to a material slot
 * such as base color (albedo), normal map, roughness, metallic, emission, etc.
 *
 * Each material texture maintains additional semantic metadata, color space handling,
 * and binding channel for renderer optimization.
 *
 * @version 1.1
 * @since DSRT Engine 1.1
 * @author
 * DSRT Engine System
 */

/**
 * FLOW OVERVIEW:
 * Material
 * ├── MaterialTexture (Albedo / Normal / Roughness / Emission)
 * └── ShaderMaterial (custom GLSL)
 *
 * Usage Example:
 * ```js
 * const tex = new MaterialTexture(image, { channel: 'albedo', colorSpace: 'sRGB' });
 * material.setTexture('albedo', tex);
 * ```
 */

class MaterialTexture extends Texture {

  /**
   * Constructs a MaterialTexture instance.
   * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|null} image - Image or data source.
   * @param {object} [options={}] - Configuration parameters for material usage.
   */
  constructor( image = null, options = {} ) {
    super( image, options );

    /** @type {string} Type identifier for serialization. */
    this.type = 'MaterialTexture';

    /** @type {string} Channel role this texture serves in a material (e.g., "albedo", "normal"). */
    this.channel = options.channel || 'albedo';

    /** @type {string} Color space of the texture: "linear" or "sRGB". */
    this.colorSpace = options.colorSpace || 'sRGB';

    /** @type {boolean} If true, the texture represents a normal map (affects shader sampling). */
    this.isNormalMap = options.isNormalMap || false;

    /** @type {boolean} Whether the texture is used in lighting computations (e.g., baseColor). */
    this.lit = options.lit !== false;

    /** @type {boolean} Whether to apply gamma correction during sampling. */
    this.applyGamma = options.applyGamma !== false;

    /** @type {boolean} Marks whether this texture is currently active in a render pass. */
    this.active = false;

    /** @type {number} Renderer texture slot/channel index. */
    this.unitIndex = -1;
  }

  // ============================================================
  // LIFECYCLE METHODS
  // ============================================================

  /**
   * Activates the texture for use in the current render pass.
   * @param {WebGLRenderingContext} gl
   * @param {number} unit - The texture unit index to bind to.
   */
  activate( gl, unit = 0 ) {
    if ( this.disposed || !this._glTexture ) return;
    this.bind( gl, unit );
    this.active = true;
    this.unitIndex = unit;
  }

  /**
   * Deactivates the texture from the render pass.
   * @param {WebGLRenderingContext} gl
   */
  deactivate( gl ) {
    if ( !this.active ) return;
    this.unbind( gl, this.unitIndex );
    this.active = false;
    this.unitIndex = -1;
  }

  /**
   * Disposes of the texture and clears channel reference.
   * @param {WebGLRenderingContext} [gl]
   */
  dispose( gl ) {
    super.dispose( gl );
    this.channel = null;
    this.active = false;
  }

  // ============================================================
  // SERIALIZATION
  // ============================================================

  /**
   * Converts this material texture into a JSON-compatible format.
   * @returns {object}
   */
  toJSON() {
    const base = super.toJSON();
    return Object.assign( base, {
      channel: this.channel,
      colorSpace: this.colorSpace,
      isNormalMap: this.isNormalMap,
      lit: this.lit,
      applyGamma: this.applyGamma,
      active: this.active,
      unitIndex: this.unitIndex,
      metadata: {
        ...base.metadata,
        class: 'MaterialTexture'
      }
    } );
  }
}

export { MaterialTexture };
