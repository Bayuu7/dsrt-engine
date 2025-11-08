/**
 * Overlay panel for displaying real-time Bounds2D diagnostics.
 * Can be rendered to HTML, canvas, or debug UI.
 */
class Bounds2DOverlayPanel {
	constructor(container) {
		this.container = container; // DOM element or canvas context
		this.enabled = true;
		this.entries = [];
	}

	/**
	 * Updates the panel with current Bounds2D data.
	 * @param {Array<Bounds2D>} boundsList
	 */
	update(boundsList) {
		if (!this.enabled || !boundsList?.length) return;

		this.entries = boundsList.map(b => ({
			label: b.debugLabel,
			size: b.getSize().toArray(),
			center: b.getCenter().toArray(),
			isDirty: b.isDirty,
			isEmpty: b.isEmpty,
			version: b.getVersion()
		}));

		this._render();
	}

	/**
	 * Renders the overlay panel.
	 */
	_render() {
		const lines = this.entries.map(entry => {
			const status = entry.isEmpty ? 'empty' : entry.isDirty ? 'dirty' : 'clean';
			return `${entry.label.padEnd(16)} | size: ${entry.size.map(n => n.toFixed(1)).join(', ')} | center: ${entry.center.map(n => n.toFixed(1)).join(', ')} | ${status} | v${entry.version}`;
		});

		if (typeof this.container === 'object' && this.container.innerHTML !== undefined) {
			this.container.innerHTML = `<pre>${lines.join('\n')}</pre>`;
		} else if (this.container.fillText) {
			this.container.clearRect(0, 0, 500, 500);
			this.container.font = '10px monospace';
			lines.forEach((line, i) => {
				this.container.fillText(line, 10, 15 + i * 12);
			});
		}
	}
}
