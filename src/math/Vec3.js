/**
 * MODULE_ID: dsrt.math.Vec3
 * VERSION: 1.0.0
 * DEPENDENCIES: [Quaternion]
 *
 * Represents a 3D vector with full arithmetic, spatial, and transformation capabilities.
 * Designed for extensibility, plugin integration, and debug observability in dsrt-engine.
 */

import { clamp } from './MathUtils.js';
import { Quaternion } from './Quaternion.js';

class Vec3 {

	/**
	 * Constructs a new 3D vector with optional initial values.
	 * If no values are provided, the vector defaults to (0, 0, 0).
	 *
	 * @param {number} [x=0] - The x component (horizontal axis).
	 * @param {number} [y=0] - The y component (vertical axis).
	 * @param {number} [z=0] - The z component (depth axis).
	 */
	constructor(x = 0, y = 0, z = 0) {
		this.x = x;
		this.y = y;
		this.z = z;

		/** @type {boolean} Type flag for runtime introspection */
		this.isVec3 = true;

		/** @type {string} Optional label for debugging and profiling */
		this.debugLabel = '';

		/** @type {Array} Optional plugin registry for event hooks */
		this._plugins = [];
	}

	// ─────────────────────────────────────────────────────────────
	// 🔧 Mutative API — modifies internal state
	// ─────────────────────────────────────────────────────────────

	/**
	 * Sets all three components of the vector.
	 *
	 * @param {number} x - New x value.
	 * @param {number} y - New y value.
	 * @param {number} z - New z value.
	 * @returns {Vec3} This instance.
	 */
	set(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
		return this;
	}

	/**
	 * Copies the values from another vector.
	 *
	 * @param {Vec3} v - Source vector.
	 * @returns {Vec3} This instance.
	 */
	copy(v) {
		this.x = v.x;
		this.y = v.y;
		this.z = v.z;
		return this;
	}

	/**
	 * Adds another vector to this one.
	 *
	 * @param {Vec3} v - Vector to add.
	 * @returns {Vec3} This instance.
	 */
	add(v) {
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		return this;
	}

	/**
	 * Subtracts another vector from this one.
	 *
	 * @param {Vec3} v - Vector to subtract.
	 * @returns {Vec3} This instance.
	 */
	sub(v) {
		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
		return this;
	}

	/**
	 * Multiplies this vector by a scalar.
	 *
	 * @param {number} scalar - Scalar multiplier.
	 * @returns {Vec3} This instance.
	 */
	multiplyScalar(scalar) {
		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
		return this;
	}

	/**
	 * Divides this vector by a scalar.
	 *
	 * @param {number} scalar - Scalar divisor.
	 * @returns {Vec3} This instance.
	 */
	divideScalar(scalar) {
		return this.multiplyScalar(1 / scalar);
	}

	/**
	 * Normalizes the vector to unit length.
	 *
	 * @returns {Vec3} This instance.
	 */
	normalize() {
		return this.divideScalar(this.length() || 1);
	}

	/**
	 * Negates all components of the vector.
	 *
	 * @returns {Vec3} This instance.
	 */
	negate() {
		this.x = -this.x;
		this.y = -this.y;
		this.z = -this.z;
		return this;
	}

	/**
	 * Clamps each component between the corresponding min and max values.
	 *
	 * @param {Vec3} min - Minimum values.
	 * @param {Vec3} max - Maximum values.
	 * @returns {Vec3} This instance.
	 */
	clamp(min, max) {
		this.x = clamp(this.x, min.x, max.x);
		this.y = clamp(this.y, min.y, max.y);
		this.z = clamp(this.z, min.z, max.z);
		return this;
	}

	// ─────────────────────────────────────────────────────────────
	// 🧊 Immutable API — returns new instance
	// ─────────────────────────────────────────────────────────────

	/**
	 * Returns a new vector that is a clone of this one.
	 * Useful for immutable operations or caching.
	 *
	 * @returns {Vec3} A new vector with the same components.
	 */
	clone() {
		return new Vec3(this.x, this.y, this.z);
	}

	/**
	 * Returns a new vector that is the sum of this and another vector.
	 *
	 * @param {Vec3} v - Vector to add.
	 * @returns {Vec3} A new vector representing the result.
	 */
	added(v) {
		return this.clone().add(v);
	}

	/**
	 * Returns a new vector that is the difference between this and another vector.
	 *
	 * @param {Vec3} v - Vector to subtract.
	 * @returns {Vec3} A new vector representing the result.
	 */
	subtracted(v) {
		return this.clone().sub(v);
	}

	/**
	 * Returns a new vector scaled by the given scalar.
	 *
	 * @param {number} scalar - Scalar multiplier.
	 * @returns {Vec3} A new scaled vector.
	 */
	scaled(scalar) {
		return this.clone().multiplyScalar(scalar);
	}

	/**
	 * Returns a normalized copy of this vector.
	 *
	 * @returns {Vec3} A new unit-length vector.
	 */
	normalized() {
		return this.clone().normalize();
	}

	/**
	 * Returns a clamped copy of this vector.
	 *
	 * @param {Vec3} min - Minimum values.
	 * @param {Vec3} max - Maximum values.
	 * @returns {Vec3} A new clamped vector.
	 */
	clamped(min, max) {
		return this.clone().clamp(min, max);
	}

	// ─────────────────────────────────────────────────────────────
	// 📐 Computations & Queries
	// ─────────────────────────────────────────────────────────────

	/**
	 * Computes the Euclidean length of the vector.
	 * This is the straight-line distance from the origin to this point.
	 *
	 * @returns {number} The length of the vector.
	 */
	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}

	/**
	 * Computes the squared length of the vector.
	 * Useful for comparisons without the cost of square root.
	 *
	 * @returns {number} The squared length.
	 */
	lengthSq() {
		return this.x * this.x + this.y * this.y + this.z * this.z;
	}

	/**
	 * Computes the distance to another vector.
	 *
	 * @param {Vec3} v - Target vector.
	 * @returns {number} Euclidean distance.
	 */
	distanceTo(v) {
		return Math.sqrt(this.distanceToSquared(v));
	}

	/**
	 * Computes the squared distance to another vector.
	 *
	 * @param {Vec3} v - Target vector.
	 * @returns {number} Squared distance.
	 */
	distanceToSquared(v) {
		const dx = this.x - v.x;
		const dy = this.y - v.y;
		const dz = this.z - v.z;
		return dx * dx + dy * dy + dz * dz;
	}

	/**
	 * Computes the dot product with another vector.
	 * Measures directional alignment.
	 *
	 * @param {Vec3} v - Target vector.
	 * @returns {number} Dot product result.
	 */
	dot(v) {
		return this.x * v.x + this.y * v.y + this.z * v.z;
	}

	/**
	 * Computes the cross product with another vector.
	 * Returns a new vector perpendicular to both.
	 *
	 * @param {Vec3} v - Target vector.
	 * @returns {Vec3} A new vector representing the cross product.
	 */
	cross(v) {
		const ax = this.x, ay = this.y, az = this.z;
		const bx = v.x, by = v.y, bz = v.z;
		return new Vec3(
			ay * bz - az * by,
			az * bx - ax * bz,
			ax * by - ay * bx
		);
	}

	/**
	 * Returns the angle in radians between this vector and another.
	 *
	 * @param {Vec3} v - Target vector.
	 * @returns {number} Angle in radians.
	 */
	angleTo(v) {
		const denominator = Math.sqrt(this.lengthSq() * v.lengthSq());
		if (denominator === 0) return Math.PI / 2;
		const theta = this.dot(v) / denominator;
		return Math.acos(clamp(theta, -1, 1));
	}

	/**
	 * Returns true if this vector is exactly equal to another.
	 *
	 * @param {Vec3} v - Vector to compare.
	 * @returns {boolean} Equality result.
	 */
	equals(v) {
		return this.x === v.x && this.y === v.y && this.z === v.z;
	}

	// ─────────────────────────────────────────────────────────────
	// 🔌 Plugin & Event System
	// ─────────────────────────────────────────────────────────────

	/**
	 * Registers a plugin with optional lifecycle hooks.
	 * Plugins can observe mutations or emit events.
	 *
	 * @param {object} plugin - Plugin object with optional `onAttach` and `onEvent`.
	 */
	registerPlugin(plugin) {
		this._plugins.push(plugin);
		plugin.onAttach?.(this);
	}

	/**
	 * Emits an event to all registered plugins.
	 * Useful for debugging, profiling, or reactive systems.
	 *
	 * @param {string} eventName - Event identifier.
	 * @param {any} payload - Event data.
	 */
	emit(eventName, payload) {
		for (const plugin of this._plugins) {
			plugin.onEvent?.(eventName, payload, this);
		}
	}

	// ─────────────────────────────────────────────────────────────
	// 🧭 Debug & Serialization
	// ─────────────────────────────────────────────────────────────

	/**
	 * Converts the vector to an array of [x, y, z].
	 *
	 * @returns {number[]} Array representation.
	 */
	toArray() {
		return [this.x, this.y, this.z];
	}

	/**
	 * Sets the vector components from an array.
	 *
	 * @param {number[]} array - Source array.
	 * @returns {Vec3} This instance.
	 */
	fromArray(array) {
		this.x = array[0];
		this.y = array[1];
		this.z = array[2];
		return this;
	}

	/**
	 * Returns a formatted string for debugging purposes.
	 *
	 * @returns {string} Debug string.
	 */
	toDebugString() {
		return `Vec3(${this.x.toFixed(3)}, ${this.y.toFixed(3)}, ${this.z.toFixed(3)})`;
	}

	/**
	 * Enables iteration over vector components.
	 * Useful for destructuring or loops.
	 */
	*[Symbol.iterator]() {
		yield this.x;
		yield this.y;
		yield this.z;
	}
}

export { Vec3 };
