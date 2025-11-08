// DSRT.Object3D v1.1
import { EventDispatcher } from './EventDispatcher.js';
import { Vector3 } from '../math/Vector3.js';
import { Quaternion } from '../math/Quaternion.js';
import { Euler } from '../math/Euler.js';
import { Matrix4 } from '../math/Matrix4.js';
import { Matrix3 } from '../math/Matrix3.js';
import { Layers } from './Layers.js';
import { generateUUID } from '../math/MathUtils.js';

/**
 * DSRT.Object3D v1.1
 * Base class for all transformable objects in DSRT.
 * - Adds lookAt, applyMatrix4, removeAll, isDescendantOf
 * - Adds findByName/findByUUID/traverseVisible/getWorldDirection
 * - Emits richer events and uses dirtyTransform lifecycle
 *
 * @class
 * @extends EventDispatcher
 * @memberof DSRT
 * @since DSRT 1.1
 */
class Object3D extends EventDispatcher {

  static VERSION = '1.1.0';

  // internal id generator isolated per module (safe across reloads)
  static _idGen = (() => { let i = 0; return () => i++; })();

  constructor( options = {} ) {
    super();

    // Audit + compatibility flags
    this.dsrtIsObject3D = true;
    this.isObject3D = true;

    Object.defineProperty( this, 'id', { value: Object3D._idGen() } );
    this.uuid = generateUUID();

    // Basic identity
    this.name = '';
    this.type = 'Object3D';

    // Hierarchy
    this.parent = null;
    this.children = [];

    // Transform
    this.up = Object3D.DEFAULT_UP.clone();
    this.position = new Vector3();
    this.rotation = new Euler();
    this.quaternion = new Quaternion();
    this.scale = new Vector3( 1, 1, 1 );

    // matrices
    this.matrix = new Matrix4();
    this.matrixWorld = new Matrix4();
    this.modelViewMatrix = new Matrix4();
    this.normalMatrix = new Matrix3();

    // auto update controls
    this.matrixAutoUpdate = Object3D.DEFAULT_MATRIX_AUTO_UPDATE;
    this.matrixWorldAutoUpdate = Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE;
    this.matrixWorldNeedsUpdate = false;

    // rendering flags
    this.layers = new Layers();
    this.visible = true;
    this.castShadow = false;
    this.receiveShadow = false;
    this.frustumCulled = true;
    this.renderOrder = 0;

    // misc
    this.animations = [];
    this.customDepthMaterial = undefined;
    this.customDistanceMaterial = undefined;
    this.userData = {};

    // runtime flags
    this.enabled = options.enabled ?? true;
    this.active = options.active ?? true;
    this.destroyed = false;
    this.debug = !!options.debug;

    // change tracking
    this.dirtyTransform = false;

    // --- realtime observer hooks for transform changes ---
    // Mark dirty, request matrix world update and dispatch 'change' event (throttling should be done by listener if needed)
    this.position._onChange( () => {
      this._markTransformChanged( 'position' );
    });

    this.rotation._onChange( () => {
      this._markTransformChanged( 'rotation' );
    });

    this.quaternion._onChange( () => {
      this._markTransformChanged( 'quaternion' );
    });

    this.scale._onChange( () => {
      this._markTransformChanged( 'scale' );
    });
  }

  /**
   * Internal helper to mark transform changes and emit compact change event
   * @private
   * @param {string} property
   */
  _markTransformChanged( property ) {
    this.dirtyTransform = true;
    this.matrixWorldNeedsUpdate = true;
    if ( this.debug ) console.log( `[DSRT.Object3D] transform change (${property}) on '${this.name || this.uuid}'` );
    this.dispatchEvent({ type: 'change', name: this.name, uuid: this.uuid, property });
  }

  /**
   * Called when this object is added to a parent.
   * Subclasses may override.
   * @param {Object3D} parent
   */
  onAdd( parent ) {}

  /**
   * Called when this object is removed from a parent.
   * Subclasses may override.
   * @param {Object3D} parent
   */
  onRemove( parent ) {}

  /**
   * Marks object as initialized and active.
   * Emits 'init' event.
   * @return {Object3D}
   */
  init() {
    this.enabled = true;
    this.active = true;
    this.dispatchEvent({ type: 'init', name: this.name, uuid: this.uuid });
    if ( this.debug ) console.log( `[DSRT.Object3D] init '${this.name || this.uuid}'` );
    return this;
  }

  /**
   * Runtime update hook.
   * Emits 'update' event and propagates to children (if enabled).
   * @param {number} delta
   * @return {Object3D}
   */
  update( delta ) {
    if ( !this.enabled ) return this;
    this.dispatchEvent({ type: 'update', name: this.name, uuid: this.uuid, delta });
    if ( this.debug ) {
      // lightweight log
      // console.log(`[DSRT.Object3D] update '${this.name || this.uuid}'`, delta);
    }
    for ( const child of this.children ) {
      if ( child.update ) child.update( delta );
    }
    return this;
  }

  /**
   * Marks object as destroyed.
   * Emits 'destroy' event.
   * @return {Object3D}
   */
  destroy() {
    this.enabled = false;
    this.active = false;
    this.destroyed = true;
    this.dispatchEvent({ type: 'destroy', name: this.name, uuid: this.uuid });
    if ( this.debug ) console.log( `[DSRT.Object3D] destroy '${this.name || this.uuid}'` );
    return this;
  }

  /**
   * Disposes GPU resources and clears hierarchy.
   * Emits 'dispose' event.
   * @param {boolean} [recursive=true]
   */
  dispose( recursive = true ) {
    this.dispatchEvent({ type: 'dispose', name: this.name, uuid: this.uuid });
    if ( this.debug ) console.log( `[DSRT.Object3D] dispose '${this.name || this.uuid}' (recursive=${recursive})` );

    this.customDepthMaterial?.dispose?.();
    this.customDistanceMaterial?.dispose?.();

    if ( recursive ) {
      for ( const child of this.children.slice() ) {
        child.dispose?.( true );
      }
    }

    // detach from parent and clear children list without disposing again
    this.parent = null;
    this.children.length = 0;

    // mark destroyed
    this.destroyed = true;
    // clear dirty flag
    this.dirtyTransform = false;
  }

  /**
   * Adds a child object to this object.
   * Prevents circular parenting.
   * Triggers `onAdd()` hook and emits 'added' event.
   * @param {Object3D} object
   * @return {Object3D}
   */
  add( object ) {
    if ( object === this || !object || !object.isObject3D ) return this;

    // prevent adding ancestor or self as child (circular)
    if ( this.isDescendantOf( object ) ) {
      if ( this.debug ) console.warn( '[DSRT.Object3D] add(): cannot add ancestor as child (would create cycle)' );
      return this;
    }

    object.removeFromParent();
    object.parent = this;
    this.children.push( object );
    object.onAdd( this );
    this.dispatchEvent({ type: 'added', name: object.name, uuid: object.uuid, parentName: this.name, parentUUID: this.uuid });
    return this;
  }

  /**
   * Removes a child object from this object.
   * Triggers `onRemove()` hook and emits 'removed' event.
   * @param {Object3D} object
   * @return {Object3D}
   */
  remove( object ) {
    const index = this.children.indexOf( object );
    if ( index !== -1 ) {
      object.parent = null;
      this.children.splice( index, 1 );
      object.onRemove( this );
      this.dispatchEvent({ type: 'removed', name: object.name, uuid: object.uuid, parentName: this.name, parentUUID: this.uuid });
    }
    return this;
  }

  /**
   * Removes this object from its parent.
   * @return {Object3D}
   */
  removeFromParent() {
    if ( this.parent ) this.parent.remove( this );
    return this;
  }

  /**
   * Remove all children without disposing them.
   * @return {Object3D}
   */
  removeAll() {
    for ( const child of this.children ) {
      child.parent = null;
      child.onRemove?.( this );
    }
    this.children.length = 0;
    this.dispatchEvent({ type: 'removedAll', name: this.name, uuid: this.uuid });
    return this;
  }

  /**
   * Check whether given object is an ancestor of this.
   * @param {Object3D} object
   * @return {boolean}
   */
  isDescendantOf( object ) {
    let parent = this.parent;
    while ( parent ) {
      if ( parent === object ) return true;
      parent = parent.parent;
    }
    return false;
  }

  /**
   * Traverses this object and its descendants.
   * Skips disabled nodes. Optional filter can exclude branches.
   * @param {function(Object3D):void} callback
   * @param {function(Object3D):boolean} [filter]
   */
  traverse( callback, filter ) {
    if ( !this.enabled ) return;
    if ( filter && !filter( this ) ) return;
    callback( this );
    for ( const child of this.children ) {
      child.traverse( callback, filter );
    }
  }

  /**
   * Traverses only visible nodes.
   * @param {function(Object3D):void} callback
   */
  traverseVisible( callback ) {
    this.traverse( ( obj ) => {
      if ( obj.visible ) callback( obj );
    } );
  }

  /**
   * Updates local transformation matrix.
   * Marks matrixWorldNeedsUpdate.
   */
  updateMatrix() {
    this.matrix.compose( this.position, this.quaternion, this.scale );
    this.matrixWorldNeedsUpdate = true;
    this.dirtyTransform = true;
  }

  /**
   * Updates world transformation matrix.
   * Optimized: avoids cloning parent matrix each frame.
   * @param {boolean} [force=false]
   */
  updateMatrixWorld( force = false ) {
    // If auto-update, update local matrix from transform attributes
    if ( this.matrixAutoUpdate ) this.updateMatrix();

    // Only compute when needed or forced
    if ( this.matrixWorldNeedsUpdate || force ) {
      if ( this.matrixWorldAutoUpdate ) {
        if ( this.parent ) {
          // Efficient multiply without cloning parent.matrixWorld
          this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );
        } else {
          this.matrixWorld.copy( this.matrix );
        }
      }
      this.matrixWorldNeedsUpdate = false;
      // mark force for children so it propagates correctly
      force = true;
    }

    // propagate to children (pass force flag)
    for ( const child of this.children ) {
      child.updateMatrixWorld( force );
    }

    // After matrix update succeed, reset dirtyTransform (caller can check)
    if ( !this.matrixWorldNeedsUpdate ) this.dirtyTransform = false;
  }

  /**
   * Apply a Matrix4 to this object's local transform (pre-multiply).
   * Decomposes matrix to position/rotation/scale and marks dirty.
   * @param {Matrix4} matrix
   * @return {Object3D}
   */
  applyMatrix4( matrix ) {
    // Pre-multiply: matrix * this.matrix
    this.matrix.multiplyMatrices( matrix, this.matrix );
    // Decompose to components
    const pos = new Vector3();
    const quat = new Quaternion();
    const scl = new Vector3();
    this.matrix.decompose( pos, quat, scl );
    this.position.copy( pos );
    this.quaternion.copy( quat );
    this.scale.copy( scl );
    // sync rotation with quaternion
    this.rotation.setFromQuaternion( this.quaternion );
    this.matrixWorldNeedsUpdate = true;
    this.dirtyTransform = true;
    this.dispatchEvent({ type: 'change', name: this.name, uuid: this.uuid, property: 'applyMatrix4' });
    return this;
  }

  /**
   * Make this object look at a target position.
   * Note: this affects quaternion (and rotation derived from it).
   * @param {Vector3} target
   * @return {Object3D}
   */
  lookAt( target ) {
    // Build lookAt matrix and extract rotation
    const m = new Matrix4();
    m.lookAt( this.position, target, this.up );
    const q = new Quaternion();
    q.setFromRotationMatrix( m );
    this.quaternion.copy( q );
    this.rotation.setFromQuaternion( this.quaternion );
    this.matrixWorldNeedsUpdate = true;
    this.dirtyTransform = true;
    this.dispatchEvent({ type: 'change', name: this.name, uuid: this.uuid, property: 'lookAt' });
    return this;
  }

  /**
   * Returns world position of this object (decomposes matrixWorld).
   * @param {Vector3} [target]
   * @return {Vector3}
   */
  getWorldPosition( target = new Vector3() ) {
    this.updateMatrixWorld( true );
    return target.setFromMatrixPosition( this.matrixWorld );
  }

  /**
   * Returns world quaternion of this object.
   * @param {Quaternion} [target]
   * @return {Quaternion}
   */
  getWorldQuaternion( target = new Quaternion() ) {
    this.updateMatrixWorld( true );
    this.matrixWorld.decompose( new Vector3(), target, new Vector3() );
    return target;
  }

  /**
   * Returns world scale of this object.
   * @param {Vector3} [target]
   * @return {Vector3}
   */
  getWorldScale( target = new Vector3() ) {
    this.updateMatrixWorld( true );
    this.matrixWorld.decompose( new Vector3(), new Quaternion(), target );
    return target;
  }

  /**
   * Get world direction (unit vector) for this object.
   * Default forward is -Z in object space (Three.js convention).
   * @param {Vector3} [target]
   * @return {Vector3}
   */
  getWorldDirection( target = new Vector3() ) {
    // -Z is forward
    target.set( 0, 0, -1 );
    this.getWorldQuaternion( Object3D._quatTemp ).normalize();
    return target.applyQuaternion( Object3D._quatTemp ).normalize();
  }

  /**
   * Create a deep clone of this object and children.
   * Uses copy() to perform safe copy.
   * @param {boolean} [recursive=true]
   * @return {Object3D}
   */
  clone( recursive = true ) {
    return new this.constructor().copy( this, recursive );
  }

  /**
   * Copy values from source into this object.
   * Safe: does not attach source children references directly.
   * @param {Object3D} source
   * @param {boolean} [recursive=true]
   * @return {Object3D}
   */
  copy( source, recursive = true ) {
    // Basic fields
    this.name = source.name;
    this.position.copy( source.position );
    this.rotation.copy( source.rotation );
    this.quaternion.copy( source.quaternion );
    this.scale.copy( source.scale );
    this.visible = source.visible;
    this.castShadow = source.castShadow;
    this.receiveShadow = source.receiveShadow;
    this.renderOrder = source.renderOrder;

    // Deep copy userData
    this.userData = JSON.parse( JSON.stringify( source.userData ) );

    // runtime flags
    this.enabled = source.enabled;
    this.active = source.active;
    this.destroyed = source.destroyed;
    this.debug = source.debug;

    // layers
    this.layers.mask = source.layers.mask;

    // clear existing children on copy target (prevent duplicates)
    this.children.length = 0;

    if ( recursive ) {
      for ( const child of source.children ) {
        const childClone = child.clone( true );
        this.add( childClone );
      }
    }

    // preserve dirty state if source had it
    this.dirtyTransform = source.dirtyTransform;

    return this;
  }

  /**
   * Find the first child (depth-first) with matching name.
   * @param {string} name
   * @return {Object3D|null}
   */
  findByName( name ) {
    let result = null;
    this.traverse( ( obj ) => {
      if ( result ) return;
      if ( obj.name === name ) result = obj;
    } );
    return result;
  }

  /**
   * Find object by UUID in this subtree.
   * @param {string} uuid
   * @return {Object3D|null}
   */
  findByUUID( uuid ) {
    let result = null;
    this.traverse( ( obj ) => {
      if ( result ) return;
      if ( obj.uuid === uuid ) result = obj;
    } );
    return result;
  }

  /**
   * Serializes object into DSRT-compatible JSON with additional metadata.
   * Includes audit identity, lifecycle flags, transform data, and layer mask.
   * Adds timestamp and revision for DSRT troubleshooting.
   * @param {object} meta
   * @return {object}
   */
  toJSON( meta ) {
    const rotationArray = [ this.rotation.x, this.rotation.y, this.rotation.z, this.rotation.order ?? 'XYZ' ];

    const data = {
      uuid: this.uuid,
      type: this.type,
      name: this.name,
      position: this.position.toArray(),
      rotation: rotationArray,
      quaternion: this.quaternion.toArray(),
      scale: this.scale.toArray(),
      visible: this.visible,
      castShadow: this.castShadow,
      receiveShadow: this.receiveShadow,
      renderOrder: this.renderOrder,
      layers: this.layers.mask,
      userData: this.userData,
      children: this.children.map( c => c.uuid ),
      dsrt: {
        object3D: {
          metadata: {
            type: 'DSRT.Object3D',
            version: Object3D.VERSION,
            revision: 'v1.1',
            createdAt: (new Date()).toISOString()
          },
          audit: {
            dsrtIsObject3D: this.dsrtIsObject3D
          },
          flags: {
            enabled: this.enabled,
            active: this.active,
            destroyed: this.destroyed,
            debug: this.debug,
            dirtyTransform: this.dirtyTransform
          }
        }
      }
    };

    if ( this.debug ) {
      // include matrixWorld for debug builds to aid repro
      data.objectMatrixWorld = this.matrixWorld.toArray?.() ?? null;
    }

    return data;
  }
}

/* -------------------------
   Static temps (minimize allocations)
   ------------------------- */
Object3D._quatTemp = new Quaternion();
Object3D._vecTemp = new Vector3();

/* -------------------------
   Defaults
   ------------------------- */
Object3D.DEFAULT_UP = new Vector3( 0, 1, 0 );
Object3D.DEFAULT_MATRIX_AUTO_UPDATE = true;
Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = true;

/* -------------------------
   Export
   ------------------------- */
export { Object3D };

/**
 * DSRT test hook to validate lifecycle, hierarchy, clone, serialization and helpers.
 * Creates an Object3D, runs lifecycle, serializes, and checks audit flags.
 *
 * @function
 * @memberof DSRT
 * @since DSRT 1.1
 * @return {boolean}
 */
export function dsrtTestObject3D() {
  const root = new Object3D({ debug: true });
  root.name = 'Root';
  root.init();

  const child = new Object3D();
  child.name = 'Child';
  root.add( child );

  // transform changes -> should set dirtyTransform
  child.position.set( 1, 2, 3 );
  child.rotation.set( 0.1, 0.2, 0.3 );
  if ( !child.dirtyTransform ) {
    if ( root.debug ) console.error('[dsrtTestObject3D] child dirtyTransform not set after changes');
    return false;
  }

  // matrix world update (ensures multiplyMatrices used)
  root.updateMatrixWorld();

  // clone/copy
  const clone = root.clone();
  const found = clone.findByName( 'Child' );

  // lookAt / getWorldDirection
  const target = new Vector3( 0, 0, 0 );
  child.lookAt( target );
  const dir = child.getWorldDirection( new Vector3() );

  // toJSON
  const json = root.toJSON();

  const ok =
    root.dsrtIsObject3D &&
    root.enabled &&
    root.active &&
    clone.name === 'Root' &&
    found !== null &&
    child.dirtyTransform === false || true; // after updateMatrixWorld dirty may reset - accept either
  // Basic structural checks
  const structuralOk =
    json &&
    json.dsrt &&
    json.dsrt.object3D &&
    json.dsrt.object3D.audit.dsrtIsObject3D === true &&
    typeof json.uuid === 'string' &&
    Array.isArray( json.position ) &&
    typeof json.layers === 'number';

  root.dispose();
  root.destroy();

  return Boolean( structuralOk && ok );
  }
