// ===============================================
// Mesh.js — DSRT Engine v1.1
// ===============================================

import { Object3D } from '../core/Object3D.js';

/**
 * @fileoverview
 * Mesh is a renderable entity composed of a geometry (shape data)
 * and a material (visual appearance definition).
 *
 * It extends {@link Object3D}, inheriting position, rotation,
 * scale, matrix, and scene graph capabilities.
 *
 * This class acts as one of the most fundamental render units
 * in the DSRT 3D Engine — every visible object in the scene is a Mesh.
 *
 * @module DSRT/core/Mesh
 * @since DSRT Engine 1.1
 * @author
 *   DSRT Engine System — Core Rendering Layer
 */

/**
 * ==============================================================
 * CLASS: Mesh
 * ==============================================================
 *
 * @class Mesh
 * @extends Object3D
 *
 * @description
 * A Mesh couples **geometry** (vertex data) and **material** (shading data)
 * into a renderable unit.
 *
 * Flow relationship:
 *
 * Engine
 * └── Scene
 *     ├── Group
 *     │    └── Mesh
 *     └── Mesh
 *
 * @example
 * const mesh = new Mesh( boxGeometry, basicMaterial );
 * mesh.position.set( 0, 1, 0 );
 * scene.add( mesh );
 */
class Mesh extends Object3D {

  /**
   * @constructor
   * @param {Geometry} geometry - The geometry defining shape vertices and attributes.
   * @param {Material} material - The material defining surface color, shading, and rendering mode.
   */
  constructor( geometry = null, material = null ) {
    super();

    /**
     * The geometry assigned to this Mesh.
     * Can be replaced dynamically during runtime.
     * @type {Geometry|null}
     */
    this.geometry = geometry;

    /**
     * The material assigned to this Mesh.
     * Determines visual style and rendering behavior.
     * @type {Material|null}
     */
    this.material = material;

    /**
     * Internal type identifier for serialization and debugging.
     * @type {string}
     * @readonly
     */
    this.type = 'Mesh';

    /**
     * Engine audit flag to confirm this is a Mesh object.
     * Used internally by the engine for validation.
     * @type {boolean}
     * @readonly
     */
    this.isMesh = true;

    /**
     * Indicates whether this mesh should be drawn.
     * Can be toggled for optimization.
     * @type {boolean}
     */
    this.visible = true;

    /**
     * Tracks GPU buffer binding and upload state.
     * Useful for engine-level render optimization.
     * @type {boolean}
     * @private
     */
    this._gpuReady = false;
  }

  // ============================================================
  // RENDER LIFECYCLE METHODS
  // ============================================================

  /**
   * Called by the renderer before drawing.
   * Handles GPU preparation and buffer uploads.
   * @param {Renderer} renderer
   */
  onBeforeRender( renderer ) {
    if ( !this._gpuReady && this.geometry && this.material ) {
      renderer.uploadGeometry( this.geometry );
      renderer.uploadMaterial( this.material );
      this._gpuReady = true;
    }
  }

  /**
   * Core rendering logic handled by the renderer.
   * This is not called directly by the user.
   * @param {Renderer} renderer
   */
  render( renderer ) {
    if ( !this.visible ) return;
    if ( this.geometry && this.material ) {
      this.onBeforeRender( renderer );
      renderer.drawMesh( this );
    }
  }

  /**
   * Called after the mesh is drawn.
   * Can be overridden for custom effects.
   * @param {Renderer} renderer
   */
  onAfterRender( renderer ) {}

  // ============================================================
  // SERIALIZATION & CLONING
  // ============================================================

  /**
   * Clone this mesh, including its geometry and material references.
   * @param {boolean} [recursive=true]
   * @returns {Mesh}
   */
  clone( recursive = true ) {
    return new Mesh( this.geometry, this.material ).copy( this, recursive );
  }

  /**
   * Copy properties from another Mesh.
   * @param {Mesh} source
   * @param {boolean} [recursive=true]
   * @returns {Mesh}
   */
  copy( source, recursive = true ) {
    super.copy( source, recursive );
    this.geometry = source.geometry;
    this.material = source.material;
    this.visible = source.visible;
    return this;
  }

  /**
   * Convert this mesh into a DSRT-compatible JSON structure.
   * Includes geometry and material references if available.
   * @param {object} [meta]
   * @returns {object}
   */
  toJSON( meta ) {
    const base = super.toJSON( meta );
    base.geometry = this.geometry ? this.geometry.uuid || this.geometry.id : null;
    base.material = this.material ? this.material.uuid || this.material.id : null;

    base.dsrt = {
      object3D: {
        audit: { isMesh: true },
        metadata: {
          type: 'Mesh',
          revision: 'v1.1',
          visible: this.visible,
          createdAt: (new Date()).toISOString()
        }
      }
    };
    return base;
  }

  // ============================================================
  // DESTRUCTION & RESOURCE MANAGEMENT
  // ============================================================

  /**
   * Release GPU resources and internal references.
   * Should be called when the mesh is no longer needed.
   */
  dispose() {
    if ( this.geometry && typeof this.geometry.dispose === 'function' ) {
      this.geometry.dispose();
    }
    if ( this.material && typeof this.material.dispose === 'function' ) {
      this.material.dispose();
    }
    this._gpuReady = false;
  }
}

export { Mesh };

/**
 * ==============================================================
 * Mesh Internal Test
 * ==============================================================
 * @function dsrtTestMesh
 * @description
 * Basic unit test for Mesh construction, cloning, and JSON serialization.
 *
 * @returns {boolean}
 */
export function dsrtTestMesh() {
  const mesh = new Mesh( { id: 'geo' }, { id: 'mat' } );
  const clone = mesh.clone();
  const json = mesh.toJSON();

  const ok =
    mesh.isMesh &&
    clone instanceof Mesh &&
    json.dsrt.object3D.audit.isMesh === true &&
    typeof json.dsrt.object3D.metadata.createdAt === 'string';

  mesh.dispose();

  return ok;
}
