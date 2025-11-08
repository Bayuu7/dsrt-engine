// ===========================================================
// Group.js
// Core hierarchical container node
// ===========================================================

import { Object3D } from './Object3D.js';

/**
 * Group
 *
 * A Group is a convenience subclass of Object3D that acts as a logical
 * container for other Object3D instances. It has no additional transform
 * behavior beyond Object3D but provides semantic clarity and a place to
 * attach group-level metadata, behaviors, or batch operations.
 *
 * Design goals:
 *  - Lightweight and predictable: Group should be a minimal wrapper.
 *  - Explicit lifecycle: inherits Object3D lifecycle (init/update/destroy).
 *  - Safe cloning and serialization consistent with Object3D.
 *
 * NOTES:
 *  - Class name is natural: "Group".
 *  - Internal engine audit flag (dsrtIsGroup) is present for tooling and serialization.
 */
class Group extends Object3D {

  /**
   * Construct a new Group.
   * @param {Object} [options] - optional settings: { name, debug, enabled, active }
   */
  constructor( options = {} ) {
    super( options );

    /**
     * Internal audit flag indicating this is a Group.
     * Used by serialization, editors, and automated tools.
     * @type {boolean}
     * @readonly
     */
    this.dsrtIsGroup = true;

    /**
     * Natural runtime type string. Used in toJSON() and debugging output.
     * @type {string}
     */
    this.type = 'Group';

    /**
     * Optional user metadata store for editor or runtime use.
     * @type {Object}
     */
    this.userData = options.userData ?? {};

    if ( this.debug ) console.log( `[Group] created "${this.name || this.uuid}"` );
  }

  // -----------------------------
  // Lifecycle (inherits init/update/destroy from Object3D)
  // -----------------------------

  /**
   * Optional per-frame update hook; calls Object3D.update by default.
   * Override in subclasses to add group-specific behavior.
   * @param {number} delta - seconds since last frame
   * @returns {this}
   */
  update( delta ) {
    // Default behavior: propagate to children using parent implementation
    return super.update( delta );
  }

  /**
   * Performs deep copy from source group into this group.
   * Ensures audit flags and type are preserved.
   *
   * @param {Group} source
   * @param {boolean} [recursive=true]
   * @returns {Group} this
   */
  copy( source, recursive = true ) {
    super.copy( source, recursive );

    // Ensure group-specific flags are restored
    this.dsrtIsGroup = true;
    this.type = 'Group';
    this.userData = JSON.parse( JSON.stringify( source.userData ?? {} ) );

    return this;
  }

  /**
   * Clone this Group into a new Group instance.
   * @param {boolean} [recursive=true] - clone children recursively
   * @returns {Group}
   */
  clone( recursive = true ) {
    return new Group().copy( this, recursive );
  }

  /**
   * Serialize Group to JSON, adding group audit metadata.
   * @param {Object} [meta]
   * @returns {Object} JSON-compatible representation
   */
  toJSON( meta ) {
    const base = super.toJSON( meta );
    // Ensure dsrt block exists
    base.dsrt = base.dsrt || {};
    base.dsrt.group = {
      metadata: {
        type: 'Group',
        createdAt: ( new Date() ).toISOString()
      },
      audit: {
        dsrtIsGroup: true
      }
    };
    // Attach userData in a safe manner
    base.object = base.object || {};
    base.object.userData = this.userData ?? {};
    return base;
  }

  /**
   * Dispose group resources and optionally dispose children.
   * Overrides Object3D.dispose if specific group-level cleanup required.
   *
   * @param {boolean} [recursive=true]
   */
  dispose( recursive = true ) {
    if ( this.debug ) console.log( `[Group] dispose "${this.name || this.uuid}" recursive=${recursive}` );

    // Default implementation calls children dispose via parent semantics.
    // If Group had its own resources (buffers, helpers), they'd be cleaned here.
    for ( const child of this.children.slice() ) {
      child.dispose?.( recursive );
    }

    // Clear user data if needed (safe shallow clear)
    this.userData = {};

    // Remove from parent but don't destroy children here; parent logic can handle
    this.parent = null;
  }
}

export { Group };

/**
 * Internal test helper for Group.
 * Basic assertions for creation, add/remove, clone, copy, and serialization.
 *
 * @returns {boolean}
 */
export function testGroup() {
  const g = new Group({ debug: false });
  g.name = 'rootGroup';

  // Child objects
  const childA = new Group();
  childA.name = 'childA';

  const childB = new Group();
  childB.name = 'childB';

  g.add( childA );
  g.add( childB );

  // Clone and check
  const clone = g.clone();
  const json = g.toJSON();

  const ok =
    g.dsrtIsGroup === true &&
    g.type === 'Group' &&
    g.children.length === 2 &&
    clone instanceof Group &&
    clone.children.length === 2 &&
    json.dsrt?.group?.audit?.dsrtIsGroup === true &&
    typeof json.dsrt.group.metadata.createdAt === 'string';

  // Cleanup
  g.dispose( true );
  g.destroy();

  return Boolean( ok && g.destroyed );
}
