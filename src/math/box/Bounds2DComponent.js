import { Bounds2D } from './Bounds2D.js';
import { Vec2 } from './Vec2.js';

/**
 * Component wrapper for attaching Bounds2D to an Entity.
 * Handles lifecycle, transform sync, and plugin registration.
 */
class Bounds2DComponent {
	constructor(entity, size = new Vec2(1, 1), spatialMap = null) {
		this.entity = entity;
		this.bounds = new Bounds2D();
		this.size = size.clone();
		this.spatialMap = spatialMap;

		this.bounds.debugLabel = `Entity#${entity.id || 'unknown'}`;
		this.bounds._transform = entity.transform;
		this.bounds._size = this.size;

		if (spatialMap) spatialMap.register(this.bounds);
		this.update();
	}

	/**
	 * Updates bounds from entity transform and size.
	 */
	update() {
		const t = this.entity.transform;
		const half = this.size.scaled(0.5);
		this.bounds.set(t.position.subtracted(half), t.position.added(half));
	}

	/**
	 * Removes bounds from spatial map and clears state.
	 */
 detach() {
		if (this.spatialMap) this.spatialMap.unregister(this.bounds);
		this.bounds.remove();
		this.bounds._transform = null;
		this.bounds._size = null;
	}
}
