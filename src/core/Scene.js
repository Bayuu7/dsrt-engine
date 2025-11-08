import { Object3D } from '../core/Object3D.js';
import { Euler } from '../math/Euler.js';

/**
 * DSRT.Scene
 * Root container for all renderable objects in DSRT.
 * Holds background, environment, fog, and override material.
 *
 * @augments Object3D
 */
class Scene extends Object3D {

  /**
   * Constructs a new DSRT scene.
   * @param {object} [options={}] - DSRT options { enabled, active, debug }.
   */
  constructor( options = {} ) {
    super( options );

    /**
     * DSRT audit identity.
     * Used for runtime type testing, serialization tagging, and onboarding clarity.
     *
     * @type {boolean}
     * @readonly
     */
    this.dsrtIsScene = true;

    /**
     * Legacy parity flag.
     * @type {boolean}
     * @readonly
     */
    this.isScene = true;

    /**
     * Type string for serialization and inspection.
     * @type {string}
     */
    this.type = 'Scene';

    /**
     * Background of the scene.
     * Can be a Color, Texture, CubeTexture, or null.
     *
     * @type {Color|Texture|null}
     */
    this.background = null;

    /**
     * Environment map for physical materials.
     * Cannot override existing material.envMap.
     *
     * @type {Texture|null}
     */
    this.environment = null;

    /**
     * Fog instance affecting all objects in the scene.
     * Can be Fog or FogExp2.
     *
     * @type {Fog|FogExp2|null}
     */
    this.fog = null;

    /**
     * Blurriness of the background.
     * Only affects environment maps used as background.
     * Range: 0 to 1.
     *
     * @type {number}
     * @default 0
     */
    this.backgroundBlurriness = 0;

    /**
     * Intensity multiplier for background color.
     * Only affects background textures.
     *
     * @type {number}
     * @default 1
     */
    this.backgroundIntensity = 1;

    /**
     * Rotation of the background in radians.
     * Only affects environment maps used as background.
     *
     * @type {Euler}
     * @default (0,0,0)
     */
    this.backgroundRotation = new Euler();

    /**
     * Intensity multiplier for environment lighting.
     * Only affects materials using Scene.environment.
     *
     * @type {number}
     * @default 1
     */
    this.environmentIntensity = 1;

    /**
     * Rotation of the environment map in radians.
     * Only affects physical materials using Scene.environment.
     *
     * @type {Euler}
     * @default (0,0,0)
     */
    this.environmentRotation = new Euler();

    /**
     * Material override for all objects in the scene.
     * Can be bypassed by setting material.allowOverride = false.
     *
     * @type {Material|null}
     */
    this.overrideMaterial = null;
  }

  /**
   * DSRT lifecycle: mark scene initialized/active.
   * @return {boolean}
   */
  init() {
    super.init();
    return true;
  }

  /**
   * DSRT lifecycle: optional runtime hook.
   * @param {number} delta
   * @return {null}
   */
  update( delta ) {
    super.update( delta );
    return null;
  }

  /**
   * DSRT lifecycle: teardown and mark destroyed.
   * @return {boolean}
   */
  destroy() {
    super.destroy();
    return true;
  }

  /**
   * Copies values from another scene.
   * @param {Scene} source
   * @param {boolean} recursive
   * @return {Scene}
   */
  copy( source, recursive ) {
    super.copy( source, recursive );

    if ( source.background ) this.background = source.background.clone();
    if ( source.environment ) this.environment = source.environment.clone();
    if ( source.fog ) this.fog = source.fog.clone();

    this.backgroundBlurriness = source.backgroundBlurriness;
    this.backgroundIntensity = source.backgroundIntensity;
    this.backgroundRotation.copy( source.backgroundRotation );

    this.environmentIntensity = source.environmentIntensity;
    this.environmentRotation.copy( source.environmentRotation );

    if ( source.overrideMaterial ) this.overrideMaterial = source.overrideMaterial.clone();

    this.matrixAutoUpdate = source.matrixAutoUpdate;

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

    data.object.environmentIntensity = this.environmentIntensity;
    data.object.environmentRotation = this.environmentRotation.toArray();

    if ( this.fog ) data.object.fog = this.fog.toJSON();

    data.dsrt = {
      ...(data.dsrt || {}),
      scene: {
        metadata: { type: 'DSRT.Scene', version: '1.0.0' },
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
 * DSRT test hook to verify lifecycle and scene serialization.
 * @return {boolean} ok
 */
export function dsrtTestScene() {
  const scene = new Scene( { debug: true } );
  scene.init();
  const json = scene.toJSON();
  const ok =
    scene.dsrtIsScene &&
    scene.enabled && scene.active &&
    json && json.dsrt && json.dsrt.scene &&
    json.dsrt.scene.audit.dsrtIsScene === true &&
    typeof json.uuid === 'string' &&
    Array.isArray( json.object.backgroundRotation );
  scene.destroy();
  return Boolean( ok && scene.destroyed );
}
