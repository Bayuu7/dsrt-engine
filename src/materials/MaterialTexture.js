// ============================================================
// MaterialTexture.js — Engine Core v1.2 (Enhanced Revision)
// ============================================================

import { Texture } from './Texture.js';

/**
 * @fileoverview
 * MaterialTexture
 * @module Engine/core/MaterialTexture
 *
 * @description
 * MaterialTexture extends the base Texture class by adding
 * semantic meaning and rendering context for material-specific usage.
 *
 * Each MaterialTexture represents a “slot texture” inside a material —
 * such as **albedo**, **normal map**, **metalness**, **roughness**, or **emission**.
 * It also handles metadata such as color space, lighting response,
 * and shader sampling behavior.
 *
 * @aspect
 * Acts as a bridge between **Texture management** and **Material logic**.
 * It carries contextual information so that the renderer knows *how*
 * to interpret the texture (color, lighting, gamma, etc.).
 *
 * @flow
 * Image → Texture → MaterialTexture → Material → Renderer → GPU
 *
 * @components
 *  - image (HTMLImage / Canvas / Video)
 *  - channel (material role: albedo, normal, etc.)
 *  - colorSpace (linear / sRGB)
 *  - lit, applyGamma, active, unitIndex
 *  - activate(), deactivate(), dispose(), toJSON()
 *
 * @usage
 * ```js
 * const tex = new MaterialTexture(image, { channel: 'albedo', colorSpace: 'sRGB' });
 * material.setTexture('albedo', tex);
 * ```
 *
 * @version 1.2
 * @since Engine Core v1.2
 * @author
 * Engine System
 */

class MaterialTexture extends Texture {

  /**
   * Constructs a MaterialTexture instance.
   *
   * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|null} image
   *   The image or visual source to create GPU texture from.
   *
   * @param {object} [options={}]
   *   Configuration object defining the texture’s semantic meaning.
   *   - channel: "albedo" | "normal" | "metallic" | "roughness" | "emission"
   *   - colorSpace: "linear" | "sRGB"
   *   - isNormalMap: boolean (if normal map should use tangent-space decode)
   *   - lit: boolean (whether texture participates in lighting)
   *   - applyGamma: boolean (gamma correction toggle)
   */
  constructor(image = null, options = {}) {
    super(image, options);

    /** @type {string} Identifies this subclass. */
    this.type = 'MaterialTexture';

    // ============================================================
    // SEMANTIC PROPERTIES
    // ============================================================

    /** @type {string} Defines what this texture represents in a material. */
    this.channel = options.channel || 'albedo';

    /** @type {string} Defines how the texture colors are interpreted. */
    this.colorSpace = options.colorSpace || 'sRGB';

    /** @type {boolean} True if this is a normal map (affects shader decoding). */
    this.isNormalMap = options.isNormalMap || false;

    /** @type {boolean} Determines if lighting affects this texture. */
    this.lit = options.lit !== false;

    /** @type {boolean} Enables or disables gamma correction during sampling. */
    this.applyGamma = options.applyGamma !== false;

    // ============================================================
    // RUNTIME STATE FLAGS
    // ============================================================

    /** @type {boolean} Indicates whether the texture is currently active/bound. */
    this.active = false;

    /** @type {number} WebGL texture unit index (-1 if inactive). */
    this.unitIndex = -1;
  }

  // ============================================================
  // === GPU LIFECYCLE METHODS ===
  // ============================================================

  /**
   * Activates the texture for the current render pass.
   *
   * @param {WebGLRenderingContext} gl
   * @param {number} unit - The texture slot index to bind to.
   *
   * @example
   * tex.activate(gl, 0); // binds to TEXTURE0
   */
  activate(gl, unit = 0) {
    if (this.disposed || !this._glTexture) return; // safety guard
    this.bind(gl, unit);
    this.active = true;
    this.unitIndex = unit;
  }

  /**
   * Deactivates this texture from the current render context.
   *
   * @param {WebGLRenderingContext} gl
   */
  deactivate(gl) {
    if (!this.active) return;
    this.unbind(gl, this.unitIndex);
    this.active = false;
    this.unitIndex = -1;
  }

  /**
   * Releases GPU resources and clears its channel association.
   *
   * @param {WebGLRenderingContext} [gl]
   */
  dispose(gl) {
    super.dispose(gl);
    this.channel = null;
    this.active = false;
    this.unitIndex = -1;
  }

  // ============================================================
  // === SERIALIZATION & DATA EXPORT ===
  // ============================================================

  /**
   * Converts the texture and its metadata into JSON format for saving or debugging.
   *
   * @returns {object}
   */
  toJSON() {
    const base = super.toJSON();
    return Object.assign(base, {
      type: 'MaterialTexture',
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
    });
  }
}

export { MaterialTexture };
