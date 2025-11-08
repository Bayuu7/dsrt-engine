/**
 * Plugin for profiling Bounds2D mutations and spatial metrics.
 * Tracks version history, size changes, and timestamps.
 */
class Bounds2DProfilerPlugin {
	constructor() {
		this._history = new Map(); // Map<Bounds2D, Array<ProfileEntry>>
	}

	onAttach(bounds) {
		this._history.set(bounds, []);
		this._record(bounds, 'attached');
	}

	onEvent(event, payload, bounds) {
		if (event === 'modified') {
			this._record(bounds, 'modified');
		}
		if (event === 'removed') {
			this._record(bounds, 'removed');
		}
	}

	_record(bounds, eventType) {
		const entry = {
			event: eventType,
			version: bounds.getVersion(),
			timestamp: bounds.getLastModified(),
			size: bounds.getSize().toArray(),
			center: bounds.getCenter().toArray(),
			isEmpty: bounds.isEmpty,
			isDirty: bounds.isDirty,
			debugLabel: bounds.debugLabel
		};

		this._history.get(bounds)?.push(entry);
	}

	/**
	 * Returns the full mutation history for a given Bounds2D.
	 * @param {Bounds2D} bounds
	 * @returns {Array<Object>}
	 */
	getHistory(bounds) {
		return this._history.get(bounds) || [];
	}

	/**
	 * Clears all profiling data.
	 */
	reset() {
		this._history.clear();
	}
}
