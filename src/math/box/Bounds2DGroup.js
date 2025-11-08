/**
 * Manages a collection of Bounds2D instances.
 * Supports batch operations, spatial queries, and lifecycle management.
 */
class Bounds2DGroup {
	constructor(label = 'Group') {
		this.label = label;
		this._members = new Set();
		this._version = 0;
	}

	/**
	 * Adds a Bounds2D to the group.
	 * @param {Bounds2D} bounds
	 */
	add(bounds) {
		this._members.add(bounds);
		this._version++;
	}

	/**
	 * Removes a Bounds2D from the group.
	 * @param {Bounds2D} bounds
	 */
	remove(bounds) {
		this._members.delete(bounds);
		this._version++;
	}

	/**
	 * Removes all Bounds2D from the group.
	 */
	clear() {
		this._members.clear();
		this._version++;
	}

	/**
	 * Returns all Bounds2D currently in the group.
	 * @returns {Array<Bounds2D>}
	 */
	all() {
		return Array.from(this._members);
	}

	/**
	 * Returns a union of all bounds in the group.
	 * @returns {Bounds2D}
	 */
	unionAll() {
		const result = new Bounds2D();
		for (const b of this._members) {
			if (!b.isEmpty) result.union(b);
		}
		return result;
	}

	/**
	 * Returns an intersection of all bounds in the group.
	 * If no overlap, returns empty bounds.
	 * @returns {Bounds2D}
	 */
	intersectAll() {
		const result = new Bounds2D();
		let first = true;
		for (const b of this._members) {
			if (b.isEmpty) continue;
			if (first) {
				result.copy(b);
				first = false;
			} else {
				result.intersect(b);
			}
		}
		return result;
	}

	/**
	 * Returns all bounds that contain the given point.
	 * @param {Vec2} point
	 * @returns {Array<Bounds2D>}
	 */
	queryPoint(point) {
		const results = [];
		for (const b of this._members) {
			if (!b.isEmpty && b.containsPoint(point)) {
				results.push(b);
			}
		}
		return results;
	}

	/**
	 * Returns current mutation version of the group.
	 */
	getVersion() {
		return this._version;
	}
}
