/**
 * MODULE_ID: dsrt.math.Vec2
 * VERSION: 1.0.0
 * DEPENDENCIES: []
 *
 * Represents a 2D vector with full arithmetic, spatial, and interpolation capabilities.
 * Designed for extensibility, plugin integration, and debug observability in dsrt-engine.
 */

import { clamp } from './MathUtils.js';

class Vec2 {

	/**
	 * Constructs a new 2D vector with optional initial values.
	 * If no values are provided, the vector defaults to (0, 0).
	 *
	 * @param {number} [x=0] - The horizontal component of the vector.
	 * @param {number} [y=0] - The vertical component of the vector.
	 */
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;

		/** @type {boolean} Type flag for runtime introspection */
		this.isVec2 = true;

		/** @type {string} Optional label for debugging and profiling */
		this.debugLabel = '';

		/** @type {Array} Optional plugin registry for event hooks */
		this._plugins = [];
	}

	// ─────────────────────────────────────────────────────────────
	// 🔧 Mutative API — modifies internal state
	// ─────────────────────────────────────────────────────────────

	/** Sets both components of the vector. */
	set(x, y) {
		this.x = x;
		this.y = y;
		return this;
	}

	/** Sets both components to the same scalar value. */
	setScalar(scalar) {
		this.x = scalar;
		this.y = scalar;
		return this;
	}

	/** Copies the values from another vector. */
	copy(v) {
		this.x = v.x;
		this.y = v.y;
		return this;
	}

	/** Adds another vector to this one. */
	add(v) {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	/** Subtracts another vector from this one. */
	sub(v) {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}

	/** Multiplies this vector by another vector component-wise. */
	multiply(v) {
		this.x *= v.x;
		this.y *= v.y;
		return this;
	}

	/** Multiplies both components by a scalar. */
	multiplyScalar(scalar) {
		this.x *= scalar;
		this.y *= scalar;
		return this;
	}

	/** Divides this vector by another vector component-wise. */
	divide(v) {
		this.x /= v.x;
		this.y /= v.y;
		return this;
	}

	/** Divides both components by a scalar. */
	divideScalar(scalar) {
		return this.multiplyScalar(1 / scalar);
	}

	/** Clamps each component between the corresponding min and max values. */
	clamp(min, max) {
		this.x = clamp(this.x, min.x, max.x);
		this.y = clamp(this.y, min.y, max.y);
		return this;
	}

	/** Clamps each component between two scalar values. */
	clampScalar(minVal, maxVal) {
		this.x = clamp(this.x, minVal, maxVal);
		this.y = clamp(this.y, minVal, maxVal);
		return this;
	}

	/** Normalizes the vector to unit length. */
	normalize() {
		return this.divideScalar(this.length() || 1);
	}

	/** Negates both components. */
	negate() {
		this.x = -this.x;
		this.y = -this.y;
		return this;
	}

	/** Rounds both components to the nearest integer. */
	round() {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		return this;
	}

	/** Floors both components. */
	floor() {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		return this;
	}

	/** Ceils both components. */
	ceil() {
		this.x = Math.ceil(this.x);
		this.y = Math.ceil(this.y);
		return this;
	}

	/** Truncates both components toward zero. */
	roundToZero() {
		this.x = Math.trunc(this.x);
		this.y = Math.trunc(this.y);
		return this;
	}

	// ─────────────────────────────────────────────────────────────
	// 🧊 Immutable API — returns new instance
	// ─────────────────────────────────────────────────────────────

	/** Returns a new vector with the same values. */
	clone() {
		return new Vec2(this.x, this.y);
	}

	/** Returns a new vector that is the sum of this and another. */
	added(v) {
		return this.clone().add(v);
	}

	/** Returns a new vector that is the difference of this and another. */
	subtracted(v) {
		return this.clone().sub(v);
	}

	/** Returns a new vector scaled by a scalar. */
	scaled(scalar) {
		return this.clone().multiplyScalar(scalar);
	}

	/** Returns a normalized copy of this vector. */
	normalized() {
		return this.clone().normalize();
	}

	/** Returns a clamped copy of this vector. */
	clamped(min, max) {
		return this.clone().clamp(min, max);
	}

	// ─────────────────────────────────────────────────────────────
	// 📐 Computations & Queries
	// ─────────────────────────────────────────────────────────────

	/** Returns the Euclidean length of the vector. */
	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	/** Returns the squared length (avoids sqrt). */
	lengthSq() {
		return this.x * this.x + this.y * this.y;
	}

	/** Returns the distance to another vector. */
	distanceTo(v) {
		return Math.sqrt(this.distanceToSquared(v));
	}

	/** Returns the squared distance to another vector. */
	distanceToSquared(v) {
		const dx = this.x - v.x;
		const dy = this.y - v.y;
		return dx * dx + dy * dy;
	}

	/** Returns the dot product with another vector. */
	dot(v) {
		return this.x * v.x + this.y * v.y;
	}

	/** Returns the 2D cross product (scalar). */
	cross(v) {
		return this.x * v.y - this.y * v.x;
	}

	/** Returns the angle in radians from (1, 0) to this vector. */
	angle() {
		return Math.atan2(this.y, this.x);
	}

	/** Returns the angle between this and another vector. */
	angleTo(v) {
		const denominator = Math.sqrt(this.lengthSq() * v.lengthSq());
		if (denominator === 0) return Math.PI / 2;
		const theta = this.dot(v) / denominator;
		return Math.acos(clamp(theta, -1, 1));
	}

	/** Returns true if both components match another vector. */
	equals(v) {
		return this.x === v.x && this.y === v.y;
	}

	// ─────────────────────────────────────────────────────────────
	// 🔌 Plugin & Event System
	// ─────────────────────────────────────────────────────────────

	/** Registers a plugin with optional lifecycle hooks. */
	registerPlugin(plugin) {
		this._plugins.push(plugin);
		plugin.onAttach?.(this);
	}

	/** Emits an event to all registered plugins. */
	emit(eventName, payload) {
		for (const plugin of this._plugins) {
			plugin.onEvent?.(eventName, payload, this);
		}
	}

	// ─────────────────────────────────────────────────────────────
	// 🧭 Debug & Serialization
	// ─────────────────────────────────────────────────────────────

	/** Returns a string representation for debugging. */
	toDebugString() {
		return `Vec2(${this.x.toFixed(3)}, ${this.y.toFixed(3)})`;
	}

	/** Converts the vector to an array. */
	toArray(array = [], offset = 0) {
		array[offset] = this.x;
		array[offset + 1] = this.y;
		return array;
	}

	/** Sets the vector from an array. */
	fromArray(array, offset = 0) {
		this.x = array[offset];
		this.y = array[offset + 1];
		return this;
	}

	/** Returns an iterable of [x, y]. */
	*[Symbol.iterator]() {
		yield this.x;
		yield this.y;
	}
}

export { Vec2 };
