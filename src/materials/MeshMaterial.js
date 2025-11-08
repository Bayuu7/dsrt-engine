// ===========================================================
// MeshMaterial.js — Core Material Bridge for Mesh Rendering v1.1
// ===========================================================

import { Material } from './Material.js';
import { Color } from '../math/Color.js';
import { MaterialTexture } from './MaterialTexture.js';

/**
 * @fileoverview
 * MeshMaterial
 * @module core/materials/MeshMaterial
 * @description
 * The `MeshMaterial` class extends the base `Material` to provide
 * surface shading definitions for visible 3D geometry.
 *
 * It acts as the fundamental layer connecting a mesh’s geometry
 * to its visual appearance, including color, texture, shading model,
 * and transparency.
 *
 * This material supports both unlit (flat) and lit (Lambert/Phong/PBR)
 * rendering modes, depending on the renderer and scene context.
 *
 * @version 1.1
 * @since Core Engine 1.1
 * @author
 * Core Engine System
 */

/**
 * FLOW OVERVIEW:
 * Geometry → Mesh → MeshMaterial → Renderer
 * 
 * Each MeshMaterial defines:
 * - Base color (diffuse/albedo)
 * - Surface lighting response
 * - Optional texture maps (albedo, normal, roughness, metallic, etc.)
 * - Opacity and blending behavior
 */

class MeshMaterial extends Material {

  /**
   * Creates a new MeshMaterial.
   * @param {object} [parameters={}] - Material parameters and shader options.
   */
  constructor(parameters = {}) {
    super(parameters);

    /** @type {string} Material type identifier. */
    this.type = 'MeshMaterial';

    // ============================================================
    // CORE COLOR AND LIGHTING PROPERTIES
    // ============================================================

    /** @type {Color} The base surface color of the material. */
    this.color = parameters.color instanceof Color
      ? parameters.color
      : new Color(parameters.color || 0xffffff);

    /** @type {number} Surface reflectivity in [0,1]. Affects lighting intensity. */
    this.reflectivity = parameters.reflectivity !== undefined ? parameters.reflectivity : 0.5;

    /** @type {boolean} If true, the material responds to lighting (Lambert/Phong). */
    this.lit = parameters.lit !== false;

    /** @type {boolean} If true, the material uses physically-based shading (PBR). */
    this.pbr = parameters.pbr || false;

    // ============================================================
    // TEXTURE MAPS
    // ============================================================

    /** @type {MaterialTexture|null} Base color texture map (albedo). */
    this.map = parameters.map instanceof MaterialTexture ? parameters.map : null;

    /** @type {MaterialTexture|null} Normal map texture for surface detail. */
    this.normalMap = parameters.normalMap instanceof MaterialTexture ? parameters.normalMap : null;

    /** @type {MaterialTexture|null} Roughness map for PBR. */
    this.roughnessMap = parameters.roughnessMap instanceof MaterialTexture ? parameters.roughnessMap : null;

    /** @type {MaterialTexture|null} Metallic map for PBR. */
    this.metallicMap = parameters.metallicMap instanceof MaterialTexture ? parameters.metallicMap : null;

    /** @type {MaterialTexture|null} Emission texture for glow surfaces. */
    this.emissionMap = parameters.emissionMap instanceof MaterialTexture ? parameters.emissionMap : null;

    // ============================================================
    // TRANSPARENCY AND BLENDING
    // ============================================================

    /** @type {boolean} Whether this material uses transparency. */
    this.transparent = parameters.transparent || false;

    /** @type {number} Opacity value (0 = fully transparent, 1 = opaque). */
    this.opacity = parameters.opacity !== undefined ? parameters.opacity : 1.0;

    /** @type {boolean} Whether to apply alpha blending. */
    this.alphaBlend = parameters.alphaBlend || false;

    // ============================================================
    // SHADING MODEL
    // ============================================================

    /** @type {'flat'|'lambert'|'phong'|'pbr'} Shading model type. */
    this.shadingModel = parameters.shadingModel || (this.pbr ? 'pbr' : 'lambert');

    /** @type {boolean} Enables wireframe rendering mode. */
    this.wireframe = parameters.wireframe || false;

    /** @type {Color} Wireframe color when enabled. */
    this.wireframeColor = parameters.wireframeColor instanceof Color
      ? parameters.wireframeColor
      : new Color(parameters.wireframeColor || 0x000000);

    /** @type {number} Wireframe line width in pixels. */
    this.wireframeWidth = parameters.wireframeWidth !== undefined ? parameters.wireframeWidth : 1.0;
  }

  // ============================================================
  // METHODS
  // ============================================================

  /**
   * Binds this material’s textures to WebGL context.
   * @param {WebGLRenderingContext} gl
   * @param {object} textureUnits - Map of available texture unit indices.
   */
  bindTextures(gl, textureUnits = {}) {
    const maps = {
      map: this.map,
      normalMap: this.normalMap,
      roughnessMap: this.roughnessMap,
      metallicMap: this.metallicMap,
      emissionMap: this.emissionMap
    };

    let unit = 0;
    for (const key in maps) {
      const tex = maps[key];
      if (tex && tex._glTexture) {
        tex.activate(gl, unit);
        textureUnits[key] = unit++;
      }
    }
  }

  /**
   * Sets a specific texture map on this material.
   * @param {string} type - Texture slot name (e.g. 'map', 'normalMap').
   * @param {MaterialTexture} texture - The texture to assign.
   */
  setTexture(type, texture) {
    if (texture instanceof MaterialTexture) {
      this[type] = texture;
    }
  }

  /**
   * Returns whether the material has any valid texture maps.
   * @returns {boolean}
   */
  hasTextures() {
    return !!(this.map || this.normalMap || this.roughnessMap || this.metallicMap || this.emissionMap);
  }

  // ============================================================
  // SERIALIZATION
  // ============================================================

  /**
   * Serializes this material into a JSON-compatible object.
   * @returns {object}
   */
  toJSON() {
    const base = super.toJSON();
    return Object.assign(base, {
      type: this.type,
      color: this.color.toHex(),
      reflectivity: this.reflectivity,
      lit: this.lit,
      pbr: this.pbr,
      transparent: this.transparent,
      opacity: this.opacity,
      alphaBlend: this.alphaBlend,
      shadingModel: this.shadingModel,
      wireframe: this.wireframe,
      wireframeColor: this.wireframeColor.toHex(),
      wireframeWidth: this.wireframeWidth,
      maps: {
        map: this.map ? this.map.toJSON() : null,
        normalMap: this.normalMap ? this.normalMap.toJSON() : null,
        roughnessMap: this.roughnessMap ? this.roughnessMap.toJSON() : null,
        metallicMap: this.metallicMap ? this.metallicMap.toJSON() : null,
        emissionMap: this.emissionMap ? this.emissionMap.toJSON() : null
      },
      metadata: {
        ...base.metadata,
        class: 'MeshMaterial'
      }
    });
  }
}

export { MeshMaterial };
