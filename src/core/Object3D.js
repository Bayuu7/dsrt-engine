import { EventDispatcher } from './EventDispatcher.js';
import { Vector3 } from '../math/Vector3.js';
import { Quaternion } from '../math/Quaternion.js';
import { Euler } from '../math/Euler.js';
import { Matrix4 } from '../math/Matrix4.js';
import { Matrix3 } from '../math/Matrix3.js';
import { Layers } from './Layers.js';
import { generateUUID } from '../math/MathUtils.js';

let _object3DId = 0;

/**
 * DSRT.Object3D
 * Base class for all transformable objects in DSRT.
 * Provides position, rotation, scale, hierarchy, and lifecycle.
 *
 * @augments EventDispatcher
 */
class Object3D extends EventDispatcher {

  /**
   * Constructs a new DSRT object.
   * @param {object} [options={}] - DSRT options { enabled, active, debug }.
   */
  constructor( options = {} ) {
    super();

    /**
     * DSRT audit identity.
     * Used for runtime type testing, serialization tagging, and onboarding clarity.
     *
     * @type {boolean}
     * @readonly
     */
    this.dsrtIsObject3D = true;

    /**
     * Legacy parity flag for compatibility.
     * @type {boolean}
     * @readonly
     */
    this.isObject3D = true;

    /**
     * Unique numeric ID for internal tracking.
     * @type {number}
     * @readonly
     */
    Object.defineProperty( this, 'id', { value: _object3DId++ } );

    /**
     * Globally unique identifier for serialization and referencing.
     * @type {string}
     * @readonly
     */
    this.uuid = generateUUID();

    /**
     * Optional name for identification.
     * @type {string}
     */
    this.name = '';

    /**
     * Type string for serialization and inspection.
     * @type {string}
     */
    this.type = 'Object3D';

    /**
     * Parent object in the scene graph.
     * @type {Object3D|null}
     */
    this.parent = null;

    /**
     * Child objects in the scene graph.
     * @type {Array<Object3D>}
     */
    this.children = [];

    /**
     * Up direction used for lookAt and orientation.
     * @type {Vector3}
     */
    this.up = Object3D.DEFAULT_UP.clone();

    /**
     * Local position of the object.
     * @type {Vector3}
     */
    this.position = new Vector3();

    /**
     * Local rotation in Euler angles.
     * @type {Euler}
     */
    this.rotation = new Euler();

    /**
     * Local rotation in quaternion form.
     * @type {Quaternion}
     */
    this.quaternion = new Quaternion();

    /**
     * Local scale of the object.
     * @type {Vector3}
     */
    this.scale = new Vector3( 1, 1, 1 );

    this.rotation._onChange( () => this.quaternion.setFromEuler( this.rotation, false ) );
    this.quaternion._onChange( () => this.rotation.setFromQuaternion( this.quaternion, undefined, false ) );

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
     * Model-view matrix used in rendering.
     * @type {Matrix4}
     */
    this.modelViewMatrix = new Matrix4();

    /**
     * Normal matrix used in lighting calculations.
     * @type {Matrix3}
     */
    this.normalMatrix = new Matrix3();

    /**
     * Whether to auto-update local matrix from position/rotation/scale.
     * @type {boolean}
     */
    this.matrixAutoUpdate = Object3D.DEFAULT_MATRIX_AUTO_UPDATE;

    /**
     * Whether to auto-update world matrix from hierarchy.
     * @type {boolean}
     */
    this.matrixWorldAutoUpdate = Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE;

    /**
     * Whether world matrix needs update this frame.
     * @type {boolean}
     */
    this.matrixWorldNeedsUpdate = false;

    /**
     * Layer mask for visibility and raycasting.
     * @type {Layers}
     */
    this.layers = new Layers();

    /**
     * Whether object is visible in rendering.
     * @type {boolean}
     */
    this.visible = true;

    /**
     * Whether object casts shadows.
     * @type {boolean}
     */
    this.castShadow = false;

    /**
     * Whether object receives shadows.
     * @type {boolean}
     */
    this.receiveShadow = false;

    /**
     * Whether object is culled by frustum.
     * @type {boolean}
     */
    this.frustumCulled = true;

    /**
     * Render order override.
     * @type {number}
     */
    this.renderOrder = 0;

    /**
     * Animation clips attached to this object.
     * @type {Array<AnimationClip>}
     */
    this.animations = [];

    /**
     * Custom depth material for shadow rendering.
     * @type {Material|undefined}
     */
    this.customDepthMaterial = undefined;

    /**
     * Custom distance material for point light shadows.
     * @type {Material|undefined}
     */
    this.customDistanceMaterial = undefined;

    /**
     * Arbitrary user data.
     * @type {object}
     */
    this.userData = {};

    /**
     * Whether object is enabled in DSRT runtime.
     * @type {boolean}
     */
    this.enabled = options.enabled ?? true;

    /**
     * Whether object is active and live.
     * @type {boolean}
     */
    this.active = options.active ?? true;

    /**
     * Whether object has been destroyed.
     * @type {boolean}
     */
    this.destroyed = false;

    /**
     * Whether debug logging is enabled.
     * @type {boolean}
     */
    this.debug = !!options.debug;
  }

  /**
   * Marks object as initialized and active.
   * Sets `enabled = true`, `active = true`.
   * @return {boolean}
   */
  init() {
    this.enabled = true;
    this.active = true;
    return true;
  }

  /**
   * Runtime update hook.
   * Called every frame if `enabled && active`.
   * @param {number} delta - Time step in seconds.
   * @return {null}
   */
  update( delta ) {
    if ( this.debug ) console.log( '[DSRT.Object3D] update', delta );
    return null;
  }

  /**
   * Marks object as destroyed.
   * Sets `enabled = false`, `active = false`, `destroyed = true`.
   * @return {boolean}
   */
  destroy() {
    this.enabled = false;
    this.active = false;
    this.destroyed = true;
    return true;
  }

  /**
   * Serializes object into DSRT-compatible JSON.
   * Includes audit identity, lifecycle flags, and transform data.
   * @param {object} meta
   * @return {object}
   */
  toJSON( meta ) {
    return {
      uuid: this.uuid,
      type: this.type,
      name: this.name,
      position: this.position.toArray(),
      rotation: this.rotation.toArray(),
      quaternion: this.quaternion.toArray(),
      scale: this.scale.toArray(),
      visible: this.visible,
      castShadow: this.castShadow,
      receiveShadow: this.receiveShadow,
      renderOrder: this.renderOrder,
      userData: this.userData,
      children: this.children.map( c => c.uuid ),
      dsrt: {
        object3D: {
          metadata: { type: 'DSRT.Object3D', version: '1.0.0' },
          audit: { dsrtIsObject3D: this.dsrtIsObject3D },
          flags: {
            enabled: this.enabled,
            active: this.active,
            destroyed: this.destroyed,
            debug: this.debug
          }
        }
      }
    };
  }
}

Object3D.DEFAULT_UP = new Vector3( 0, 1, 0 );
Object3D.DEFAULT_MATRIX_AUTO_UPDATE = true;
Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = true;

export { Object3D };

/**
 * DSRT test hook to validate lifecycle and serialization.
 * Creates an Object3D, runs lifecycle, serializes, and checks audit flags.
 * @return {boolean}
 */
export function dsrtTestObject3D() {
  const obj = new Object3D( { debug: true } );
  obj.init();
  const json = obj.toJSON();
  const ok =
    obj.dsrtIsObject3D &&
    obj.enabled && obj.active &&
    json && json.dsrt && json.dsrt.object3D &&
    json.dsrt.object3D.audit.dsrtIsObject3D === true &&
    typeof json.uuid === 'string' &&
    Array.isArray( json.position );
    obj.destroy();
  return Boolean( ok && obj.destroyed );
}
