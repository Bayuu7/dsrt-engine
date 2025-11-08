/**
 * Spatial registry for Bounds2D instances.
 * Supports registration, removal, spatial queries, and overlap detection.
 */
class Bounds2DSpatialMap {
	constructor() {
		this._registry = new Set();
		this._version = 0;
	}

	/**
	 * Registers a Bounds2D instance to the spatial map.
	 * Automatically listens for removal and mutation.
	 * @param {Bounds2D} bounds
	 */
	register(bounds) {
		this._registry.add(bounds);
		this._version++;
		bounds.registerPlugin({
			onEvent: (event, payload, source) => {
				if (event === 'removed') this._registry.delete(source);
				if (event === 'modified') this._version++;
			}
		});
	}

	/**
	 * Removes a Bounds2D instance from the spatial map.
	 * @param {Bounds2D} bounds
	 */
	unregister(bounds) {
		this._registry.delete(bounds);
		this._version++;
	}

	/**
	 * Returns all Bounds2D instances that intersect the given region.
	 * @param {Bounds2D} region
	 * @returns {Array<Bounds2D>}
	 */
	query(region) {
		const results = [];
		for (const bounds of this._registry) {
			if (!bounds.isEmpty && bounds.intersects(region)) {
				results.push(bounds);
			}
		}
		return results;
	}

	/**
	 * Returns all Bounds2D instances that contain the given point.
	 * @param {Vec2} point
	 * @returns {Array<Bounds2D>}
	 */
 queryPoint(point) {
		const results = [];
		for (const bounds of this._registry) {
			if (!bounds.isEmpty && bounds.containsPoint(point)) {
				results.push(bounds);
			}
		}
		return results;
	}

	/**
	 * Returns all Bounds2D instances currently registered.
	 * @returns {Array<Bounds2D>}
	 */
	all() {
		return Array.from(this._registry);
	}

	/**
	 * Returns the current mutation version of the map.
	 * Useful for cache invalidation.
	 */
	getVersion() {
		return this._version;
	}
}

export { Bounds2DSpatialMap };
