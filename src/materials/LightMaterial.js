// ===========================================================
// LightMaterial.js — Core Material System v1.1
// ===========================================================

import { Material } from './Material.js';
import { Color } from '../math/Color.js';

/**
 * @fileoverview
 * LightMaterial
 * @module core/materials/LightMaterial
 * @description
 * Specialized subclass of `Material` used for emissive or self-illuminated
 * surfaces — typically light sources, glowing panels, or emissive objects.
 *
 * This material does not receive lighting but *emits* light in the scene.
 * It can be used either as:
 * - a visual emissive surface (e.g., neon sign, bulb)
 * - a procedural light emitter in deferred or PBR pipelines.
 *
 * @version 1.1
 * @since Core Engine 1.1
 * @author
 * Core Engine System
 */

/**
 * FLOW OVERVIEW:
 * Material (Base)
 * ├── StandardMaterial
 * ├── PhysicalMaterial
 * ├── LightMaterial  ← (you are here)
 * └── ShaderMaterial (custom GLSL)
 *
 * LightMaterial integrates with renderer emission passes or can be sampled
 * directly in shader programs. When attached to a mesh, it visually glows
 * without reacting to scene lighting.
 */

class LightMaterial extends Material {
  /**
   * Creates a new LightMaterial.
   * @param {object} [parameters={}] - Material properties and emission attributes.
   */
  constructor(parameters = {}) {
    super(parameters);

    /** @type {string} Type identifier for serialization. */
    this.type = 'LightMaterial';

    /** @type {Color} Emissive color of the material (default: pure white). */
    this.emissive = parameters.emissive instanceof Color
      ? parameters.emissive
      : new Color(parameters.emissive || 0xffffff);

    /** @type {number} Intensity of light emission (0 = off, 1 = standard, >1 = glow). */
    this.intensity = parameters.intensity !== undefined ? parameters.intensity : 1.0;

    /** @type {boolean} If true, material contributes to global illumination. */
    this.castLight = parameters.castLight || false;

    /** @type {boolean} Whether this material should be visible as emissive geometry. */
    this.visible = parameters.visible !== false;

    /** @type {boolean} Whether the emission color is HDR (for tone mapping). */
    this.hdr = parameters.hdr || false;

    /** @type {boolean} Whether this light is static (baked) or dynamic. */
    this.dynamic = parameters.dynamic !== false;
  }

  // ============================================================
  // COLOR CONTROL
  // ============================================================

  /**
   * Sets the emissive color and optional intensity in one call.
   * @param {number|Color} color - RGB color or hex value.
   * @param {number} [intensity=this.intensity] - New emission strength.
   */
  setEmission(color, intensity = this.intensity) {
    if (typeof color === 'number') {
      this.emissive.setHex(color);
    } else if (color instanceof Color) {
      this.emissive.copy(color);
    }
    this.intensity = intensity;
  }

  /**
   * Returns the effective emission color, factoring in intensity.
   * @returns {Color}
   */
  getEffectiveEmission() {
    return this.emissive.clone().multiplyScalar(this.intensity);
  }

  // ============================================================
  // UPDATE METHODS
  // ============================================================

  /**
   * Updates the material’s uniform data for rendering.
   * @param {WebGLRenderingContext} gl
   * @param {WebGLProgram} program
   */
  updateUniforms(gl, program) {
    const locEmission = gl.getUniformLocation(program, 'u_EmissionColor');
    if (locEmission) {
      const color = this.getEffectiveEmission();
      gl.uniform3f(locEmission, color.r, color.g, color.b);
    }
  }

  // ============================================================
  // SERIALIZATION
  // ============================================================

  /**
   * Converts this light material into a JSON-compatible structure.
   * @returns {object}
   */
  toJSON() {
    const base = super.toJSON();
    return Object.assign(base, {
      type: this.type,
      emissive: this.emissive.toHex(),
      intensity: this.intensity,
      castLight: this.castLight,
      visible: this.visible,
      hdr: this.hdr,
      dynamic: this.dynamic,
      metadata: {
        ...base.metadata,
        class: 'LightMaterial'
      }
    });
  }
}

export { LightMaterial };
