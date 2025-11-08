import { Object3D } from '../core/Object3D.js';

/**
 * DSRT.Group
 * A semantic subclass of {@link Object3D} used to group multiple objects.
 * Behaves identically to Object3D but clarifies intent in scene graphs.
 *
 * @class
 * @extends Object3D
 * @memberof DSRT
 * @since DSRT 1.1.1
 */
class Group extends Object3D {

  static VERSION = '1.1.1';

  constructor(options = {}) {
    super(options);

    /** @readonly */
    this.dsrtIsGroup = true;

    /** @readonly */
    this.isGroup = true;

    /** @type {string} */
    this.type = 'Group';
  }

  /**
   * Override clone to ensure Group instance and debug flags are preserved.
   * @param {boolean} [recursive=true]
   * @return {Group}
   */
  clone(recursive = true) {
    const clone = new Group({ debug: this.debug });
    clone.copy(this, recursive);
    return clone;
  }

  /**
   * Override toJSON to include dsrtIsGroup audit flag and metadata.
   * @param {object} [meta]
   * @return {object}
   */
  toJSON(meta) {
    const base = super.toJSON(meta);
    base.dsrt.object3D.audit.dsrtIsGroup = true;
    base.dsrt.object3D.metadata.type = 'DSRT.Group';
    base.dsrt.object3D.metadata.revision = Group.VERSION;
    base.dsrt.object3D.metadata.createdAt = Date.now();
    return base;
  }

  /**
   * Override dispose to trigger onRemove for children before clearing.
   * @param {boolean} [recursive=true]
   */
  dispose(recursive = true) {
    this.dispatchEvent({ type: 'dispose', name: this.name, uuid: this.uuid, target: this });
    if (this.debug) console.log(`[DSRT.Group] dispose '${this.name || this.uuid}' (recursive=${recursive})`);

    this.customDepthMaterial?.dispose?.();
    this.customDistanceMaterial?.dispose?.();

    if (recursive) {
      for (const child of this.children.slice()) {
        child.onRemove?.(this);
        child.dispatchEvent?.({ type: 'removed', parent: this });
        child.dispose?.(true);
      }
    }

    this.parent = null;
    this.children.length = 0;
    this.destroyed = true;
    this.dirtyTransform = false;
  }
}

export { Group };

/**
 * DSRT test hook to validate Group inheritance, lifecycle, and serialization.
 * @function
 * @memberof DSRT
 * @since DSRT 1.1.1
 * @return {boolean}
 */
export function dsrtTestGroup() {
  const group = new Group({ debug: true });
  group.name = 'TestGroup';
  group.init();

  const child = new Group();
  child.name = 'ChildGroup';
  group.add(child);

  const clone = group.clone();
  const json = group.toJSON();

  const ok =
    group.dsrtIsGroup &&
    group.dsrtIsObject3D &&
    group.enabled &&
    group.active &&
    clone instanceof Group &&
    clone.type === 'Group' &&
    clone.children.length === 1 &&
    json &&
    json.type === 'Group' &&
    json.dsrt?.object3D?.audit?.dsrtIsGroup === true &&
    json.dsrt?.object3D?.metadata?.revision === Group.VERSION &&
    typeof json.dsrt.object3D.metadata.createdAt === 'number';

  group.dispose();
  group.destroy();

  return Boolean(ok && group.destroyed);
}
