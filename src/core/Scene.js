import { Object3D } from '../core/Object3D.js';
import { Euler } from '../math/Euler.js';
import { Color } from '../math/Color.js';
import { Texture } from '../textures/Texture.js';
import { Fog } from '../scenes/Fog.js';
import { Material } from '../materials/Material.js';
import { DSRT } from '../dsrt.config.js';

/**
 * DSRT.Scene
 * Root container for all renderable objects in DSRT.
 * Holds background, environment, fog, and override material.
 *
 * @class
 * @extends Object3D
 * @memberof DSRT
 * @since DSRT 1.0
 */
class Scene extends Object3D {

  /**
   * Constructs a new DSRT scene.
   * @param {object} [options={}] - DSRT options { enabled, active, debug }.
   */
  constructor( options = {} ) {
    super( options );

    /** @readonly */
    this.dsrtIsScene = true;
    /** @readonly */
    this.isScene = true;

    this.type = 'Scene';

    /** @type {Color|Texture|null} */
    this.background = null;

    /** @type {Texture|null} */
    this.environment = null;

    /** @type {Fog|null} */
    this.fog = null;

    /** @type {number} */
    this.backgroundBlurriness = 0;

    /** @type {number} */
    this.backgroundIntensity = 1;

    /** @type {Euler} */
    this.backgroundRotation = new Euler();

    /** @type {number} */
    this.environmentIntensity = 1;

    /** @type {Euler} */
    this.environmentRotation = new Euler();

    /** @type {Material|null} */
    this.overrideMaterial = null;
  }

  /**
   * DSRT lifecycle: mark scene initialized/active.
   * @return {Scene}
   */
  init() {
    super.init();
    return this;
  }

  /**
   * DSRT lifecycle: update scene and children.
   * @param {number} delta
   * @return {Scene}
   */
  update( delta ) {
    super.update( delta );
    for ( const child of this.children ) {
      if ( child.update ) child.update( delta );
    }
    return this;
  }

  /**
   * DSRT lifecycle: teardown and mark destroyed.
   * @return {Scene}
   */
  destroy() {
    super.destroy();
    return this;
  }

  /**
   * Optional cleanup hook for GPU resources.
   * Disposes background/environment textures if disposable.
   */
  dispose() {
    if ( this.debug ) console.log( '[DSRT.Scene] dispose() called' );
    this.background?.dispose?.();
    this.environment?.dispose?.();
    this.overrideMaterial?.dispose?.();
  }

  /**
   * Copies values from another scene.
   * @param {Scene} source
   * @param {boolean} recursive
   * @return {Scene}
   */
  copy( source, recursive ) {
    super.copy( source, recursive );

    this.background = source.background?.clone?.() ?? source.background;
    this.environment = source.environment?.clone?.() ?? source.environment;
    this.fog = source.fog?.clone?.() ?? source.fog;

    this.backgroundBlurriness = source.backgroundBlurriness;
    this.backgroundIntensity = source.backgroundIntensity;
    this.backgroundRotation.copy( source.backgroundRotation );

    this.environmentIntensity = source.environmentIntensity;
    this.environmentRotation.copy( source.environmentRotation );

    this.overrideMaterial = source.overrideMaterial?.clone?.() ?? source.overrideMaterial;

    // Copy lifecycle flags
    this.enabled = source.enabled;
    this.active = source.active;
    this.destroyed = source.destroyed;
    this.debug = source.debug;

    return this;
  }

  /**
   * DSRT serialization addon: include DSRT metadata and audit identity.
   * @param {object} meta
   * @return {object}
   */
  toJSON( meta ) {
    const data = super.toJSON( meta );

    data.object.backgroundBlurriness = this.backgroundBlurriness;
    data.object.backgroundIntensity = this.backgroundIntensity;
    data.object.backgroundRotation = this.backgroundRotation.toArray();
    data.object.backgroundType = this.background?.constructor?.name ?? null;
    data.object.backgroundUUID = this.background?.uuid ?? null;

    data.object.environmentIntensity = this.environmentIntensity;
    data.object.environmentRotation = this.environmentRotation.toArray();
    data.object.environmentType = this.environment?.constructor?.name ?? null;
    data.object.environmentUUID = this.environment?.uuid ?? null;

    data.object.overrideMaterialUUID = this.overrideMaterial?.uuid ?? null;

    if ( this.fog ) data.object.fog = this.fog.toJSON?.() ?? null;

    data.dsrt = {
      ...(data.dsrt || {}),
      scene: {
        metadata: { type: 'DSRT.Scene', version: DSRT.VERSION },
        audit: { dsrtIsScene: this.dsrtIsScene },
        flags: {
          enabled: this.enabled,
          active: this.active,
          destroyed: this.destroyed,
          debug: this.debug
        }
      }
    };

    return data;
  }
}

export { Scene };

/**
 * DSRT test hook to verify lifecycle, copy, dispose, and serialization.
 * @return {boolean} ok
 */
export function dsrtTestScene() {
  const scene = new Scene( { debug: true } );
  scene.init();

  const clone = new Scene().copy( scene );
  const json = scene.toJSON();

  const ok =
    scene.dsrtIsScene &&
    scene.enabled && scene.active &&
    clone.enabled === scene.enabled &&
    clone.backgroundBlurriness === scene.backgroundBlurriness &&
    json && json.dsrt && json.dsrt.scene &&
    json.dsrt.scene.audit.dsrtIsScene === true &&
    typeof json.uuid === 'string' &&
    Array.isArray( json.object.backgroundRotation ) &&
    typeof json.object.environmentIntensity === 'number' &&
    typeof json.object.backgroundType === 'string';

  scene.dispose();
  scene.destroy();

  return Boolean( ok && scene.destroyed );
}
