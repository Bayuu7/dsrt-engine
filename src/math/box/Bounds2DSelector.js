/**
 * Interactive selector for Bounds2D instances.
 * Supports point-based and box-based selection modes.
 */
class Bounds2DSelector {
	constructor(spatialMap) {
		this.spatialMap = spatialMap;
		this.selected = new Set();
		this.mode = 'replace'; // 'replace' | 'toggle' | 'add'
	}

	/**
	 * Selects bounds containing the given point.
	 * @param {Vec2} point
	 */
	selectPoint(point) {
		const hits = this.spatialMap.queryPoint(point);
		this._applySelection(hits);
	}

	/**
	 * Selects bounds intersecting the given region.
	 * @param {Bounds2D} region
	 */
	selectRegion(region) {
		const hits = this.spatialMap.query(region);
		this._applySelection(hits);
	}

	/**
	 * Applies selection logic based on mode.
	 * @param {Array<Bounds2D>} hits
	 */
	_applySelection(hits) {
		if (this.mode === 'replace') {
			this.selected.clear();
			hits.forEach(b => this.selected.add(b));
		} else if (this.mode === 'toggle') {
			hits.forEach(b => {
				if (this.selected.has(b)) this.selected.delete(b);
				else this.selected.add(b);
			});
		} else if (this.mode === 'add') {
			hits.forEach(b => this.selected.add(b));
		}
	}

	/**
	 * Clears current selection.
	 */
	clear() {
		this.selected.clear();
	}

	/**
	 * Returns selected bounds.
	 * @returns {Array<Bounds2D>}
	 */
	getSelected() {
		return Array.from(this.selected);
	}

	/**
	 * Sets selection mode.
	 * @param {'replace'|'toggle'|'add'} mode
	 */
	setMode(mode) {
		this.mode = mode;
	}
}
