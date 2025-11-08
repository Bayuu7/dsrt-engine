import { Object3D } from '../core/Object3D.js';
import { Matrix4 } from '../math/Matrix4.js';
import { Vector3 } from '../math/Vector3.js';

/**
 * -----------------------------------------------------------------------------
 * Camera.js
 * -----------------------------------------------------------------------------
 * Core 3D camera component — defines the view transformation for rendering scenes.
 * 
 * A Camera determines what part of the 3D world is visible, how it's projected
 * into 2D, and how transformations affect the view matrix.
 * 
 * Cameras are descendants of Object3D, meaning they inherit position,
 * rotation, scale, and parenting behavior. This allows them to move freely
 * in a scene hierarchy.
 * 
 * There are two main camera types:
 * - PerspectiveCamera: Simulates real-world perspective (objects shrink with distance)
 * - OrthographicCamera: Keeps parallel lines, no depth scaling
 * 
 * The base Camera class provides shared logic, like updating the view matrix
 * and computing world transforms.
 * -----------------------------------------------------------------------------
 *
 * @class
 * @extends Object3D
 * @category Rendering
 * @since DSRT Engine 1.0
 */
class Camera extends Object3D {

  /**
   * @constructor
   * @param {Object} [options={}] - Configuration options for the camera
   * @param {number} [options.near=0.1] - Near clipping plane distance
   * @param {number} [options.far=2000] - Far clipping plane distance
   * @param {boolean} [options.active=false] - Whether the camera is currently active
   */
  constructor(options = {}) {
    super(options);

    /** @type {string} */
    this.type = 'Camera';

    /** @type {number} */
    this.near = options.near ?? 0.1;

    /** @type {number} */
    this.far = options.far ?? 2000.0;

    /** @type {Matrix4} - Projection matrix defining the camera’s lens */
    this.projectionMatrix = new Matrix4();

    /** @type {Matrix4} - Inverse of the world matrix */
    this.viewMatrix = new Matrix4();

    /** @type {boolean} - Marks if the camera is the current rendering source */
    this.active = options.active ?? false;

    /** @type {boolean} - Flag for internal type checking */
    this.isCamera = true;
  }

  /**
   * Updates the view matrix from the current world transform.
   * This should be called before rendering each frame.
   */
  updateMatrixWorld(force) {
    super.updateMatrixWorld(force);
    this.viewMatrix.copy(this.matrixWorld).invert();
  }

  /**
   * Set this camera as the current active rendering camera.
   * Can be managed by the renderer or scene.
   */
  activate() {
    this.active = true;
  }

  /**
   * Deactivate this camera (useful in multi-camera scenes)
   */
  deactivate() {
    this.active = false;
  }

  /**
   * Projects a point from world space into camera (view) space.
   * Useful for visibility checks and object tracking.
   * @param {Vector3} worldPos - Point in world coordinates
   * @returns {Vector3} Transformed point in camera space
   */
  worldToCamera(worldPos) {
    return worldPos.clone().applyMatrix4(this.viewMatrix);
  }

  /**
   * Converts a local point from camera space back into world coordinates.
   * @param {Vector3} cameraPos - Point in camera space
   * @returns {Vector3} Transformed point in world coordinates
   */
  cameraToWorld(cameraPos) {
    const invView = new Matrix4().copy(this.viewMatrix).invert();
    return cameraPos.clone().applyMatrix4(invView);
  }

  /**
   * Abstract method for setting the projection matrix.
   * Subclasses (Perspective, Orthographic) must override this.
   */
  updateProjectionMatrix() {
    console.warn('[Camera] updateProjectionMatrix() should be implemented by subclass');
  }

  /**
   * Clean up memory and GPU bindings related to the camera.
   */
  dispose() {
    super.dispose();
    this.projectionMatrix = null;
    this.viewMatrix = null;
  }
}

export { Camera };
