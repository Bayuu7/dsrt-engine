// ===========================================================
// Object3D.js
// Core transformation node of the DSRT Engine hierarchy
// ===========================================================

import { Vector3 } from '../math/Vector3.js';
import { Quaternion } from '../math/Quaternion.js';
import { Matrix4 } from '../math/Matrix4.js';
import { Euler } from '../math/Euler.js';
import { generateUUID } from '../utils/MathUtils.js';

/**
 * @fileoverview
 * Object3D is the foundational node class of the DSRT Engine.
 * It represents any object with position, rotation, scale, and hierarchy.
 * Every renderable entity (Mesh, Light, Camera, etc.) inherits from Object3D.
 *
 * @version 1.1
 * @author DSRT
 * @since 1.0
 *
 * -----------------------------------------------------------
 * FLOW OVERVIEW:
 * Scene (root)
 * ├── Group
 * │   ├── Mesh
 * │   └── Light
 * └── Camera
 * -----------------------------------------------------------
 */

/**
 * @class Object3D
 * @classdesc
 * Base class for all transformable and hierarchical objects.
 * Provides world/local transformation, parenting, and serialization.
 */
class Object3D {

  // =========================================================
  // 🔹 CONSTRUCTOR & INITIAL STATE
  // =========================================================
  constructor( options = {} ) {
    /**
     * Unique identifier for this object.
     * @type {string}
     */
    this.uuid = generateUUID();

    /**
     * Optional name for human-readable identification.
     * @type {string}
     */
    this.name = '';

    /**
     * Local position of this object in 3D space.
     * @type {Vector3}
     */
    this.position = new Vector3();

    /**
     * Local rotation of this object as Euler angles.
     * @type {Euler}
     */
    this.rotation = new Euler();

    /**
     * Local quaternion representing rotation.
     * @type {Quaternion}
     */
    this.quaternion = new Quaternion();

    /**
     * Local scaling factor for this object.
     * @type {Vector3}
     */
    this.scale = new Vector3( 1, 1, 1 );

    /**
     * Local transformation matrix.
     * @type {Matrix4}
     */
    this.matrix = new Matrix4();

    /**
     * World transformation matrix.
     * @type {Matrix4}
     */
    this.matrixWorld = new Matrix4();

    /**
     * Parent reference in the scene graph.
     * @type {Object3D|null}
     */
    this.parent = null;

    /**
     * Array of child objects in this node.
     * @type {Object3D[]}
     */
    this.children = [];

    /**
     * Flags controlling lifecycle and rendering state.
     * @type {boolean}
     */
    this.visible = true;
    this.enabled = true;
    this.active = false;
    this.destroyed = false;

    /**
     * Optional debug flag for verbose logs.
     * @type {boolean}
     */
    this.debug = options.debug ?? false;

    /**
     * Internal flag for DSRT auditing.
     * @type {boolean}
     * @readonly
     */
    this.dsrtIsObject3D = true;
  }

  // =========================================================
  // 🔹 LIFECYCLE METHODS
  // =========================================================

  /**
   * Initializes this object and marks it as active.
   * Called once before use.
   * @returns {this}
   */
  init() {
    this.active = true;
    this.enabled = true;
    if ( this.debug ) console.log( `[Object3D] Initialized: ${this.name}` );
    return this;
  }

  /**
   * Updates this object (and optionally its children).
   * @param {number} delta - Frame delta time in seconds.
   * @returns {this}
   */
  update( delta ) {
    if ( !this.enabled ) return this;
    for ( const child of this.children ) {
      if ( typeof child.update === 'function' ) child.update( delta );
    }
    return this;
  }

  /**
   * Marks this object for destruction and removes its children.
   * @returns {this}
   */
  destroy() {
    this.destroyed = true;
    for ( const child of this.children ) {
      child.destroy?.();
    }
    this.children.length = 0;
    this.parent = null;
    if ( this.debug ) console.log( `[Object3D] Destroyed: ${this.name}` );
    return this;
  }

  // =========================================================
  // 🔹 TRANSFORMATION METHODS
  // =========================================================

  /**
   * Updates the local transformation matrix.
   */
  updateMatrix() {
    this.matrix.compose( this.position, this.quaternion, this.scale );
  }

  /**
   * Updates the world transformation matrix recursively.
   * @param {boolean} [force=false]
   */
  updateMatrixWorld( force = false ) {
    this.updateMatrix();
    if ( this.parent === null ) {
      this.matrixWorld.copy( this.matrix );
    } else {
      this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );
    }

    for ( const child of this.children ) {
      child.updateMatrixWorld( force );
    }
  }

  /**
   * Converts Euler rotation to Quaternion automatically.
   */
  updateQuaternionFromEuler() {
    this.quaternion.setFromEuler( this.rotation );
  }

  // =========================================================
  // 🔹 HIERARCHY METHODS
  // =========================================================

  /**
   * Adds a child object to this node.
   * @param {Object3D} object
   * @returns {this}
   */
  add( object ) {
    if ( object === this ) {
      throw new Error( 'Object3D.add: object cannot be added as a child of itself.' );
    }
    if ( object.parent ) object.parent.remove( object );
    object.parent = this;
    this.children.push( object );
    return this;
  }

  /**
   * Removes a child object from this node.
   * @param {Object3D} object
   * @returns {this}
   */
  remove( object ) {
    const index = this.children.indexOf( object );
    if ( index !== -1 ) {
      object.parent = null;
      this.children.splice( index, 1 );
    }
    return this;
  }

  /**
   * Returns a deep clone of this object.
   * @param {boolean} [recursive=true]
   * @returns {Object3D}
   */
  clone( recursive = true ) {
    return new this.constructor().copy( this, recursive );
  }

  /**
   * Copies values from another Object3D.
   * @param {Object3D} source
   * @param {boolean} [recursive=true]
   * @returns {this}
   */
  copy( source, recursive = true ) {
    this.name = source.name;
    this.position.copy( source.position );
    this.rotation.copy( source.rotation );
    this.quaternion.copy( source.quaternion );
    this.scale.copy( source.scale );
    this.visible = source.visible;
    this.enabled = source.enabled;
    this.active = source.active;

    if ( recursive ) {
      for ( const child of source.children ) {
        this.add( child.clone() );
      }
    }

    return this;
  }

  // =========================================================
  // 🔹 SERIALIZATION
  // =========================================================

  /**
   * Converts this object and its hierarchy into JSON.
   * @param {object} [meta]
   * @returns {object}
   */
  toJSON( meta ) {
    const data = {
      uuid: this.uuid,
      type: this.constructor.name,
      name: this.name,
      position: this.position.toArray(),
      rotation: this.rotation.toArray(),
      quaternion: this.quaternion.toArray(),
      scale: this.scale.toArray(),
      visible: this.visible,
      enabled: this.enabled,
      children: [],
      dsrt: {
        object3D: {
          audit: { dsrtIsObject3D: true },
          flags: {
            active: this.active,
            destroyed: this.destroyed
          }
        }
      }
    };

    for ( const child of this.children ) {
      data.children.push( child.toJSON( meta ).object ?? child.toJSON( meta ) );
    }

    return { object: data };
  }
}

export { Object3D };
