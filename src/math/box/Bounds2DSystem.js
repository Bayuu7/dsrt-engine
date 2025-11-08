/**
 * System for managing Bounds2D lifecycle and synchronization.
 * Automatically updates bounds from Transform2D and registers to spatial map.
 */
class Bounds2DSystem {
	constructor(spatialMap = null) {
		this.spatialMap = spatialMap;
		this._tracked = new Set();
	}

	/**
	 * Attaches a Bounds2D to a Transform2D and optionally registers to spatial map.
	 * @param {Bounds2D} bounds
	 * @param {Transform2D} transform
	 * @param {Vec2} size
	 */
	attach(bounds, transform, size = new Vec2(1, 1)) {
		bounds.debugLabel ||= `Bounds#${Math.floor(Math.random() * 10000)}`;
		bounds._transform = transform;
		bounds._size = size.clone();
		this._tracked.add(bounds);

		if (this.spatialMap) {
			this.spatialMap.register(bounds);
		}

		this.update(bounds);
	}

	/**
	 * Detaches a Bounds2D from the system and spatial map.
	 * @param {Bounds2D} bounds
	 */
	detach(bounds) {
		this._tracked.delete(bounds);
		if (this.spatialMap) {
			this.spatialMap.unregister(bounds);
		}
		bounds._transform = null;
		bounds._size = null;
		bounds.emit?.('detached', bounds);
	}

	/**
	 * Updates all tracked bounds from their transform.
	 */
	updateAll() {
		for (const bounds of this._tracked) {
			this.update(bounds);
		}
	}

	/**
	 * Updates a single Bounds2D from its transform and size.
	 * @param {Bounds2D} bounds
	 */
	update(bounds) {
		const t = bounds._transform;
		const s = bounds._size;
		if (!t || !s) return;

		const half = s.scaled(0.5);
		const center = t.position;
		bounds.set(center.subtracted(half), center.added(half));
	}
}
