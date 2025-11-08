// ===========================================================
// StandardMaterial.js — DSRT Engine Core v1.1
// ===========================================================

import { MeshMaterial } from './MeshMaterial.js';
import { Color } from '../math/Color.js';
import { MaterialTexture } from './MaterialTexture.js';

/**
 * @fileoverview
 * StandardMaterial
 * @module DSRT/materials/StandardMaterial
 * @description
 * The `StandardMaterial` is a classic physically-inspired but non-PBR surface material.
 * It supports diffuse, specular, emissive lighting, and optional normal mapping.
 *
 * This class bridges performance and realism, offering a fast, stable material
 * suitable for real-time rendering and mobile applications.
 *
 * @version 1.1
 * @since DSRT Engine 1.1
 * @extends MeshMaterial
 * @author
 * DSRT Engine System
 */

/**
 * FLOW OVERVIEW:
 * Geometry → Mesh → StandardMaterial → Renderer → GPU Shader
 *
 * Supported Features:
 * - Diffuse color + texture
 * - Specular highlights (Phong)
 * - Normal mapping
 * - Emission (self-illumination)
 * - Transparency + blending
 */

class StandardMaterial extends MeshMaterial {

  /**
   * Constructs a StandardMaterial.
   * @param {object} [parameters={}] - Defines color, texture, and lighting settings.
   */
  constructor(parameters = {}) {
    super(parameters);

    /** @type {string} */
    this.type = 'StandardMaterial';

    // ============================================================
    // COLOR AND LIGHTING CHANNELS
    // ============================================================

    /** @type {Color} Diffuse color (base surface reflectance). */
    this.diffuse = parameters.diffuse instanceof Color
      ? parameters.diffuse
      : new Color(parameters.diffuse || 0xffffff);

    /** @type {Color} Specular color — determines highlight tint. */
    this.specular = parameters.specular instanceof Color
      ? parameters.specular
      : new Color(parameters.specular || 0x111111);

    /** @type {number} Shininess factor for Phong reflection. */
    this.shininess = parameters.shininess !== undefined ? parameters.shininess : 32.0;

    /** @type {Color} Emission color for self-lit materials. */
    this.emissive = parameters.emissive instanceof Color
      ? parameters.emissive
      : new Color(parameters.emissive || 0x000000);

    /** @type {number} Emission intensity multiplier. */
    this.emissionIntensity = parameters.emissionIntensity !== undefined ? parameters.emissionIntensity : 1.0;

    // ============================================================
    // TEXTURE MAPS
    // ============================================================

    /** @type {MaterialTexture|null} Diffuse/albedo map. */
    this.map = parameters.map instanceof MaterialTexture ? parameters.map : null;

    /** @type {MaterialTexture|null} Specular map. */
    this.specularMap = parameters.specularMap instanceof MaterialTexture ? parameters.specularMap : null;

    /** @type {MaterialTexture|null} Normal map. */
    this.normalMap = parameters.normalMap instanceof MaterialTexture ? parameters.normalMap : null;

    /** @type {MaterialTexture|null} Emission map. */
    this.emissionMap = parameters.emissionMap instanceof MaterialTexture ? parameters.emissionMap : null;

    // ============================================================
    // ADVANCED OPTIONS
    // ============================================================

    /** @type {boolean} Enable per-pixel lighting (Phong). */
    this.phong = parameters.phong !== false;

    /** @type {boolean} If true, material uses vertex colors when available. */
    this.vertexColors = parameters.vertexColors || false;

    /** @type {number} Ambient occlusion multiplier. */
    this.aoIntensity = parameters.aoIntensity !== undefined ? parameters.aoIntensity : 1.0;

    /** @type {MaterialTexture|null} Ambient occlusion map. */
    this.aoMap = parameters.aoMap instanceof MaterialTexture ? parameters.aoMap : null;
  }

  // ============================================================
  // METHODS
  // ============================================================

  /**
   * Prepares material uniforms for shader binding.
   * @returns {object} - A map of GLSL uniform values.
   */
  getUniforms() {
    return {
      uDiffuseColor: this.diffuse.toArray(),
      uSpecularColor: this.specular.toArray(),
      uShininess: this.shininess,
      uEmissiveColor: this.emissive.toArray(),
      uEmissionIntensity: this.emissionIntensity,
      uOpacity: this.opacity,
      uReflectivity: this.reflectivity,
      uAOIntensity: this.aoIntensity
    };
  }

  /**
   * Checks if the material is emissive (self-illuminated).
   * @returns {boolean}
   */
  isEmissive() {
    return this.emissionIntensity > 0 && (
      this.emissive.r > 0 || this.emissive.g > 0 || this.emissive.b > 0
    );
  }

  /**
   * Checks if any lighting-related texture maps exist.
   * @returns {boolean}
   */
  hasLightingMaps() {
    return !!(this.specularMap || this.aoMap || this.normalMap);
  }

  /**
   * Serializes this material for saving or exporting.
   * @returns {object}
   */
  toJSON() {
    const base = super.toJSON();
    return Object.assign(base, {
      type: this.type,
      diffuse: this.diffuse.toHex(),
      specular: this.specular.toHex(),
      shininess: this.shininess,
      emissive: this.emissive.toHex(),
      emissionIntensity: this.emissionIntensity,
      phong: this.phong,
      vertexColors: this.vertexColors,
      aoIntensity: this.aoIntensity,
      maps: {
        map: this.map ? this.map.toJSON() : null,
        specularMap: this.specularMap ? this.specularMap.toJSON() : null,
        normalMap: this.normalMap ? this.normalMap.toJSON() : null,
        emissionMap: this.emissionMap ? this.emissionMap.toJSON() : null,
        aoMap: this.aoMap ? this.aoMap.toJSON() : null
      },
      metadata: {
        ...base.metadata,
        class: 'StandardMaterial'
      }
    });
  }

  /**
   * Cleans up GPU resources linked to this material.
   * @param {WebGLRenderingContext} [gl]
   */
  dispose(gl) {
    super.dispose(gl);
    const maps = [this.map, this.specularMap, this.normalMap, this.emissionMap, this.aoMap];
    for (const tex of maps) if (tex) tex.dispose(gl);
  }
}

export { StandardMaterial };
