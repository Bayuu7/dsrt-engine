import { Vec3 } from './Vec3.js';

/**
 * MODULE_ID: dsrt.geometry.Bounds3D
 * VERSION: 2.0.0
 *
 * Represents a 3D axis-aligned bounding region.
 * Supports mutative & immutable operations, plugin hooks, traits, introspection, and spatial queries.
 */
class Bounds3D {
	constructor(min = new Vec3(+Infinity, +Infinity, +Infinity), max = new Vec3(-Infinity, -Infinity, -Infinity)) {
		/** @type {Vec3} Lower corner of the bounding box */
		this.min = min;

		/** @type {Vec3} Upper corner of the bounding box */
		this.max = max;

		/** @type {boolean} Type flag for runtime introspection */
		this.isBounds3D = true;

		/** @type {boolean} Indicates whether this region is empty */
		this.isEmpty = true;

		/** @type {boolean} Indicates whether this region has been modified */
		this.isDirty = false;

		/** @type {string} Optional debug label */
		this.debugLabel = '';

		/** @type {number} Internal mutation counter */
		this._version = 0;

		/** @type {number} Timestamp of last mutation */
		this._lastModified = Date.now();

		/** @type {Array} Plugin registry */
		this._plugins = [];

		/** @type {Set<string>} Trait registry */
		this._traits = new Set();

		this.emit('created', this);
	}

	// ───────────── Mutative API ─────────────

	set(min, max) {
		this.min.copy(min);
		this.max.copy(max);
		this.isEmpty = false;
		return this._markModified();
	}

	makeEmpty() {
		this.min.set(+Infinity, +Infinity, +Infinity);
		this.max.set(-Infinity, -Infinity, -Infinity);
		this.isEmpty = true;
		return this._markModified();
	}

	copy(bounds) {
		this.min.copy(bounds.min);
		this.max.copy(bounds.max);
		this.isEmpty = bounds.isEmpty;
		return this._markModified();
	}

	expandByPoint(point) {
		this.min.min(point);
		this.max.max(point);
		this.isEmpty = false;
		return this._markModified();
	}

	expandByVector(vector) {
		this.min.sub(vector);
		this.max.add(vector);
		this.isEmpty = false;
		return this._markModified();
	}

	expandByScalar(scalar) {
		this.min.addScalar(-scalar);
		this.max.addScalar(scalar);
		this.isEmpty = false;
		return this._markModified();
	}

	intersect(bounds) {
		this.min.max(bounds.min);
		this.max.min(bounds.max);
		this.isEmpty = this._checkEmpty();
		return this._markModified();
	}

	union(bounds) {
		this.min.min(bounds.min);
		this.max.max(bounds.max);
		this.isEmpty = false;
		return this._markModified();
	}

	translate(offset) {
		this.min.add(offset);
		this.max.add(offset);
		return this._markModified();
	}

	// ───────────── Immutable API ─────────────

	clone() {
		return new Bounds3D().copy(this);
	}

	translated(offset) {
		return this.clone().translate(offset);
	}

	expandedByScalar(scalar) {
		return this.clone().expandByScalar(scalar);
	}

	intersected(bounds) {
		return this.clone().intersect(bounds);
	}

	unioned(bounds) {
		return this.clone().union(bounds);
	}

	// ───────────── Computation & Queries ─────────────

	_checkEmpty() {
		return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
	}

	containsPoint(point) {
		return point.x >= this.min.x && point.x <= this.max.x &&
		       point.y >= this.min.y && point.y <= this.max.y &&
		       point.z >= this.min.z && point.z <= this.max.z;
	}

	containsBounds(bounds) {
		return this.min.x <= bounds.min.x && bounds.max.x <= this.max.x &&
		       this.min.y <= bounds.min.y && bounds.max.y <= this.max.y &&
		       this.min.z <= bounds.min.z && bounds.max.z <= this.max.z;
	}

	intersects(bounds) {
		return bounds.max.x >= this.min.x && bounds.min.x <= this.max.x &&
		       bounds.max.y >= this.min.y && bounds.min.y <= this.max.y &&
		       bounds.max.z >= this.min.z && bounds.min.z <= this.max.z;
	}

	getCenter(target = new Vec3()) {
		return this.isEmpty ? target.set(0, 0, 0) : target.addVectors(this.min, this.max).multiplyScalar(0.5);
	}

	getSize(target = new Vec3()) {
		return this.isEmpty ? target.set(0, 0, 0) : target.subVectors(this.max, this.min);
	}

	getParameter(point, target = new Vec3()) {
		return target.set(
			(point.x - this.min.x) / (this.max.x - this.min.x),
			(point.y - this.min.y) / (this.max.y - this.min.y),
			(point.z - this.min.z) / (this.max.z - this.min.z)
		);
	}

	clampPoint(point, target = new Vec3()) {
		return target.copy(point).clamp(this.min, this.max);
	}

	distanceToPoint(point) {
		return this.clampPoint(point, _vector).distanceTo(point);
	}

	equals(bounds) {
		return this.min.equals(bounds.min) && this.max.equals(bounds.max);
	}

	// ───────────── Plugin & Lifecycle ─────────────

	_markModified(event = 'modified') {
		this.isDirty = true;
		this._version++;
		this._lastModified = Date.now();
		this.emit(event, this);
		return this;
	}

	registerPlugin(plugin) {
		this._plugins.push(plugin);
		plugin.onAttach?.(this);
	}

	emit(eventName, payload) {
		for (const plugin of this._plugins) {
			plugin.onEvent?.(eventName, payload, this);
		}
	}

	// ───────────── Traits & Metadata ─────────────

	addTrait(name) {
		this._traits.add(name);
		this.emit('traitAdded', name);
	}

	hasTrait(name) {
		return this._traits.has(name);
	}

	getVersion() {
		return this._version;
	}

	getLastModified() {
		return this._lastModified;
	}

	markClean() {
		this.isDirty = false;
	}

	getMetadata() {
		return {
			moduleId: 'dsrt.geometry.Bounds3D',
			type: 'Bounds3D',
			version: this._version,
			lastModified: this._lastModified,
			debugLabel: this.debugLabel,
			isDirty: this.isDirty,
			isEmpty: this.isEmpty,
			traits: Array.from(this._traits)
		};
	}

	validate() {
		if (!this.min.isFiniteVector() || !this.max.isFiniteVector()) {
			this._handleError('Bounds3D contains non-finite values');
		}
		return this;
	}

	// ───────────── Debug & Serialization ─────────────

	toDebugString() {
		return `Bounds3D[min=${this.min.toDebugString()}, max=${this.max.toDebugString()}]`;
	}

	toJSON() {
		return {
			min: this.min.toArray(),
			max: this.max.toArray(),
			isBounds3D: this.isBounds3D,
			version: this._version,
			traits: Array.from(this._traits)
		};
	}

	static fromJSON(json) {
		return new Bounds3D(new Vec3().fromArray(json.min), new Vec3().fromArray(json.max));
	}

	_handleError(message) {
		console.warn(`[Bounds3D Error] ${message}`, this);
		this.emit('error', { message, source: this });
		return this;
	}
}

const _vector = new Vec3();

export { Bounds3D };
