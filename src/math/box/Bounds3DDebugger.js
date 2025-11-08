/**
 * Visual debugger for Bounds3D instances.
 * Renders wireframe boxes with status-aware coloring.
 */
class Bounds3DDebugger {
	constructor(renderer, options = {}) {
		this.renderer = renderer; // WebGL or canvas renderer
		this.colorClean = options.colorClean || '#00ff00';
		this.colorDirty = options.colorDirty || '#ffcc00';
		this.colorEmpty = options.colorEmpty || '#ff0000';
		this.enabled = true;
	}

	/**
	 * Renders a single Bounds3D instance.
	 * @param {Bounds3D} bounds
	 */
	render(bounds) {
		if (!this.enabled || bounds.isEmpty) return;

		const color = bounds.isDirty ? this.colorDirty : this.colorClean;
		this.renderer.drawWireBox(bounds.min, bounds.max, color, bounds.debugLabel);
	}

	/**
	 * Renders multiple Bounds3D instances.
	 * @param {Array<Bounds3D>} list
	 */
	renderAll(list) {
		for (const b of list) {
			if (b.isEmpty) {
				this.renderer.drawWireBox(b.min, b.max, this.colorEmpty, b.debugLabel);
			} else {
				this.render(b);
			}
		}
	}
}
