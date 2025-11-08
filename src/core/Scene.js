// =====================================
// Scene.js
// Engine Core v1.0
// =====================================

import { Object3D } from './Object3D.js';
import { Euler } from '../math/Euler.js';
import { Color } from '../math/Color.js';
import { Texture } from '../core/Texture.js'; // placeholder path
import { Fog } from './Fog.js';               // placeholder path
import { Material } from './Material.js';     // placeholder path
import { generateUUID } from '../utils/UUID.js';

/**
 * Scene
 *
 * The Scene class is the **root container** for every renderable or logical
 * object in the engine. A Scene manages:
 *  - hierarchical objects (Object3D tree)
 *  - environment/global visuals (background, environment map, fog)
 *  - override material (for special rendering passes)
 *  - per-frame propagation of update() calls
 *
 * Important design goals:
 *  - explicit lifecycle: init(), update(), render hooks via renderer, dispose()
 *  - exhaustive metadata for serialization and auditing (internal engine id)
 *  - defensive programming: type checks, safe clones, minimal side effects
 *
 * NOTE: class name is natural (Scene). Internal engine audit flags start with "dsrt".
 */
class Scene extends Object3D {

  /**
   * Create a Scene.
   * @param {Object} [options] - Optional settings:
   *    { boolean debug, boolean active, boolean enabled, string name }
   */
  constructor( options = {} ) {
    super( options );

    // Basic identity
    this.name = options.name || 'Scene';
    this.uuid = generateUUID();

    // Audit flags (internal engine namespace)
    this.dsrtIsScene = true;   // marks this object as an engine Scene
    this.type = 'Scene';       // natural runtime type string

    // Lifecycle & control booleans
    this.enabled = options.enabled ?? true;    // participates in update/render
    this.active = options.active ?? true;      // semantically "active scene"
    this.destroyed = false;                    // cleaned up
    this.debug = !!options.debug;              // toggle console debug logs

    // Scene environment properties
    /** @type {Color|Texture|null} */
    this.background = null;            // background color or texture
    /** @type {Texture|null} */
    this.environment = null;           // environment map (IBL)
    /** @type {Fog|null} */
    this.fog = null;                   // scene fog instance
    /** @type {number} */
    this.backgroundBlurriness = 0.0;   // 0..1, for blurred backgrounds
    /** @type {number} */
    this.backgroundIntensity = 1.0;    // multiplier for background contribution
    /** @type {Euler} */
    this.backgroundRotation = new Euler(); // rotation for environment used as background
    /** @type {number} */
    this.environmentIntensity = 1.0;   // multiplier for envmap lighting
    /** @type {Euler} */
    this.environmentRotation = new Euler();

    // Override material for special passes (e.g. depth-only, selection)
    /** @type {Material|null} */
    this.overrideMaterial = null;

    // Performance / bookkeeping
    this._createdAt = new Date().toISOString();
    this._objectsByUUID = new Map(); // fast lookup map of nodes in this scene

    if ( this.debug ) console.log(`[Scene] created "${this.name}" uuid=${this.uuid}`);
  }

  // -----------------------------
  // Lifecycle: init / update / destroy
  // -----------------------------

  /**
   * Initialize scene. Calls init() on children if available.
   * Returns this for chaining.
   */
  init() {
    if ( this.debug ) console.log(`[Scene] init "${this.name}"`);
    this.enabled = true;
    this.active = true;

    // Initialize children recursively
    for ( const child of this.children ) {
      if ( typeof child.init === 'function' ) child.init();
      this._registerObjectRecursive( child );
    }

    return this;
  }

  /**
   * Update the scene and all its children.
   * Called by Engine.update(deltaTime).
   * - Respects enabled/active flags
   * - Propagates updates in a deterministic order (insertion order)
   *
   * @param {number} deltaTime - seconds since last frame
   */
  update( deltaTime ) {
    if ( !this.enabled || !this.active ) return;

    if ( this.debug ) console.log(`[Scene] update "${this.name}" dt=${deltaTime}`);

    // Propagate update to children
    for ( const child of this.children ) {
      if ( child.enabled === false ) continue;
      if ( typeof child.update === 'function' ) child.update( deltaTime );
    }
  }

  /**
   * Called by Renderer during the render pass.
   * Should not itself issue draw calls; instead, the renderer queries the scene.
   * This method is a hook to let the scene prepare any per-frame state for rendering.
   *
   * @param {Renderer} renderer
   */
  preRender( renderer ) {
    // Example: update environment matrices, update IBL if dynamic, etc.
    if ( this.debug ) {
      // Keep preRender inexpensive; heavy work belongs in renderer or scheduled tasks.
      console.log(`[Scene] preRender "${this.name}"`);
    }
  }

  /**
   * Post-render hook called by Renderer after drawing the scene.
   * Useful for post-processing bookkeeping.
   *
   * @param {Renderer} renderer
   */
  postRender( renderer ) {
    if ( this.debug ) console.log(`[Scene] postRender "${this.name}"`);
  }

  /**
   * Dispose scene resources and optionally traverse children to dispose them.
   * After dispose() the scene should be considered unusable unless re-initialized.
   *
   * @param {boolean} [recursive=true] - whether to dispose children recursively
   */
  dispose( recursive = true ) {
    if ( this.debug ) console.log(`[Scene] dispose "${this.name}" recursive=${recursive}`);

    // release background/environment resources (textures, etc.)
    this.background?.dispose?.();
    this.environment?.dispose?.();
    this.overrideMaterial?.dispose?.();

    if ( recursive ) {
      for ( const child of this.children.slice() ) {
        child.dispose?.( true );
      }
    }

    // clear maps and detach references
    this._objectsByUUID.clear();
    this.children.length = 0;
    this.parent = null;
    this.destroyed = true;
  }

  /**
   * Destroy is a semantic alias to dispose (keeps API expressive).
   * After destroy, the Scene should not be used.
   */
  destroy() {
    this.dispose( true );
    this.enabled = false;
    this.active = false;
    if ( this.debug ) console.log(`[Scene] destroyed "${this.name}"`);
  }

  // -----------------------------
  // Add / Remove / Traversal
  // -----------------------------

  /**
   * Add an object to the scene.
   * - sets object's parent
   * - registers object (fast lookup)
   * - triggers onAdd hook if present
   *
   * Defensive: rejects null, self, or objects already added to prevent cycles.
   *
   * @param {Object3D} object
   * @returns {this}
   */
  add( object ) {
    if ( !object || object === this ) return this;

    // Prevent adding root that already exists in this tree
    if ( object.parent === this ) return this;

    // remove from previous parent safely
    if ( object.parent ) object.removeFromParent();

    object.parent = this;
    this.children.push( object );
    this._registerObjectRecursive( object );
    object.onAdd?.( this );

    if ( this.debug ) console.log(`[Scene] add "${object.name || object.uuid}" to "${this.name}"`);

    return this;
  }

  /**
   * Remove object from scene.
   * - removes parent reference
   * - unregisters object and its descendants
   * - triggers onRemove hook
   *
   * @param {Object3D} object
   * @returns {this}
   */
  remove( object ) {
    const index = this.children.indexOf( object );
    if ( index !== -1 ) {
      object.parent = null;
      this.children.splice( index, 1 );
      this._unregisterObjectRecursive( object );
      object.onRemove?.( this );
      if ( this.debug ) console.log(`[Scene] remove "${object.name || object.uuid}" from "${this.name}"`);
    }
    return this;
  }

  /**
   * Find first object by name (depth-first search).
   * Returns null if not found.
   *
   * @param {string} name
   * @returns {Object3D|null}
   */
  findByName( name ) {
    for ( const child of this.children ) {
      if ( child.name === name ) return child;
      if ( typeof child.findByName === 'function' ) {
        const found = child.findByName( name );
        if ( found ) return found;
      }
    }
    return null;
  }

  /**
   * Get object by UUID from internal registry (O(1)).
   * Returns null if not found.
   *
   * @param {string} uuid
   * @returns {Object3D|null}
   */
  getObjectByUUID( uuid ) {
    return this._objectsByUUID.get( uuid ) || null;
  }

  // -----------------------------
  // Internal registration helpers
  // -----------------------------

  /**
   * Registers an object and its descendants into the internal UUID map.
   * Called when objects are added to the scene.
   *
   * @param {Object3D} object
   * @private
   */
  _registerObjectRecursive( object ) {
    if ( !object || !object.uuid ) return;
    this._objectsByUUID.set( object.uuid, object );
    for ( const child of object.children || [] ) {
      this._registerObjectRecursive( child );
    }
  }

  /**
   * Unregister object and descendants from internal registry.
   *
   * @param {Object3D} object
   * @private
   */
  _unregisterObjectRecursive( object ) {
    if ( !object || !object.uuid ) return;
    this._objectsByUUID.delete( object.uuid );
    for ( const child of object.children || [] ) {
      this._unregisterObjectRecursive( child );
    }
  }

  // -----------------------------
  // Copy / Clone / Serialization
  // -----------------------------

  /**
   * Copy scene data from source scene into this instance.
   * Shallow copies of textures/materials are preserved; clones are attempted if supported.
   *
   * @param {Scene} source
   * @param {boolean} [recursive=true]
   * @returns {Scene} this
   */
  copy( source, recursive = true ) {
    super.copy( source, recursive );

    this.background = source.background?.clone?.() ?? source.background;
    this.environment = source.environment?.clone?.() ?? source.environment;
    this.fog = source.fog?.clone?.() ?? source.fog;

    this.backgroundBlurriness = source.backgroundBlurriness;
    this.backgroundIntensity = source.backgroundIntensity;
    this.backgroundRotation.copy?.( source.backgroundRotation );

    this.environmentIntensity = source.environmentIntensity;
    this.environmentRotation.copy?.( source.environmentRotation );

    this.overrideMaterial = source.overrideMaterial?.clone?.() ?? source.overrideMaterial;

    this.enabled = source.enabled;
    this.active = source.active;
    this.debug = source.debug;

    return this;
  }

  /**
   * Clone this scene into a new instance.
   * Note: cloning a Scene with a full object graph can be expensive.
   *
   * @param {boolean} [recursive=true]
   * @returns {Scene}
   */
  clone( recursive = true ) {
    const newScene = new Scene({ debug: this.debug });
    return newScene.copy( this, recursive );
  }

  /**
   * Serialize to JSON with DSRT metadata for auditing.
   * The returned structure is purposely explicit to allow robust deserialization.
   *
   * @param {object} [meta]
   * @returns {object} JSON-serializable data
   */
  toJSON( meta = {} ) {
    const base = super.toJSON( meta );

    base.object = base.object || {};
    base.object.backgroundBlurriness = this.backgroundBlurriness;
    base.object.backgroundIntensity = this.backgroundIntensity;
    base.object.backgroundRotation = this.backgroundRotation.toArray?.() ?? null;

    base.object.environmentIntensity = this.environmentIntensity;
    base.object.environmentRotation = this.environmentRotation.toArray?.() ?? null;

    base.object.backgroundType = this.background?.constructor?.name ?? null;
    base.object.backgroundUUID = this.background?.uuid ?? null;

    base.object.environmentType = this.environment?.constructor?.name ?? null;
    base.object.environmentUUID = this.environment?.uuid ?? null;

    base.object.overrideMaterialUUID = this.overrideMaterial?.uuid ?? null;

    if ( this.fog ) base.object.fog = this.fog.toJSON?.() ?? null;

    base.dsrt = {
      ...( base.dsrt || {} ),
      scene: {
        metadata: {
          engine: 'DSRT',             // internal engine name
          type: 'Scene',
          version: '1.0',
          createdAt: this._createdAt
        },
        audit: {
          dsrtIsScene: true,
          uuid: this.uuid
        },
        flags: {
          enabled: this.enabled,
          active: this.active,
          destroyed: this.destroyed,
          debug: this.debug
        }
      }
    };

    return base;
  }
}

// Export natural class name
export { Scene };

/**
 * Internal test helper: quick validation for Scene base behavior.
 * Returns boolean true if basic checks pass.
 */
export function testScene() {
  const scene = new Scene({ debug: false });
  scene.init();

  const group = new Object3D();
  group.name = 'ChildGroup';
  scene.add( group );

  const clone = scene.clone();
  const json = scene.toJSON();

  const ok =
    scene.dsrtIsScene === true &&
    scene.enabled === true &&
    clone instanceof Scene &&
    typeof json.dsrt?.scene?.metadata?.createdAt === 'string' &&
    scene.getObjectByUUID( group.uuid ) === group;

  scene.destroy();

  return Boolean( ok && scene.destroyed );
}
