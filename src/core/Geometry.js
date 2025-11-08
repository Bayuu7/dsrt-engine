// ===============================================
// Geometry.js — DSRT Engine v1.1
// ===============================================

/**
 * @fileoverview
 * Geometry defines the vertex structure of a 3D object.
 * It contains vertices, normals, UVs, indices, and other
 * low-level data that represent an object's shape.
 *
 * This class provides the foundation for all geometric
 * representations — custom, procedural, or loaded from assets.
 *
 * @module DSRT/core/Geometry
 * @since DSRT Engine 1.1
 * @version 1.1
 * @author
 *   DSRT Engine System — Core Geometry Layer
 */

/**
 * ==============================================================
 * CLASS: Geometry
 * ==============================================================
 *
 * @class Geometry
 * @description
 * Geometry defines the **structural (spatial) aspect** of a 3D object.
 * It stores and manages vertex-related data: positions, normals, UVs, and indices.
 * This class is **renderer-agnostic** and can be serialized or cloned easily.
 *
 * Flow relationship:
 *
 * Engine
 * └── Scene
 *     └── Mesh
 *         ├── Geometry → shape definition (spatial form)
 *         └── Material → surface definition (visual form)
 *
 * @example
 * const geom = new Geometry({
 *   vertices: [0, 0, 0, 1, 0, 0, 0, 1, 0],
 *   indices: [0, 1, 2]
 * });
 */
class Geometry {

  /**
   * @constructor
   * @param {object} [parameters={}] - Geometry initialization parameters.
   */
  constructor( parameters = {} ) {

    /**
     * Unique identifier for this geometry instance.
     * @type {string}
     */
    this.uuid = Geometry._generateUUID();

    /**
     * Human-readable name for debugging and tracking.
     * @type {string}
     */
    this.name = parameters.name || '';

    /**
     * Vertex positions stored as a flat array [x, y, z, x, y, z, ...].
     * @type {Float32Array|number[]}
     */
    this.vertices = parameters.vertices
      ? new Float32Array(parameters.vertices)
      : new Float32Array();

    /**
     * Face indices referencing vertices (optional).
     * If not provided, geometry is assumed non-indexed.
     * @type {Uint16Array|Uint32Array|number[]|null}
     */
    this.indices = parameters.indices
      ? (parameters.indices.length > 65535
          ? new Uint32Array(parameters.indices)
          : new Uint16Array(parameters.indices))
      : null;

    /**
     * Vertex normals used for lighting calculations.
     * @type {Float32Array|number[]|null}
     */
    this.normals = parameters.normals
      ? new Float32Array(parameters.normals)
      : null;

    /**
     * UV coordinates (texture mapping).
     * @type {Float32Array|number[]|null}
     */
    this.uvs = parameters.uvs
      ? new Float32Array(parameters.uvs)
      : null;

    /**
     * Optional vertex colors.
     * @type {Float32Array|number[]|null}
     */
    this.colors = parameters.colors
      ? new Float32Array(parameters.colors)
      : null;

    /**
     * Bounding box of the geometry (computed lazily).
     * @type {{ min: [number, number, number], max: [number, number, number] }|null}
     */
    this.boundingBox = null;

    /**
     * Bounding sphere (used for quick frustum culling).
     * @type {{ center: [number, number, number], radius: number }|null}
     */
    this.boundingSphere = null;

    /**
     * Type string for runtime identification.
     * @type {string}
     * @readonly
     */
    this.type = 'Geometry';

    /**
     * Internal audit flag for DSRT engine consistency checks.
     * @type {boolean}
     * @readonly
     */
    this.isGeometry = true;

    /**
     * Whether this geometry needs GPU re-upload.
     * @type {boolean}
     */
    this._needsUpdate = true;

    /**
     * Internal GPU reference assigned by the renderer.
     * @type {any}
     * @private
     */
    this._gpuRef = null;

    /**
     * Disposal flag to mark if geometry has been released.
     * @type {boolean}
     */
    this.disposed = false;
  }

  // ============================================================
  // COMPUTATIONAL METHODS
  // ============================================================

  /**
   * Computes a simple bounding box from vertices.
   */
  computeBoundingBox() {
    if (!this.vertices || this.vertices.length === 0) return;

    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];

    for (let i = 0; i < this.vertices.length; i += 3) {
      const x = this.vertices[i];
      const y = this.vertices[i + 1];
      const z = this.vertices[i + 2];

      if (x < min[0]) min[0] = x;
      if (y < min[1]) min[1] = y;
      if (z < min[2]) min[2] = z;

      if (x > max[0]) max[0] = x;
      if (y > max[1]) max[1] = y;
      if (z > max[2]) max[2] = z;
    }

    this.boundingBox = { min, max };
  }

  /**
   * Computes a bounding sphere based on the bounding box.
   */
  computeBoundingSphere() {
    if (!this.boundingBox) this.computeBoundingBox();
    const { min, max } = this.boundingBox;

    const center = [
      (min[0] + max[0]) / 2,
      (min[1] + max[1]) / 2,
      (min[2] + max[2]) / 2
    ];

    let radius = 0;
    for (let i = 0; i < this.vertices.length; i += 3) {
      const dx = this.vertices[i] - center[0];
      const dy = this.vertices[i + 1] - center[1];
      const dz = this.vertices[i + 2] - center[2];
      radius = Math.max(radius, Math.sqrt(dx * dx + dy * dy + dz * dz));
    }

    this.boundingSphere = { center, radius };
  }

  /**
   * Marks geometry for GPU buffer re-upload.
   */
  markNeedsUpdate() {
    this._needsUpdate = true;
  }

  // ============================================================
  // DATA OPERATIONS
  // ============================================================

  /**
   * Copies another geometry’s data into this one.
   * @param {Geometry} source
   * @returns {Geometry}
   */
  copy(source) {
    this.name = source.name;

    this.vertices = new Float32Array(source.vertices);
    this.indices = source.indices
      ? (source.indices.length > 65535
          ? new Uint32Array(source.indices)
          : new Uint16Array(source.indices))
      : null;

    this.normals = source.normals ? new Float32Array(source.normals) : null;
    this.uvs = source.uvs ? new Float32Array(source.uvs) : null;
    this.colors = source.colors ? new Float32Array(source.colors) : null;

    this.boundingBox = source.boundingBox ? { ...source.boundingBox } : null;
    this.boundingSphere = source.boundingSphere ? { ...source.boundingSphere } : null;

    return this;
  }

  /**
   * Creates a deep clone of this geometry.
   * @returns {Geometry}
   */
  clone() {
    return new Geometry().copy(this);
  }

  /**
   * Converts this geometry into a JSON representation.
   * @returns {object}
   */
  toJSON() {
    return {
      uuid: this.uuid,
      name: this.name,
      type: this.type,
      vertices: Array.from(this.vertices),
      indices: this.indices ? Array.from(this.indices) : null,
      normals: this.normals ? Array.from(this.normals) : null,
      uvs: this.uvs ? Array.from(this.uvs) : null,
      colors: this.colors ? Array.from(this.colors) : null,
      boundingBox: this.boundingBox,
      boundingSphere: this.boundingSphere,
      dsrt: {
        geometry: {
          audit: { isGeometry: true },
          metadata: {
            type: 'Geometry',
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
   * Frees GPU and memory resources associated with this geometry.
   */
  dispose() {
    if (this._gpuRef && typeof this._gpuRef.dispose === 'function') {
      this._gpuRef.dispose();
    }
    this._gpuRef = null;
    this.vertices = null;
    this.indices = null;
    this.normals = null;
    this.uvs = null;
    this.colors = null;
    this.disposed = true;
  }

  // ============================================================
  // STATIC UTILITIES
  // ============================================================

  /**
   * Generates a UUID-like string for unique geometry identification.
   * @private
   * @returns {string}
   */
  static _generateUUID() {
    return 'geo-' + Math.random().toString(36).substr(2, 9);
  }
}

export { Geometry };

/**
 * ==============================================================
 * Geometry Internal Test
 * ==============================================================
 * @function dsrtTestGeometry
 * @description
 * Unit test verifying construction, cloning, bounding computation,
 * and serialization of the Geometry class.
 *
 * @returns {boolean}
 */
export function dsrtTestGeometry() {
  const g = new Geometry({
    vertices: [0, 0, 0, 1, 1, 1, -1, -1, -1],
    indices: [0, 1, 2]
  });

  g.computeBoundingBox();
  g.computeBoundingSphere();

  const clone = g.clone();
  const json = g.toJSON();

  const ok =
    g.isGeometry &&
    clone instanceof Geometry &&
    json.dsrt.geometry.audit.isGeometry === true &&
    typeof json.dsrt.geometry.metadata.createdAt === 'string' &&
    Array.isArray(json.vertices) &&
    !!g.boundingBox && !!g.boundingSphere;

  g.dispose();

  return ok;
}
