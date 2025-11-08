// ==============================================
// Renderer.js — Core rendering abstraction & WebGL implementation
// ==============================================

/**
 * Renderer.js
 *
 * Provides the Renderer abstraction and a WebGLRenderer implementation.
 * The Renderer is responsible for:
 *  - creating and managing the GPU context
 *  - preparing scene resources (uploading geometry, textures, materials)
 *  - issuing draw calls for visible meshes
 *  - managing render state (depth test, blending, culling)
 *
 * Design principles:
 *  - Clear separation between scene/mesh/material and rendering backend
 *  - Defensive resource management to avoid GPU leaks
 *  - Small, well-documented API surface so it is easy to swap backends
 *    (WebGPU / software rasterizer) later.
 *
 * NOTE: This file expects that Mesh, Geometry, Material, ShaderMaterial,
 * Texture, and Object3D implementations follow the APIs defined in prior modules.
 */

// --------------------------------------------------
// Abstract Renderer base class (API contract)
// --------------------------------------------------

class Renderer {

  /**
   * Creates a new Renderer.
   * @param {object} options - Optional configuration:
   *   { HTMLCanvasElement canvas, boolean debug, object glOptions }
   */
  constructor( options = {} ) {
    this.canvas = options.canvas || null;
    this.debug = !!options.debug;
    this._width = options.width || (this.canvas ? this.canvas.width : 800);
    this._height = options.height || (this.canvas ? this.canvas.height : 600);

    // State bookkeeping
    this.initialized = false;
    this.destroyed = false;

    // Frame timing / stats
    this.frameCount = 0;
    this._lastFrameTime = 0;

    if ( this.debug ) console.log( '[Renderer] Created' );
  }

  /**
   * Initialize renderer resources / context.
   * Must be implemented by concrete backends.
   */
  init() {
    throw new Error( 'Renderer.init() must be implemented by subclass' );
  }

  /**
   * Resize viewport / framebuffer.
   * @param {number} width
   * @param {number} height
   */
  setSize( width, height ) {
    this._width = width;
    this._height = height;
  }

  /**
   * Primary render entrypoint. Must draw the scene from camera's view.
   * @param {Scene} scene
   * @param {Camera} camera
   */
  render( scene, camera ) {
    throw new Error( 'Renderer.render() must be implemented by subclass' );
  }

  /**
   * Upload geometry buffers to the GPU.
   * Backend should implement uploadGeometry(geometry).
   */
  uploadGeometry( geometry ) {
    throw new Error( 'Renderer.uploadGeometry() must be implemented by subclass' );
  }

  /**
   * Upload or bind material/shader resources.
   * @param {Material} material
   */
  uploadMaterial( material ) {
    throw new Error( 'Renderer.uploadMaterial() must be implemented by subclass' );
  }

  /**
   * Draw a mesh (called from Mesh.render()).
   * @param {Mesh} mesh
   */
  drawMesh( mesh ) {
    throw new Error( 'Renderer.drawMesh() must be implemented by subclass' );
  }

  /**
   * Upload/update material on the GPU (uniforms, textures).
   * @param {Material} material
   */
  updateMaterial( material ) {
    throw new Error( 'Renderer.updateMaterial() must be implemented by subclass' );
  }

  /**
   * Destroy and free GPU resources.
   */
  destroy() {
    this.destroyed = true;
  }
}

// --------------------------------------------------
// WebGLRenderer (concrete implementation)
// --------------------------------------------------

class WebGLRenderer extends Renderer {

  /**
   * Creates a new WebGLRenderer.
   * @param {object} options - { canvas, debug, antialias, alpha, preserveDrawingBuffer }
   */
  constructor( options = {} ) {
    super( options );

    this.canvas = options.canvas || document.createElement( 'canvas' );
    this.glOptions = {
      antialias: options.antialias ?? true,
      alpha: options.alpha ?? false,
      premultipliedAlpha: options.premultipliedAlpha ?? false,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
    };

    // WebGL context
    this.gl = null;
    this.isWebGL2 = false;

    // Resource registries (geometry/material/texture -> GPU handle)
    this._geometries = new WeakMap();
    this._materials = new WeakMap();
    this._textures = new WeakMap();

    // Default GL state preferences
    this.clearColor = options.clearColor || [0.0, 0.0, 0.0, 1.0];
    this.autoClear = options.autoClear !== undefined ? options.autoClear : true;

    // Caching currently bound program to reduce gl.useProgram calls
    this._currentProgram = null;

    // Performance stats
    this.drawCalls = 0;

    if ( this.debug ) console.log( '[WebGLRenderer] Created' );
  }

  /**
   * Initialize WebGL context and default GL settings.
   * Should be called before first render.
   */
  init() {
    if ( this.initialized ) return;

    // Try WebGL2 first
    this.gl = this.canvas.getContext( 'webgl2', this.glOptions );
    if ( !this.gl ) {
      this.gl = this.canvas.getContext( 'webgl', this.glOptions ) || this.canvas.getContext( 'experimental-webgl', this.glOptions );
    } else {
      this.isWebGL2 = true;
    }

    if ( !this.gl ) {
      throw new Error( 'WebGL not supported in this environment.' );
    }

    // Set viewport
    this.setSize( this._width, this._height );
    this.gl.viewport( 0, 0, this._width, this._height );

    // Default GL state
    this.gl.enable( this.gl.DEPTH_TEST );
    this.gl.depthFunc( this.gl.LEQUAL );
    this.gl.enable( this.gl.CULL_FACE );
    this.gl.cullFace( this.gl.BACK );

    // Default clear color
    this.gl.clearColor( this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3] );

    this.initialized = true;
    if ( this.debug ) console.log( '[WebGLRenderer] Initialized WebGL context' );
  }

  /**
   * Resize the canvas and viewport.
   * @param {number} width
   * @param {number} height
   */
  setSize( width, height ) {
    super.setSize( width, height );
    this.canvas.width = width;
    this.canvas.height = height;
    if ( this.gl ) this.gl.viewport( 0, 0, width, height );
  }

  /**
   * Main render routine. Traverses scene, issues draw calls.
   * Basic frustum culling and sorting may be implemented here.
   *
   * @param {Scene} scene
   * @param {Camera} camera
   */
  render( scene, camera ) {
    if ( !this.initialized ) this.init();
    if ( this.destroyed ) return;
    if ( !scene || !camera ) return;

    const gl = this.gl;

    // Auto clear
    if ( this.autoClear ) {
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    }

    // Allow scene to prepare per-frame (e.g., update IBL)
    scene.preRender?.( this );

    // Update global state (camera matrices)
    camera.updateMatrixWorld?.();

    // Basic traversal: depth-first, insertion order
    this.drawCalls = 0;
    this._currentProgram = null;

    const visibleMeshes = [];
    // Gather visible meshes (simple traversal)
    scene.traverse( ( node ) => {
      if ( node.visible === false ) return;
      if ( node.type === 'Mesh' || node.isMesh ) visibleMeshes.push( node );
    } );

    // Optional: sort by material/program to reduce state changes
    visibleMeshes.sort( ( a, b ) => {
      const ma = a.material && (a.material.program || a.material.type);
      const mb = b.material && (b.material.program || b.material.type);
      if ( ma === mb ) return 0;
      return ( ma > mb ) ? 1 : -1;
    } );

    // Issue draw for each mesh
    for ( const mesh of visibleMeshes ) {
      // Prepare geometry & material
      if ( mesh.geometry ) this.uploadGeometry( mesh.geometry );
      if ( mesh.material ) this.uploadMaterial( mesh.material );

      // Let mesh run its own render lifecycle hook (optional)
      mesh.onBeforeRender?.( this );

      // Draw
      this.drawMesh( mesh );

      mesh.onAfterRender?.( this );
    }

    // Post-render hook
    scene.postRender?.( this );

    this.frameCount++;
    if ( this.debug ) {
      // Basic stats log
      this._logStats();
    }
  }

  /**
   * Upload geometry to GPU buffers (VBO / IBO).
   * Stores handles in this._geometries map.
   * @param {Geometry} geometry
   */
  uploadGeometry( geometry ) {
    if ( !geometry || geometry.disposed ) return;
    if ( this._geometries.has( geometry ) ) return; // already uploaded

    const gl = this.gl;
    const gpu = {};

    // Position buffer
    if ( geometry.vertices && geometry.vertices.length > 0 ) {
      gpu.positionBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, gpu.positionBuffer );
      gl.bufferData( gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW );
    }

    // Normal buffer
    if ( geometry.normals && geometry.normals.length > 0 ) {
      gpu.normalBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, gpu.normalBuffer );
      gl.bufferData( gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW );
    }

    // UV buffer
    if ( geometry.uvs && geometry.uvs.length > 0 ) {
      gpu.uvBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, gpu.uvBuffer );
      gl.bufferData( gl.ARRAY_BUFFER, geometry.uvs, gl.STATIC_DRAW );
    }

    // Index buffer
    if ( geometry.indices && geometry.indices.length > 0 ) {
      gpu.indexBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, gpu.indexBuffer );
      gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW );
      gpu.indexCount = geometry.indices.length;
      gpu.indexType = (geometry.indices instanceof Uint32Array) ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    } else {
      gpu.indexCount = geometry.vertices ? (geometry.vertices.length / 3) : 0;
      gpu.indexType = null;
    }

    // Unbind
    gl.bindBuffer( gl.ARRAY_BUFFER, null );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );

    this._geometries.set( geometry, gpu );
    geometry._gpuRef = gpu;
    geometry._needsUpdate = false;

    if ( this.debug ) console.log( '[WebGLRenderer] Geometry uploaded', geometry.name || geometry.uuid );
  }

  /**
   * Upload material/shader resources. For ShaderMaterial, compile program if needed.
   *
   * @param {Material|ShaderMaterial} material
   */
  uploadMaterial( material ) {
    if ( !material ) return;
    if ( this._materials.has( material ) && !material._needsUpdate ) return;

    // If material is ShaderMaterial (programmable), compile and cache program
    if ( material.type === 'ShaderMaterial' || material instanceof Object && material.vertexShader ) {
      // Compile program via material.compile(gl)
      if ( typeof material.compile === 'function' ) {
        material.compile( this.gl );
      }
    }

    // Mark material as uploaded (renderer-specific GPU ref can be stored)
    this._materials.set( material, { uploadedAt: Date.now() } );
    material._needsUpdate = false;

    if ( this.debug ) console.log( '[WebGLRenderer] Material uploaded', material.name || material.uuid );
  }

  /**
   * Requests renderer to prepare (upload) textures. Used by Material.update().
   * @param {Texture} texture
   */
  uploadTexture( texture ) {
    if ( !texture || texture.disposed ) return;
    if ( this._textures.has( texture ) ) return; // already uploaded

    const gl = this.gl;

    // Delegate to texture.upload(gl) if provided
    if ( typeof texture.upload === 'function' ) {
      texture.upload( gl );
      this._textures.set( texture, {uploadedAt: Date.now()} );
      texture._glTexture = texture._glTexture || texture._glTexture; // keep pointer
      if ( this.debug ) console.log( '[WebGLRenderer] Texture uploaded', texture.name );
    } else {
      // no-op or implement fallback
    }
  }

  /**
   * Update material uniforms and texture bindings before drawing.
   * Called by material.update(renderer) or by drawMesh() as precaution.
   * @param {Material|ShaderMaterial} material
   */
  updateMaterial( material ) {
    if ( !material ) return;

    // If material exposes an 'update' method it should call renderer.updateMaterial(this)
    // Here, ensure textures are uploaded and shader uniforms will get values bound.
    if ( material.textures ) {
      for ( const tex of Object.values( material.textures ) ) {
        this.uploadTexture( tex );
      }
    }
  }

  /**
   * Core draw call wrapper. Assumes geometry & material uploaded.
   * This function binds attribute buffers, sets uniforms, and issues gl.draw*.
   *
   * @param {Mesh} mesh
   */
  drawMesh( mesh ) {
    const gl = this.gl;
    if ( !mesh || !mesh.geometry || !mesh.material ) return;

    const geomGPU = this._geometries.get( mesh.geometry );
    if ( !geomGPU ) return;

    // If material is ShaderMaterial, bind its program and uniforms
    const material = mesh.material;

    if ( material.type === 'ShaderMaterial' || material.vertexShader ) {
      // Bind program
      if ( this._currentProgram !== material.program ) {
        gl.useProgram( material.program );
        this._currentProgram = material.program;
      }

      // Bind attributes: position, normal, uv
      const posLoc = gl.getAttribLocation( material.program, 'position' );
      if ( posLoc !== -1 && geomGPU.positionBuffer ) {
        gl.bindBuffer( gl.ARRAY_BUFFER, geomGPU.positionBuffer );
        gl.enableVertexAttribArray( posLoc );
        gl.vertexAttribPointer( posLoc, 3, gl.FLOAT, false, 0, 0 );
      }

      const uvLoc = gl.getAttribLocation( material.program, 'uv' );
      if ( uvLoc !== -1 && geomGPU.uvBuffer ) {
        gl.bindBuffer( gl.ARRAY_BUFFER, geomGPU.uvBuffer );
        gl.enableVertexAttribArray( uvLoc );
        gl.vertexAttribPointer( uvLoc, 2, gl.FLOAT, false, 0, 0 );
      }

      const normalLoc = gl.getAttribLocation( material.program, 'normal' );
      if ( normalLoc !== -1 && geomGPU.normalBuffer ) {
        gl.bindBuffer( gl.ARRAY_BUFFER, geomGPU.normalBuffer );
        gl.enableVertexAttribArray( normalLoc );
        gl.vertexAttribPointer( normalLoc, 3, gl.FLOAT, false, 0, 0 );
      }

      // Bind element array if present
      if ( geomGPU.indexBuffer ) {
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, geomGPU.indexBuffer );
      }

      // Bind per-mesh uniforms: modelViewMatrix, projectionMatrix
      const modelViewMatrix = mesh.modelViewMatrix || mesh.matrixWorld; // assume engine fills modelViewMatrix
      const projectionMatrix = mesh.projectionMatrix || (mesh.camera && mesh.camera.projectionMatrix) || null;

      const mvLoc = gl.getUniformLocation( material.program, 'modelViewMatrix' );
      if ( mvLoc && modelViewMatrix && typeof modelViewMatrix.toArray === 'function' ) {
        gl.uniformMatrix4fv( mvLoc, false, modelViewMatrix.toArray() );
      }

      const projLoc = gl.getUniformLocation( material.program, 'projectionMatrix' );
      if ( projLoc && projectionMatrix && typeof projectionMatrix.toArray === 'function' ) {
        gl.uniformMatrix4fv( projLoc, false, projectionMatrix.toArray() );
      }

      // Let material bind its own uniforms & textures
      material.bind?.( gl );
    } else {
      // Fallback: basic fixed-pipeline-like rendering not implemented
      return;
    }

    // Issue draw
    if ( geomGPU.indexBuffer ) {
      gl.drawElements( gl.TRIANGLES, geomGPU.indexCount, geomGPU.indexType, 0 );
    } else {
      gl.drawArrays( gl.TRIANGLES, 0, geomGPU.indexCount );
    }
    this.drawCalls++;

    // Unbind buffers to avoid accidental state bleed
    gl.bindBuffer( gl.ARRAY_BUFFER, null );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
  }

  /**
   * Logs basic rendering stats (debug only).
   * @private
   */
  _logStats() {
    console.log( `[WebGLRenderer] frame=${this.frameCount} drawCalls=${this.drawCalls}` );
  }

  /**
   * Destroy renderer and free GPU resources (buffers, programs, textures).
   */
  destroy() {
    if ( this.destroyed ) return;
    const gl = this.gl;

    // Delete geometry buffers
    for ( const [geom, gpu] of this._geometries ) {
      try {
        gpu.positionBuffer && gl.deleteBuffer( gpu.positionBuffer );
        gpu.normalBuffer && gl.deleteBuffer( gpu.normalBuffer );
        gpu.uvBuffer && gl.deleteBuffer( gpu.uvBuffer );
        gpu.indexBuffer && gl.deleteBuffer( gpu.indexBuffer );
      } catch ( e ) {
        // ignore
      }
    }
    this._geometries = new WeakMap();

    // Delete shader programs
    for ( const material of this._materials.keys ? Array.from( this._materials.keys() ) : [] ) {
      try {
        if ( material.program ) gl.deleteProgram( material.program );
      } catch ( e ) {}
    }
    this._materials = new WeakMap();

    // Delete textures
    for ( const tex of this._textures.keys ? Array.from( this._textures.keys() ) : [] ) {
      try {
        tex.dispose?.( gl );
      } catch ( e ) {}
    }
    this._textures = new WeakMap();

    this.destroyed = true;
    if ( this.debug ) console.log( '[WebGLRenderer] Destroyed and resources released' );
  }
}

// Export both classes
export { Renderer, WebGLRenderer };

/* ============================================================
   Simple internal test helper for renderer basic sanity:
   - Can create WebGL context
   - Can upload a tiny geometry
   - Can compile default ShaderMaterial and perform one draw call
   Note: This test should be run in a browser environment with WebGL.
   ============================================================ */

export async function dsrtTestRenderer() {
  // Create a small canvas and renderer
  const canvas = document.createElement( 'canvas' );
  canvas.width = 64;
  canvas.height = 64;
  const renderer = new WebGLRenderer( { canvas, debug: false } );
  try {
    renderer.init();
  } catch ( e ) {
    return false;
  }

  // Mock geometry + mesh + simple shader material (minimal)
  const { Geometry } = await import( './Geometry.js' );
  const { Mesh } = await import( './Mesh.js' );
  const { ShaderMaterial } = await import( './ShaderMaterial.js' );

  const geom = new Geometry( { vertices: [0,0,0, 0,1,0, 1,0,0], indices: [0,1,2] } );
  const mat = new ShaderMaterial();
  const mesh = new Mesh( geom, mat );

  // Mock camera minimal object with projectionMatrix
  const camera = { projectionMatrix: { toArray: () => new Float32Array(16) }, updateMatrixWorld: () => {} };

  const scene = new (await import( './Scene.js' )).Scene();
  scene.add( mesh );

  try {
    renderer.render( scene, camera );
  } catch ( e ) {
    console.warn( '[Renderer test] render failed', e );
    renderer.destroy();
    return false;
  }

  renderer.destroy();
  return true;
}
