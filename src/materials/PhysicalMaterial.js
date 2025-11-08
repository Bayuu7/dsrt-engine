/**
 * PhysicalMaterial.js
 * -----------------------------------------------------------
 * A physically-based rendering (PBR) material used to simulate
 * realistic lighting, reflection, and surface interaction with
 * environment light sources.
 *
 * This material extends the base Material class, adding properties
 * for metalness, roughness, clearcoat, reflectivity, ambient occlusion,
 * and other attributes commonly found in real-world materials.
 *
 * It is designed to achieve accurate visual realism through
 * microfacet BRDF models and energy-conserving light equations.
 * -----------------------------------------------------------
 */

import { Material } from "./Material.js";
import { Color } from "../math/Color.js";
import { Texture } from "./Texture.js";

export class PhysicalMaterial extends Material {
  /**
   * @param {Object} params - Configuration object for the material.
   * 
   * @param {Color|String|Number} [params.color=0xffffff] - Base albedo color.
   * @param {Number} [params.metalness=0.0] - Determines how metallic the surface is (0 = non-metal, 1 = fully metallic).
   * @param {Number} [params.roughness=0.5] - Surface roughness controlling reflection blur.
   * @param {Number} [params.clearcoat=0.0] - Strength of clear coat layer on top of the material.
   * @param {Number} [params.clearcoatRoughness=0.0] - Roughness of the clear coat layer.
   * @param {Texture|null} [params.map=null] - Base color (albedo) texture.
   * @param {Texture|null} [params.metalnessMap=null] - Texture controlling metalness per pixel.
   * @param {Texture|null} [params.roughnessMap=null] - Texture controlling roughness per pixel.
   * @param {Texture|null} [params.normalMap=null] - Normal map to simulate detailed surface geometry.
   * @param {Texture|null} [params.aoMap=null] - Ambient occlusion texture.
   * @param {Number} [params.reflectivity=0.5] - Amount of reflected light contribution (non-PBR fallback).
   * @param {Number} [params.envIntensity=1.0] - Environment map intensity multiplier.
   */
  constructor(params = {}) {
    super();

    // === Base properties ===
    this.type = "PhysicalMaterial";
    this.color = new Color(params.color ?? 0xffffff);

    // === Physically-based attributes ===
    this.metalness = params.metalness ?? 0.0;
    this.roughness = params.roughness ?? 0.5;
    this.clearcoat = params.clearcoat ?? 0.0;
    this.clearcoatRoughness = params.clearcoatRoughness ?? 0.0;

    // === Texture maps ===
    this.map = params.map ?? null; // Albedo map
    this.metalnessMap = params.metalnessMap ?? null;
    this.roughnessMap = params.roughnessMap ?? null;
    this.normalMap = params.normalMap ?? null;
    this.aoMap = params.aoMap ?? null;

    // === Reflection & environment ===
    this.reflectivity = params.reflectivity ?? 0.5;
    this.envIntensity = params.envIntensity ?? 1.0;

    // === Internal flags ===
    this.needsUpdate = true;
  }

  /**
   * Called before rendering.
   * Prepares shader uniforms and syncs texture maps for GPU pipeline.
   * 
   * @param {Renderer} renderer - The renderer instance handling GPU communication.
   */
  onBeforeRender(renderer) {
    if (!renderer) return;
    // In a real engine, here we would bind uniform variables to GPU shaders.
    // Example:
    // renderer.setUniform('uMetalness', this.metalness);
    // renderer.setUniform('uRoughness', this.roughness);
  }

  /**
   * Updates material parameters dynamically at runtime.
   * This allows smooth transitions or runtime customization
   * without reloading the material.
   * 
   * @param {Object} data - The parameter object to merge.
   */
  update(data = {}) {
    for (const key in data) {
      if (this.hasOwnProperty(key)) {
        this[key] = data[key];
      }
    }
    this.needsUpdate = true;
  }

  /**
   * Clones this material into a new identical instance.
   * Used when duplicating meshes or instancing objects.
   * 
   * @returns {PhysicalMaterial}
   */
  clone() {
    return new PhysicalMaterial({
      color: this.color.clone(),
      metalness: this.metalness,
      roughness: this.roughness,
      clearcoat: this.clearcoat,
      clearcoatRoughness: this.clearcoatRoughness,
      map: this.map,
      metalnessMap: this.metalnessMap,
      roughnessMap: this.roughnessMap,
      normalMap: this.normalMap,
      aoMap: this.aoMap,
      reflectivity: this.reflectivity,
      envIntensity: this.envIntensity,
    });
  }

  /**
   * Converts the material data into a JSON-serializable object.
   * Useful for saving and exporting scenes.
   */
  toJSON() {
    return {
      type: this.type,
      color: this.color.toHex(),
      metalness: this.metalness,
      roughness: this.roughness,
      clearcoat: this.clearcoat,
      clearcoatRoughness: this.clearcoatRoughness,
      reflectivity: this.reflectivity,
      envIntensity: this.envIntensity,
    };
  }
}
