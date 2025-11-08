/**
 * Plugin for visualizing Bounds2D instances in a debug overlay.
 * Draws labeled rectangles with color-coded state (dirty, empty, etc).
 */
class Bounds2DDebugger {
	constructor(renderer) {
		this.renderer = renderer; // e.g. canvas context or debug overlay system
		this.enabled = true;
	}

	onAttach(bounds) {
		if (!bounds.debugLabel) {
			bounds.debugLabel = `Bounds#${Math.floor(Math.random() * 10000)}`;
		}
		this._draw(bounds);
	}

	onEvent(event, payload, bounds) {
		if (!this.enabled) return;

		if (event === 'modified') {
			this._draw(bounds);
		}

		if (event === 'removed') {
			this._clear(bounds);
		}
	}

	_draw(bounds) {
		const ctx = this.renderer;
		const size = bounds.getSize();
		const pos = bounds.min;

		const color = bounds.isEmpty
			? 'rgba(200,200,200,0.3)'
			: bounds.isDirty
			? 'rgba(255,165,0,0.5)'
			: 'rgba(0,200,255,0.4)';

		ctx.save();
		ctx.strokeStyle = color;
		ctx.lineWidth = 1;
		ctx.strokeRect(pos.x, pos.y, size.x, size.y);

		ctx.fillStyle = color;
		ctx.font = '10px monospace';
		ctx.fillText(bounds.debugLabel, pos.x + 2, pos.y + 10);
		ctx.restore();
	}

	_clear(bounds) {
		// Optional: implement if overlay supports selective clearing
	}
}
