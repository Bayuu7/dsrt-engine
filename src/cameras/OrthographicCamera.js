import { Camera } from './Camera.js';
import { Matrix4 } from '../math/Matrix4.js';

/**
 * -----------------------------------------------------------------------------
 * OrthographicCamera.js
 * -----------------------------------------------------------------------------
 * OrthographicCamera renders the scene without perspective distortion.
 * 
 * Unlike PerspectiveCamera (which shrinks distant objects),
 * this class projects all geometry using parallel rays, preserving
 * object sizes regardless of distance from the camera.
 * 
 * Commonly used for:
 *  - 2D game rendering and UI overlays
 *  - CAD / blueprint visualization
 *  - Isometric or orthogonal views
 * 
 * -----------------------------------------------------------------------------
 *  Example Usage:
 * -----------------------------------------------------------------------------
 * ```js
 * const camera = new OrthographicCamera({
 *   left: -5, right: 5, top: 5, bottom: -5,
 *   near: 0.1, far: 100
 * });
 * camera.position.set(0, 0, 10);
 * scene.add(camera);
 * ```
 * -----------------------------------------------------------------------------
 *
 * @class
 * @extends Camera
 * @category Rendering
 * @since DSRT Engine 1.0
 */
class OrthographicCamera extends Camera {

  /**
   * @constructor
   * @param {Object} [options={}] - Configuration parameters for orthographic projection.
   * @param {number} [options.left=-1] - Left view boundary.
   * @param {number} [options.right=1] - Right view boundary.
   * @param {number} [options.top=1] - Top view boundary.
   * @param {number} [options.bottom=-1] - Bottom view boundary.
   * @param {number} [options.near=0.1] - Near clipping plane.
   * @param {number} [options.far=2000] - Far clipping plane.
   * @param {boolean} [options.active=false] - Whether the camera is initially active.
   */
  constructor(options = {}) {
    super(options);

    /** @type {string} Type identifier */
    this.type = 'OrthographicCamera';

    /** @type {number} Left clipping boundary */
    this.left = options.left ?? -1;

    /** @type {number} Right clipping boundary */
    this.right = options.right ?? 1;

    /** @type {number} Top clipping boundary */
    this.top = options.top ?? 1;

    /** @type {number} Bottom clipping boundary */
    this.bottom = options.bottom ?? -1;

    /** @type {boolean} Audit flag */
    this.isOrthographicCamera = true;

    // Build projection immediately
    this.updateProjectionMatrix();
  }

  /**
   * Updates the orthographic projection matrix.
   *
   * Formula:
   *   projMatrix = [
   *     2 / (right - left), 0, 0, -(right + left) / (right - left),
   *     0, 2 / (top - bottom), 0, -(top + bottom) / (top - bottom),
   *     0, 0, -2 / (far - near), -(far + near) / (far - near),
   *     0, 0, 0, 1
   *   ]
   */
  updateProjectionMatrix() {
    const { left, right, top, bottom, near, far } = this;
    const dx = right - left;
    const dy = top - bottom;
    const dz = far - near;

    const m = new Matrix4();
    m.elements.set([
      2 / dx, 0, 0, -(right + left) / dx,
      0, 2 / dy, 0, -(top + bottom) / dy,
      0, 0, -2 / dz, -(far + near) / dz,
      0, 0, 0, 1
    ]);

    this.projectionMatrix.copy(m);
  }

  /**
   * Adjusts the view boundaries and updates projection.
   *
   * @param {Object} bounds - New view volume settings
   * @param {number} [bounds.left] - Left plane
   * @param {number} [bounds.right] - Right plane
   * @param {number} [bounds.top] - Top plane
   * @param {number} [bounds.bottom] - Bottom plane
   * @param {number} [bounds.near] - Near plane
   * @param {number} [bounds.far] - Far plane
   */
  setBounds(bounds = {}) {
    if (bounds.left !== undefined) this.left = bounds.left;
    if (bounds.right !== undefined) this.right = bounds.right;
    if (bounds.top !== undefined) this.top = bounds.top;
    if (bounds.bottom !== undefined) this.bottom = bounds.bottom;
    if (bounds.near !== undefined) this.near = bounds.near;
    if (bounds.far !== undefined) this.far = bounds.far;
    this.updateProjectionMatrix();
  }

  /**
   * Automatically resizes orthographic bounds to maintain aspect ratio.
   * Typically called by the renderer on window resize.
   *
   * @param {number} width
   * @param {number} height
   */
  onResize(width, height) {
    const aspect = width / height;
    const halfH = (this.top - this.bottom) / 2;
    const halfW = halfH * aspect;

    this.left = -halfW;
    this.right = halfW;
    this.updateProjectionMatrix();
  }

  /**
   * Destroys camera resources and calls base dispose.
   */
  dispose() {
    super.dispose();
    this.isOrthographicCamera = false;
  }
}

export { OrthographicCamera };
