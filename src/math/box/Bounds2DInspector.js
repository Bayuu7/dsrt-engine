/**
 * Inspector panel for introspecting and editing Bounds2D instances.
 * Designed for editor integration and live debugging.
 */
class Bounds2DInspector {
	constructor(bounds, container) {
		this.bounds = bounds;
		this.container = container; // DOM element
		this._render();
	}

	_render() {
		const b = this.bounds;
		const html = `
			<div style="font-family:monospace; font-size:12px;">
				<label>Label: <input type="text" value="${b.debugLabel}" id="labelInput"/></label><br/>
				<label>Min: <input type="text" value="${b.min.toArray().join(',')}" id="minInput"/></label><br/>
				<label>Max: <input type="text" value="${b.max.toArray().join(',')}" id="maxInput"/></label><br/>
				<label>Traits: <input type="text" value="${Array.from(b._traits).join(',')}" id="traitsInput"/></label><br/>
				<button id="applyBtn">Apply</button>
				<button id="emptyBtn">Make Empty</button>
				<button id="expandBtn">Expand +1</button>
				<button id="translateBtn">Translate +1,+1</button>
			</div>
		`;
		this.container.innerHTML = html;
		this._bind();
	}

	_bind() {
		const b = this.bounds;
		this.container.querySelector('#applyBtn').onclick = () => {
			b.debugLabel = this.container.querySelector('#labelInput').value;
			const min = this.container.querySelector('#minInput').value.split(',').map(Number);
			const max = this.container.querySelector('#maxInput').value.split(',').map(Number);
			const traits = this.container.querySelector('#traitsInput').value.split(',').map(s => s.trim());
			b.set(new Vec2(min[0], min[1]), new Vec2(max[0], max[1]));
			b._traits = new Set(traits);
			b._markModified();
			this._render();
		};

		this.container.querySelector('#emptyBtn').onclick = () => {
			b.makeEmpty();
			this._render();
		};

		this.container.querySelector('#expandBtn').onclick = () => {
			b.expandByScalar(1);
			this._render();
		};

		this.container.querySelector('#translateBtn').onclick = () => {
			b.translate(new Vec2(1, 1));
			this._render();
		};
	}
}
