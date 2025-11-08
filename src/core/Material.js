// ===============================================
// Material.js — DSRT Engine v1.1
// ===============================================

/**
 * @fileoverview
 * Material defines how surfaces appear when rendered.
 * It controls shading, color, texture, blending, transparency,
 * and other visual effects applied to a Mesh.
 *
 * This base Material class serves as a foundation for all
 * specialized material types (e.g. PhongMaterial, StandardMaterial, ShaderMaterial).
 *
 * @module DSRT/core/Material
 * @since DSRT Engine 1.1
 * @version 1.1
 * @author
 *   DSRT Engine System — Core Rendering Layer
 */

/**
 * ==============================================================
 * CLASS: Material
 * ==============================================================
 *
 * @class Material
 * @description
 * Material is the **visual representation layer** of a 3D object.
 * It defines how geometry interacts with light and environment.
 *
 * Flow relationship:
 *
 * Engine
 * └── Scene
 *     └── Mesh
 *         ├── Geometry  → defines shape
 *         └── Material  → defines appearance
 *
 * @example
 * const material = new Material({
 *   color: 0xffffff,
 *   opacity: 1.0,
 *   transparent: false
 * });
 */
class Material {

  /**
   * @constructor
   * @param {object} [parameters={}] - Material initialization options.
   */
  constructor( parameters = {} ) {

    /**
     * Unique identifier for this material.
     * Usually generated automatically for asset tracking.
     * @type {string}
     */
    this.uuid = Material._generateUUID();

    /**
     * Human-readable name for debugging and asset inspection.
     * @type {string}
     */
    this.name = parameters.name || '';

    /**
     * Main color of the material surface (hexadecimal integer).
     * @type {number}
     */
    this.color = parameters.color !== undefined ? parameters.color : 0xffffff;

    /**
     * Material opacity (1.0 = fully opaque, 0.0 = fully transparent).
     * @type {number}
     */
    this.opacity = parameters.opacity !== undefined ? parameters.opacity : 1.0;

    /**
     * Whether this material should use alpha blending for transparency.
     * @type {boolean}
     */
    this.transparent = parameters.transparent || false;

    /**
     * Whether lighting calculations are applied to this material.
     * Used to toggle between lit/unlit shaders.
     * @type {boolean}
     */
    this.lit = parameters.lit !== undefined ? parameters.lit : true;

    /**
     * Determines if this material casts or receives shadows.
     * @type {boolean}
     */
    this.receiveShadow = parameters.receiveShadow || false;

    /**
     * Double-sided rendering toggle.
     * @type {boolean}
     */
    this.doubleSided = parameters.doubleSided || false;

    /**
     * Rendering blending mode (e.g. "Normal", "Additive", "Multiply").
     * @type {string}
     */
    this.blending = parameters.blending || 'Normal';

    /**
     * Indicates if the material needs GPU re-upload (after property changes).
     * @type {boolean}
     * @private
     */
    this._needsUpdate = true;

    /**
     * Internal GPU reference handle (assigned by the renderer).
     * @type {any}
     * @private
     */
    this._gpuRef = null;

    /**
     * Type identifier for debugging, serialization, and runtime checks.
     * @type {string}
     * @readonly
     */
    this.type = 'Material';

    /**
     * Audit flag for internal type testing.
     * @type {boolean}
     * @readonly
     */
    this.isMaterial = true;

    /**
     * Tracks whether this material is disposed and no longer valid.
     * @type {boolean}
     * @readonly
     */
    this.disposed = false;
  }

  // ============================================================
  // CORE METHODS
  // ============================================================

  /**
   * Marks this material for GPU re-upload.
   * Should be called whenever parameters are changed.
   */
  markNeedsUpdate() {
    this._needsUpdate = true;
  }

  /**
   * Internal update hook, called by the renderer before usage.
   * Uploads material uniforms, textures, or parameters if needed.
   * @param {Renderer} renderer
   */
  update( renderer ) {
    if ( this._needsUpdate ) {
      renderer.updateMaterial( this );
      this._needsUpdate = false;
    }
  }

  /**
   * Copies another material’s properties into this one.
   * @param {Material} source
   * @returns {Material}
   */
  copy( source ) {
    this.name = source.name;
    this.color = source.color;
    this.opacity = source.opacity;
    this.transparent = source.transparent;
    this.lit = source.lit;
    this.receiveShadow = source.receiveShadow;
    this.doubleSided = source.doubleSided;
    this.blending = source.blending;
    return this;
  }

  /**
   * Creates a duplicate of this material.
   * @returns {Material}
   */
  clone() {
    return new Material().copy( this );
  }

  /**
   * Converts the material into a DSRT-compatible JSON structure.
   * @returns {object}
   */
  toJSON() {
    return {
      uuid: this.uuid,
      name: this.name,
      color: this.color,
      opacity: this.opacity,
      transparent: this.transparent,
      lit: this.lit,
      receiveShadow: this.receiveShadow,
      doubleSided: this.doubleSided,
      blending: this.blending,
      dsrt: {
        material: {
          audit: { isMaterial: true },
          metadata: {
            type: 'Material',
            revision: 'v1.1',
            createdAt: (new Date()).toISOString(),
          }
        }
      }
    };
  }

  // ============================================================
  // RESOURCE MANAGEMENT
  // ============================================================

  /**
   * Frees all GPU resources associated with this material.
   * This must be called when the material is no longer needed.
   */
  dispose() {
    if ( this._gpuRef && typeof this._gpuRef.dispose === 'function' ) {
      this._gpuRef.dispose();
    }
    this._gpuRef = null;
    this.disposed = true;
  }

  // ============================================================
  // STATIC UTILITIES
  // ============================================================

  /**
   * Generates a simple UUID-like string for materials.
   * Used internally if a UUID is not provided.
   * @private
   * @returns {string}
   */
  static _generateUUID() {
    return 'mat-' + Math.random().toString(36).substr(2, 9);
  }
}

export { Material };

/**
 * ==============================================================
 * Material Internal Test
 * ==============================================================
 * @function dsrtTestMaterial
 * @description
 * Unit test for verifying Material construction, cloning, and JSON output.
 *
 * @returns {boolean}
 */
export function dsrtTestMaterial() {
  const mat = new Material({ color: 0xabcdef, opacity: 0.7, transparent: true });
  const clone = mat.clone();
  const json = mat.toJSON();

  const ok =
    mat.isMaterial &&
    clone instanceof Material &&
    json.dsrt.material.audit.isMaterial === true &&
    typeof json.dsrt.material.metadata.createdAt === 'string';

  mat.dispose();

  return ok;
}
