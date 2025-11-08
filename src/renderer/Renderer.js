// ===============================================================
// Renderer.js — Abstract Rendering Layer + WebGL Implementation
// ===============================================================
//
// Core purpose:
//  • Defines the base Renderer contract (interface for all backends).
//  • Implements a WebGLRenderer concrete class (default backend).
//  • Handles initialization, context setup, geometry/material upload,
//    and frame rendering.
//
// Key Design Aspects:
//  1. Separation of scene logic (Scene/Mesh/Material) from GPU backend.
//  2. Resource lifecycle management to avoid GPU leaks.
//  3. Easy future replacement with WebGPU, Metal, Vulkan, etc.
//  4. Defensive error handling and graceful fallback.
//
// ---------------------------------------------------------------
// Components Overview:
// ---------------------------------------------------------------
//  • Renderer        — Abstract base class defining renderer API contract.
//  • WebGLRenderer   — Concrete subclass implementing WebGL1/2 backend.
//  • dsrtTestRenderer() — Internal diagnostic test for sanity check.
//
// ---------------------------------------------------------------
// Boolean State Flags (summary):
// ---------------------------------------------------------------
//  - this.initialized → indicates whether the renderer has initialized GL context.
//  - this.destroyed → prevents re-use after destroy().
//  - this.isWebGL2 → true if WebGL2 context is available.
//  - this.autoClear → whether to clear color/depth buffers each frame.
//
// ---------------------------------------------------------------
// Render Flow Summary:
// ---------------------------------------------------------------
//  Scene Graph (Scene → Object3D → Mesh)
//    ↓
//  Renderer.render(scene, camera)
//    1. Ensure context initialized
//    2. Clear buffers (if autoClear)
//    3. Traverse scene for visible meshes
//    4. Upload geometry/materials to GPU if needed
//    5. Bind shader, set uniforms
//    6. Issue draw calls
//    7. Post-render cleanup / hooks
//
// ===============================================================


// --------------------------------------------------
// Abstract Base Class — Renderer
// --------------------------------------------------

class Renderer {
  /**
   * @constructor
   * @param {object} options
   *   @param {HTMLCanvasElement} [canvas]
   *   @param {boolean} [debug=false]
   *   @param {object} [glOptions] - Context creation options
   */
  constructor(options = {}) {
    this.canvas = options.canvas || null;
    this.debug = !!options.debug;

    // Default resolution
    this._width = options.width || (this.canvas ? this.canvas.width : 800);
    this._height = options.height || (this.canvas ? this.canvas.height : 600);

    // Boolean flags
    this.initialized = false;
    this.destroyed = false;

    // Frame timing data
    this.frameCount = 0;
    this._lastFrameTime = 0;

    if (this.debug) console.log('[Renderer] Created base instance');
  }

  /** Abstract: Initialize renderer resources. */
  init() {
    throw new Error('Renderer.init() must be implemented by subclass');
  }

  /** Adjust viewport dimensions. */
  setSize(width, height) {
    this._width = width;
    this._height = height;
  }

  /** Abstract: Render a scene from a camera. */
  render(scene, camera) {
    throw new Error('Renderer.render() must be implemented by subclass');
  }

  /** Abstract: Upload geometry buffers. */
  uploadGeometry(geometry) {
    throw new Error('Renderer.uploadGeometry() must be implemented by subclass');
  }

  /** Abstract: Upload material resources. */
  uploadMaterial(material) {
    throw new Error('Renderer.uploadMaterial() must be implemented by subclass');
  }

  /** Abstract: Draw a mesh. */
  drawMesh(mesh) {
    throw new Error('Renderer.drawMesh() must be implemented by subclass');
  }

  /** Abstract: Update material GPU state. */
  updateMaterial(material) {
    throw new Error('Renderer.updateMaterial() must be implemented by subclass');
  }

  /** Cleanup hook. */
  destroy() {
    this.destroyed = true;
  }
}


// --------------------------------------------------
// WebGLRenderer — Concrete Implementation
// --------------------------------------------------

class WebGLRenderer extends Renderer {
  /**
   * @param {object} options
   *   @param {HTMLCanvasElement} [canvas]
   *   @param {boolean} [debug]
   *   @param {boolean} [antialias]
   *   @param {boolean} [alpha]
   *   @param {boolean} [preserveDrawingBuffer]
   */
  constructor(options = {}) {
    super(options);

    // Canvas target
    this.canvas = options.canvas || document.createElement('canvas');

    // Context creation options
    this.glOptions = {
      antialias: options.antialias ?? true,
      alpha: options.alpha ?? false,
      premultipliedAlpha: options.premultipliedAlpha ?? false,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
    };

    /** @type {WebGLRenderingContext|null} */
    this.gl = null;

    /** @type {boolean} */
    this.isWebGL2 = false;

    // Resource registries
    this._geometries = new WeakMap();
    this._materials = new WeakMap();
    this._textures = new WeakMap();

    // Rendering preferences
    this.clearColor = options.clearColor || [0.0, 0.0, 0.0, 1.0];
    this.autoClear = options.autoClear !== undefined ? options.autoClear : true;

    // Cache & performance
    this._currentProgram = null;
    this.drawCalls = 0;

    if (this.debug) console.log('[WebGLRenderer] Created');
  }

  // --------------------------------------------------
  // Initialization / Setup
  // --------------------------------------------------

  init() {
    if (this.initialized) return;

    // Attempt WebGL2, fallback to WebGL1
    this.gl = this.canvas.getContext('webgl2', this.glOptions);
    if (!this.gl) {
      this.gl = this.canvas.getContext('webgl', this.glOptions) ||
                this.canvas.getContext('experimental-webgl', this.glOptions);
    } else {
      this.isWebGL2 = true;
    }

    if (!this.gl) throw new Error('WebGL not supported.');

    // Viewport setup
    this.setSize(this._width, this._height);
    this.gl.viewport(0, 0, this._width, this._height);

    // Default GL state
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);

    // Default clear color
    this.gl.clearColor(...this.clearColor);

    this.initialized = true;
    if (this.debug) console.log('[WebGLRenderer] Initialized WebGL context');
  }

  // --------------------------------------------------
  // Frame Rendering Pipeline
  // --------------------------------------------------

  render(scene, camera) {
    if (!this.initialized) this.init();
    if (this.destroyed || !scene || !camera) return;

    const gl = this.gl;

    // Step 1 — Clear frame
    if (this.autoClear) gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Step 2 — Scene pre-render hook
    scene.preRender?.(this);

    // Step 3 — Update camera matrices
    camera.updateMatrixWorld?.();

    // Step 4 — Collect visible meshes
    const visibleMeshes = [];
    scene.traverse(node => {
      if (node.visible === false) return;
      if (node.type === 'Mesh' || node.isMesh) visibleMeshes.push(node);
    });

    // Step 5 — Sort by material/program to reduce pipeline switches
    visibleMeshes.sort((a, b) => {
      const ma = a.material?.program || a.material?.type;
      const mb = b.material?.program || b.material?.type;
      return ma === mb ? 0 : ma > mb ? 1 : -1;
    });

    // Step 6 — Draw loop
    this.drawCalls = 0;
    this._currentProgram = null;
    for (const mesh of visibleMeshes) {
      this.uploadGeometry(mesh.geometry);
      this.uploadMaterial(mesh.material);
      mesh.onBeforeRender?.(this);
      this.drawMesh(mesh);
      mesh.onAfterRender?.(this);
    }

    // Step 7 — Scene post-render
    scene.postRender?.(this);

    this.frameCount++;
    if (this.debug) this._logStats();
  }

  // --------------------------------------------------
  // Geometry Upload
  // --------------------------------------------------

  uploadGeometry(geometry) {
    if (!geometry || geometry.disposed) return;
    if (this._geometries.has(geometry)) return;

    const gl = this.gl;
    const gpu = {};

    // VBO creation
    if (geometry.vertices?.length) {
      gpu.positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, gpu.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);
    }

    if (geometry.normals?.length) {
      gpu.normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, gpu.normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);
    }

    if (geometry.uvs?.length) {
      gpu.uvBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, gpu.uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.uvs, gl.STATIC_DRAW);
    }

    if (geometry.indices?.length) {
      gpu.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpu.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
      gpu.indexCount = geometry.indices.length;
      gpu.indexType = geometry.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    } else {
      gpu.indexCount = geometry.vertices ? geometry.vertices.length / 3 : 0;
      gpu.indexType = null;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    this._geometries.set(geometry, gpu);
    geometry._gpuRef = gpu;

    if (this.debug) console.log('[WebGLRenderer] Geometry uploaded', geometry.name || geometry.uuid);
  }

  // --------------------------------------------------
  // Material & Texture Upload
  // --------------------------------------------------

  uploadMaterial(material) {
    if (!material) return;
    if (this._materials.has(material) && !material._needsUpdate) return;

    if (material.type === 'ShaderMaterial' || material.vertexShader) {
      if (typeof material.compile === 'function') material.compile(this.gl);
    }

    this._materials.set(material, { uploadedAt: Date.now() });
    material._needsUpdate = false;

    if (this.debug) console.log('[WebGLRenderer] Material uploaded', material.name || material.uuid);
  }

  uploadTexture(texture) {
    if (!texture || texture.disposed) return;
    if (this._textures.has(texture)) return;

    if (typeof texture.upload === 'function') {
      texture.upload(this.gl);
      this._textures.set(texture, { uploadedAt: Date.now() });
      if (this.debug) console.log('[WebGLRenderer] Texture uploaded', texture.name);
    }
  }

  updateMaterial(material) {
    if (!material) return;
    if (material.textures) {
      for (const tex of Object.values(material.textures)) {
        this.uploadTexture(tex);
      }
    }
  }

  // --------------------------------------------------
  // Draw Routine
  // --------------------------------------------------

  drawMesh(mesh) {
    const gl = this.gl;
    if (!mesh?.geometry || !mesh?.material) return;

    const geomGPU = this._geometries.get(mesh.geometry);
    if (!geomGPU) return;

    const material = mesh.material;

    // Bind shader
    if (material.program && this._currentProgram !== material.program) {
      gl.useProgram(material.program);
      this._currentProgram = material.program;
    }

    // Bind vertex attributes
    const bindAttrib = (name, size, buffer) => {
      const loc = gl.getAttribLocation(material.program, name);
      if (loc !== -1 && buffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      }
    };

    bindAttrib('position', 3, geomGPU.positionBuffer);
    bindAttrib('normal', 3, geomGPU.normalBuffer);
    bindAttrib('uv', 2, geomGPU.uvBuffer);

    // Bind index buffer
    if (geomGPU.indexBuffer) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geomGPU.indexBuffer);

    // Upload per-mesh matrices
    const mvLoc = gl.getUniformLocation(material.program, 'modelViewMatrix');
    const projLoc = gl.getUniformLocation(material.program, 'projectionMatrix');
    const modelViewMatrix = mesh.modelViewMatrix || mesh.matrixWorld;
    const projectionMatrix = mesh.projectionMatrix || mesh.camera?.projectionMatrix;

    if (mvLoc && modelViewMatrix?.toArray) gl.uniformMatrix4fv(mvLoc, false, modelViewMatrix.toArray());
    if (projLoc && projectionMatrix?.toArray) gl.uniformMatrix4fv(projLoc, false, projectionMatrix.toArray());

    material.bind?.(gl);

    // Draw call
    if (geomGPU.indexBuffer) gl.drawElements(gl.TRIANGLES, geomGPU.indexCount, geomGPU.indexType, 0);
    else gl.drawArrays(gl.TRIANGLES, 0, geomGPU.indexCount);

    this.drawCalls++;
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  // --------------------------------------------------
  // Debug & Cleanup
  // --------------------------------------------------

  _logStats() {
    console.log(`[WebGLRenderer] frame=${this.frameCount} drawCalls=${this.drawCalls}`);
  }

  destroy() {
    if (this.destroyed) return;
    const gl = this.gl;

    // Free geometry buffers
    for (const [geom, gpu] of this._geometries) {
      gpu.positionBuffer && gl.deleteBuffer(gpu.positionBuffer);
      gpu.normalBuffer && gl.deleteBuffer(gpu.normalBuffer);
      gpu.uvBuffer && gl.deleteBuffer(gpu.uvBuffer);
      gpu.indexBuffer && gl.deleteBuffer(gpu.indexBuffer);
    }
    this._geometries = new WeakMap();

    // Free programs
    for (const mat of this._materials.keys ? Array.from(this._materials.keys()) : []) {
      if (mat.program) gl.deleteProgram(mat.program);
    }
    this._materials = new WeakMap();

    // Free textures
    for (const tex of this._textures.keys ? Array.from(this._textures.keys()) : []) {
      tex.dispose?.(gl);
    }
    this._textures = new WeakMap();

    this.destroyed = true;
    if (this.debug) console.log('[WebGLRenderer] Destroyed and resources released');
  }
}


// --------------------------------------------------
// Internal Sanity Test (Minimal Integration Test)
// --------------------------------------------------

export async function dsrtTestRenderer() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const renderer = new WebGLRenderer({ canvas, debug: false });

  try { renderer.init(); } catch { return false; }

  const { Geometry } = await import('./Geometry.js');
  const { Mesh } = await import('./Mesh.js');
  const { ShaderMaterial } = await import('./ShaderMaterial.js');
  const { Scene } = await import('./Scene.js');

  const geom = new Geometry({ vertices: [0,0,0, 0,1,0, 1,0,0], indices: [0,1,2] });
  const mat = new ShaderMaterial();
  const mesh = new Mesh(geom, mat);

  const camera = { projectionMatrix: { toArray: () => new Float32Array(16) }, updateMatrixWorld(){} };
  const scene = new Scene();
  scene.add(mesh);

  try { renderer.render(scene, camera); }
  catch { renderer.destroy(); return false; }

  renderer.destroy();
  return true;
}


// --------------------------------------------------
// Exports
// --------------------------------------------------
export { Renderer, WebGLRenderer };
