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
 * @since DSRT 1.1
 */
class Scene extends Object3D {

  constructor( options = {} ) {
    super( options );

    /** @readonly */
    this.dsrtIsScene = true;
    /** @readonly */
    this.isScene = true;

    this.type = 'Scene';

    this.background = null;
    this.environment = null;
    this.fog = null;

    this.backgroundBlurriness = 0;
    this.backgroundIntensity = 1;
    this.backgroundRotation = new Euler();

    this.environmentIntensity = 1;
    this.environmentRotation = new Euler();

    this.overrideMaterial = null;
  }

  clone( recursive = true ) {
    return new Scene().copy( this, recursive );
  }

  dispose( recursive = true ) {
    this.dispatchEvent({ type: 'dispose', name: this.name, uuid: this.uuid });
    if ( this.debug ) console.log( `[DSRT.Scene] dispose '${this.name || this.uuid}' (recursive=${recursive})` );

    this.background?.dispose?.();
    this.environment?.dispose?.();
    this.overrideMaterial?.dispose?.();

    if ( recursive ) {
      for ( const child of this.children.slice() ) {
        child.onRemove?.( this );
        child.dispose?.( true );
      }
    }

    this.parent = null;
    this.children.length = 0;
    this.destroyed = true;
    this.dirtyTransform = false;
  }

  copy( source, recursive = true ) {
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

    this.enabled = source.enabled;
    this.active = source.active;
    this.destroyed = source.destroyed;
    this.debug = source.debug;

    return this;
  }

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
        metadata: {
          type: 'DSRT.Scene',
          version: DSRT.VERSION,
          revision: 'v1.1',
          createdAt: (new Date()).toISOString()
        },
        audit: {
          dsrtIsScene: this.dsrtIsScene
        },
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
 * @return {boolean}
 */
export function dsrtTestScene() {
  const scene = new Scene({ debug: true });
  scene.name = 'RootScene';
  scene.init();

  const clone = scene.clone();
  const json = scene.toJSON();

  const ok =
    scene.dsrtIsScene &&
    scene.enabled &&
    scene.active &&
    clone instanceof Scene &&
    clone.backgroundBlurriness === scene.backgroundBlurriness &&
    json &&
    json.dsrt &&
    json.dsrt.scene &&
    json.dsrt.scene.audit.dsrtIsScene === true &&
    typeof json.uuid === 'string' &&
    Array.isArray( json.object.backgroundRotation ) &&
    typeof json.object.environmentIntensity === 'number' &&
    typeof json.object.backgroundType === 'string' &&
    typeof json.dsrt.scene.metadata.createdAt === 'string';

  scene.dispose();
  scene.destroy();

  return Boolean( ok && scene.destroyed );
}
