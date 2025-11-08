import { Camera } from './Camera.js';
import { Matrix4 } from '../math/Matrix4.js';
import { DEG2RAD } from '../math/MathUtils.js';

/**
 * -----------------------------------------------------------------------------
 * PerspectiveCamera.js
 * -----------------------------------------------------------------------------
 * PerspectiveCamera is a subclass of Camera that simulates real-world vision.
 * 
 * The projection is defined by a field of view (FOV), aspect ratio,
 * and near/far clipping planes. It transforms 3D world coordinates into
 * normalized device coordinates suitable for rendering pipelines.
 * 
 * Perspective projection makes distant objects appear smaller, mimicking
 * the human eye and photographic lenses.
 * 
 * -----------------------------------------------------------------------------
 *  Example Usage:
 * -----------------------------------------------------------------------------
 * ```js
 * const camera = new PerspectiveCamera({
 *   fov: 60,
 *   aspect: window.innerWidth / window.innerHeight,
 *   near: 0.1,
 *   far: 1000
 * });
 * camera.position.set(0, 0, 5);
 * scene.add(camera);
 * ```
 * -----------------------------------------------------------------------------
 *
 * @class
 * @extends Camera
 * @category Rendering
 * @since DSRT Engine 1.0
 */
class PerspectiveCamera extends Camera {

  /**
   * @constructor
   * @param {Object} [options={}] - Configuration parameters for perspective projection.
   * @param {number} [options.fov=50] - Field of view in degrees (vertical FOV).
   * @param {number} [options.aspect=1.0] - Aspect ratio (width / height).
   * @param {number} [options.near=0.1] - Near clipping plane distance.
   * @param {number} [options.far=2000.0] - Far clipping plane distance.
   * @param {boolean} [options.active=false] - Whether this camera starts as active.
   */
  constructor(options = {}) {
    super(options);

    /** @type {string} */
    this.type = 'PerspectiveCamera';

    /** @type {number} Field of view in degrees */
    this.fov = options.fov ?? 50.0;

    /** @type {number} Aspect ratio (width / height) */
    this.aspect = options.aspect ?? 1.0;

    /** @type {boolean} Flag for identifying perspective cameras */
    this.isPerspectiveCamera = true;

    // Build the projection matrix immediately
    this.updateProjectionMatrix();
  }

  /**
   * Updates the perspective projection matrix using the current parameters.
   *
   * Formula:
   *   f = 1 / tan(fov / 2)
   *   projMatrix = [
   *     f/aspect, 0, 0, 0,
   *     0, f, 0, 0,
   *     0, 0, (far+near)/(near-far), (2*far*near)/(near-far),
   *     0, 0, -1, 0
   *   ]
   *
   * This matrix maps 3D coordinates into clip space with perspective distortion.
   */
  updateProjectionMatrix() {
    const fovRad = this.fov * DEG2RAD;
    const f = 1.0 / Math.tan(fovRad / 2);
    const nf = 1.0 / (this.near - this.far);

    const m = new Matrix4();
    m.elements.set([
      f / this.aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (this.far + this.near) * nf, (2 * this.far * this.near) * nf,
      0, 0, -1, 0
    ]);

    this.projectionMatrix.copy(m);
  }

  /**
   * Sets new camera parameters and immediately updates the projection.
   * Useful when resizing the viewport or changing lens properties.
   *
   * @param {Object} params - New projection settings
   * @param {number} [params.fov] - Field of view in degrees
   * @param {number} [params.aspect] - Aspect ratio (width/height)
   * @param {number} [params.near] - Near clipping distance
   * @param {number} [params.far] - Far clipping distance
   */
  setLens(params = {}) {
    if (params.fov !== undefined) this.fov = params.fov;
    if (params.aspect !== undefined) this.aspect = params.aspect;
    if (params.near !== undefined) this.near = params.near;
    if (params.far !== undefined) this.far = params.far;
    this.updateProjectionMatrix();
  }

  /**
   * Handles automatic resizing when viewport dimensions change.
   * Should be called by the renderer on window resize.
   *
   * @param {number} width
   * @param {number} height
   */
  onResize(width, height) {
    this.aspect = width / height;
    this.updateProjectionMatrix();
  }

  /**
   * Destroys camera data and frees GPU memory.
   * Calls super.dispose() for Object3D cleanup.
   */
  dispose() {
    super.dispose();
    this.isPerspectiveCamera = false;
  }
}

export { PerspectiveCamera };
