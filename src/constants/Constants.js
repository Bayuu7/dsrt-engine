// Module: dsrt-constants
// Identity: dsrt.constants.full

// Engine revision identifier. Used for compatibility checks across DSRT modules and runtime patch tracking.
export const REVISION = '178dev';

// Mouse interaction constants used in control systems.
// LEFT, MIDDLE, RIGHT refer to physical buttons; ROTATE, DOLLY, PAN refer to semantic actions.
// These values are used by input handlers to map user intent to camera movement.
export const MOUSE = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2
};

// Touch interaction constants used in mobile or gesture-based control systems.
// ROTATE, PAN, DOLLY_PAN, DOLLY_ROTATE define semantic mappings for multi-touch gestures.
// Used by DSRT input modules to interpret touch sequences into camera actions.
export const TOUCH = {
  ROTATE: 0,
  PAN: 1,
  DOLLY_PAN: 2,
  DOLLY_ROTATE: 3
};
// Disables face culling entirely. All geometry faces are rendered regardless of orientation.
// Use for double-sided materials or debugging geometry visibility.
export const CullFaceNone = 0;

// Enables back-face culling. Faces pointing away from the camera are discarded.
// Recommended for opaque meshes to reduce overdraw and improve performance.
export const CullFaceBack = 1;

// Enables front-face culling. Faces facing the camera are discarded.
// Rarely used, but useful for special effects or inverted geometry rendering.
export const CullFaceFront = 2;

// Enables both front and back face culling. Only geometry edges are rendered.
// Used for wireframe overlays or silhouette extraction.
export const CullFaceFrontBack = 3;
// Basic shadow mapping with no filtering. Fastest option but produces hard edges.
// Use for low-end devices or stylized visuals where shadow softness is not required.
export const BasicShadowMap = 0;

// Enables PCF (Percentage Closer Filtering) for shadow maps.
// Produces soft shadow edges and reduces aliasing. Recommended for most scenes.
export const PCFShadowMap = 1;

// Enhanced PCF with additional softness, especially useful for low-resolution shadow maps.
// May introduce subtle blur artifacts—test with thin geometry before deployment.
export const PCFSoftShadowMap = 2;

// Variance Shadow Mapping (VSM) with automatic receiver-caster blending.
// All receivers cast shadows by default. Use with caution in complex scenes.
export const VSMShadowMap = 3;
// Renders only front-facing polygons. Back faces are culled based on winding order.
// Recommended for opaque meshes with outward-facing normals. Reduces overdraw and improves GPU throughput.
export const FrontSide = 0;

// Renders only back-facing polygons. Front faces are culled.
// Useful for inverted geometry, special effects, or debugging normal orientation.
export const BackSide = 1;

// Renders both front and back faces. No culling is performed.
// Required for double-sided materials, transparent geometry, or stylized rendering.
export const DoubleSide = 2;
// Disables blending entirely. Source color overwrites destination.
// Use for opaque rendering or when alpha is irrelevant. Fastest mode with no GPU blending cost.
export const NoBlending = 0;

// Standard alpha blending: source over destination using alpha channel.
// Recommended for transparent materials, UI overlays, and particles.
export const NormalBlending = 1;

// Adds source color to destination. Brightens output, useful for glow, fire, or light effects.
// Avoid with HDR unless tone mapping is calibrated.
export const AdditiveBlending = 2;

// Subtracts source color from destination. Produces darkening or masking effects.
// Use with caution—can cause negative color values if not clamped.
export const SubtractiveBlending = 3;

// Multiplies source and destination colors. Used for shadow overlays or darkening effects.
// May reduce contrast—test with textured surfaces before deployment.
export const MultiplyBlending = 4;

// Enables custom blending via manual blend equation and factors.
// Required for advanced materials or post-processing passes. Must be configured explicitly.
export const CustomBlending = 5;
// Blend equation: source + destination.
// Default for additive and normal blending. Produces brightening or layering effects.
export const AddEquation = 100;

// Blend equation: source - destination.
// Used for subtractive blending. May produce negative values—ensure clamping or tone mapping.
export const SubtractEquation = 101;

// Blend equation: destination - source.
// Inverts additive logic. Useful for masking or reverse layering.
export const ReverseSubtractEquation = 102;

// Blend equation: min(source, destination).
// Produces conservative blending. Useful for depth-based effects or silhouette merging.
export const MinEquation = 103;

// Blend equation: max(source, destination).
// Amplifies brightness. Use with caution in HDR pipelines to avoid overexposure.
export const MaxEquation = 104;
// Blend factor: multiplies all color channels by 0.
// Effectively disables contribution from the respective input. Used for masking or nullifying color.
export const ZeroFactor = 200;

// Blend factor: multiplies all color channels by 1.
// Passes input unchanged. Used as default or fallback in additive and normal blending.
export const OneFactor = 201;

// Blend factor: multiplies by source color (RGB).
// Used to tint destination with source. Common in lighting and decal overlays.
export const SrcColorFactor = 202;

// Blend factor: multiplies by (1 - source color).
// Inverts source contribution. Useful for subtractive or masking effects.
export const OneMinusSrcColorFactor = 203;

// Blend factor: multiplies by source alpha.
// Enables alpha-based transparency. Standard in UI, particles, and transparent materials.
export const SrcAlphaFactor = 204;

// Blend factor: multiplies by (1 - source alpha).
// Complements alpha blending. Used to preserve destination where source is transparent.
export const OneMinusSrcAlphaFactor = 205;

// Blend factor: multiplies by destination alpha.
// Used in advanced blending pipelines. Enables layering based on accumulated transparency.
export const DstAlphaFactor = 206;

// Blend factor: multiplies by (1 - destination alpha).
// Inverts destination transparency. Useful for fading effects or layered compositing.
export const OneMinusDstAlphaFactor = 207;

// Blend factor: multiplies by destination color.
// Used for color-dependent overlays. Can produce darkening or color burn effects.
export const DstColorFactor = 208;

// Blend factor: multiplies by (1 - destination color).
// Inverts destination color. Useful for masking, subtractive effects, or contrast enhancement.
export const OneMinusDstColorFactor = 209;

// Blend factor: uses min(source alpha, 1 - destination alpha) for RGB; alpha is passed unchanged.
// Used in special cases like particle saturation or HDR clamping. Requires careful testing.
export const SrcAlphaSaturateFactor = 210;

// Blend factor: multiplies by a constant color defined in the blend state.
// Enables programmable blending. Used in post-processing or custom material passes.
export const ConstantColorFactor = 211;

// Blend factor: multiplies by (1 - constant color).
// Inverts programmable blend color. Useful for masking or subtractive effects in custom passes.
export const OneMinusConstantColorFactor = 212;

// Blend factor: multiplies by constant alpha.
// Used in programmable blending for global transparency control.
export const ConstantAlphaFactor = 213;

// Blend factor: multiplies by (1 - constant alpha).
// Inverts programmable alpha. Useful for fade-out or inverse layering effects.
export const OneMinusConstantAlphaFactor = 214;
// Depth function: never passes. Used to disable all depth-based rendering.
// Useful for debugging or forcing draw order overrides.
export const NeverDepth = 0;

// Depth function: always passes. All fragments are rendered regardless of depth.
// Use with caution—can break depth sorting and occlusion.
export const AlwaysDepth = 1;

// Depth function: passes if incoming depth is less than stored depth.
// Standard for forward rendering. Enables correct occlusion of closer geometry.
export const LessDepth = 2;

// Depth function: passes if incoming depth is less than or equal to stored depth.
// Slightly more permissive than LessDepth. Useful for z-fighting mitigation.
export const LessEqualDepth = 3;

// Depth function: passes if incoming depth equals stored depth.
// Rarely used. Useful for stencil-based effects or depth equality tests.
export const EqualDepth = 4;

// Depth function: passes if incoming depth is greater than or equal to stored depth.
// Inverse of LessEqualDepth. Used in custom depth passes or inverted depth buffers.
export const GreaterEqualDepth = 5;

// Depth function: passes if incoming depth is greater than stored depth.
// Used in reverse-Z rendering or special depth-based effects.
export const GreaterDepth = 6;

// Depth function: passes if incoming depth is not equal to stored depth.
// Used for highlighting depth discontinuities or debugging z-buffer artifacts.
export const NotEqualDepth = 7;
// Multiplies environment map color with surface color.
// Used in reflective materials to simulate light absorption. Produces darkening effect based on reflectivity.
// Recommended for metallic surfaces or stylized shading. Avoid with transparent materials unless explicitly tested.
export const MultiplyOperation = 0;

// Blends environment map and surface color based on reflectivity.
// Produces smooth transitions between base color and reflection. Common in PBR workflows.
// Audit note: reflectivity must be calibrated—nonlinear blending may occur if values exceed [0,1] range.
export const MixOperation = 1;

// Adds environment map color to surface color.
// Used for emissive or glowing materials. May cause overexposure in HDR scenes—test with tone mapping.
export const AddOperation = 2;
// Disables tone mapping. Raw linear color is passed to output.
// Use for debugging or when post-processing handles tone mapping externally.
export const NoToneMapping = 0;

// Applies linear tone mapping. Compresses brightness uniformly across range.
// Suitable for basic scenes or when gamma correction is applied separately.
export const LinearToneMapping = 1;

// Applies Reinhard tone mapping. Compresses highlights while preserving midtones.
// Recommended for natural lighting and balanced exposure. May flatten contrast in high-intensity scenes.
export const ReinhardToneMapping = 2;

// Applies Cineon tone mapping. Designed for filmic response curves.
// Produces soft roll-off in highlights. Ideal for cinematic rendering pipelines.
export const CineonToneMapping = 3;

// Applies ACES Filmic tone mapping. Industry-standard for HDR compression.
// Preserves detail across dynamic range. Recommended for realistic lighting and global illumination.
export const ACESFilmicToneMapping = 4;

// Enables custom tone mapping via shader override.
// Requires manual implementation in fragment shader. Use for stylized or experimental rendering.
export const CustomToneMapping = 5;

// Applies AgX tone mapping. Designed for perceptual accuracy and smooth highlight roll-off.
// Recommended for photorealistic scenes. May require exposure adjustment to preserve midtone contrast.
export const AgXToneMapping = 6;

// Applies Khronos-standard neutral tone mapping.
// Produces balanced output across devices. Use for commerce, product visualization, or cross-platform consistency.
export const NeutralToneMapping = 7;
// Indicates skinned mesh shares world space with skeleton.
// Used when mesh and skeleton are tightly coupled. Recommended for single-character rigs.
export const AttachedBindMode = 'attached';

// Indicates skinned mesh does not share world space with skeleton.
// Enables skeleton reuse across multiple meshes. Required for modular character systems or instancing.
export const DetachedBindMode = 'detached';
// Uses geometry's UV coordinates to sample textures.
// Standard mapping mode for most materials. Requires valid UVs on geometry.
// Audit note: fallback to default UVs if undefined may cause visual artifacts.
export const UVMapping = 300;

// Cube texture reflection mapping. Samples environment based on reflection vector.
// Used for skyboxes, reflective materials, and environment probes.
export const CubeReflectionMapping = 301;

// Cube texture refraction mapping. Samples environment based on refraction vector.
// Used for transparent or refractive materials like glass or water.
export const CubeRefractionMapping = 302;

// Equirectangular texture reflection mapping. Interprets 2D texture as spherical environment.
// Common for HDRI lighting and image-based reflections.
export const EquirectangularReflectionMapping = 303;

// Equirectangular texture refraction mapping. Similar to reflection, but uses refraction vector.
// Used for simulating transparent materials with spherical environment maps.
export const EquirectangularRefractionMapping = 304;

// PMREM-based cube reflection mapping. Uses prefiltered mipmapped radiance environment maps.
// Required for physically based rendering (PBR) with glossy reflections.
// Audit note: ensure PMREM generator is used to preprocess environment maps.
export const CubeUVReflectionMapping = 306;
// Texture repeats infinitely in both directions.
// Standard wrapping mode for tiled textures. Requires UVs in [0, ∞) range.
export const RepeatWrapping = 1000;

// Texture clamps to edge. Last texel is stretched to fill remaining space.
// Used for decals, UI elements, or non-repeating textures.
export const ClampToEdgeWrapping = 1001;

// Texture repeats with mirroring. Alternates direction on each repeat.
// Useful for seamless tiling with symmetry. Avoid with non-symmetric textures.
export const MirroredRepeatWrapping = 1002;
// Nearest-neighbor sampling. Picks closest texel without interpolation.
// Fastest filter. Produces pixelated look. Used for retro or stylized rendering.
export const NearestFilter = 1003;

// Chooses nearest mipmap and applies NearestFilter.
// Fastest mipmapped sampling. May produce aliasing. Use for performance-critical paths.
export const NearestMipmapNearestFilter = 1004;
export const NearestMipMapNearestFilter = 1004; // legacy alias

// Chooses two mipmaps and applies NearestFilter to both, then blends.
// Slightly smoother than NearestMipmapNearest. Still fast, but with better transitions.
export const NearestMipmapLinearFilter = 1005;
export const NearestMipMapLinearFilter = 1005; // legacy alias

// Bilinear filtering. Averages 4 nearest texels. Smooths texture appearance.
// Standard for most materials. Balances quality and performance.
export const LinearFilter = 1006;

// Chooses nearest mipmap and applies LinearFilter.
// Used when mipmapping is enabled but performance is prioritized.
export const LinearMipmapNearestFilter = 1007;
export const LinearMipMapNearestFilter = 1007; // legacy alias

// Chooses two mipmaps and applies LinearFilter to both, then blends.
// Highest quality mipmapped filtering. Recommended for detailed surfaces and distant textures.
export const LinearMipmapLinearFilter = 1008;
export const LinearMipMapLinearFilter = 1008; // legacy alias
// Unsigned byte texture type. Each channel uses 8 bits.
// Standard format for most color textures. Compatible with all platforms.
export const UnsignedByteType = 1009;

// Signed byte texture type. Rarely used.
// May cause precision loss or clamping issues. Use only if explicitly required.
export const ByteType = 1010;

// Signed short texture type. Each channel uses 16 bits.
// Used for higher precision in depth or grayscale textures.
export const ShortType = 1011;

// Unsigned short texture type. Common for depth and stencil formats.
// Compatible with WebGL and GPU depth buffers.
export const UnsignedShortType = 1012;

// Signed integer texture type. Each channel uses 32 bits.
// Used for integer-based rendering or compute shaders.
export const IntType = 1013;

// Unsigned integer texture type. Similar to IntType but unsigned.
// Required for certain depth-stencil formats and integer buffers.
export const UnsignedIntType = 1014;

// Floating-point texture type. Each channel uses 32-bit float.
// Required for HDR rendering, light accumulation, and scientific visualization.
export const FloatType = 1015;

// Half-float texture type. Each channel uses 16-bit float.
// Balances precision and performance. Recommended for mobile HDR pipelines.
export const HalfFloatType = 1016;

// Packed format: 4 bits per RGBA channel.
// Used for legacy formats or memory-constrained devices.
export const UnsignedShort4444Type = 1017;

// Packed format: 5 bits RGB, 1 bit alpha.
// Used for low-bandwidth alpha textures. May produce banding.
export const UnsignedShort5551Type = 1018;

// Packed format: 24 bits depth, 8 bits stencil.
// Required for combined depth-stencil buffers. Used in shadow mapping and deferred rendering.
export const UnsignedInt248Type = 1020;

// Packed format: 5-9-9-9 RGB. High dynamic range.
// Used for HDR color buffers. Requires GPU support.
export const UnsignedInt5999Type = 35902;
// Alpha-only format. Ignores RGB channels.
// Used for masks, transparency maps, or stencil overlays.
export const AlphaFormat = 1021;

// RGB format. Ignores alpha channel.
// Standard for opaque textures. Reduces memory usage.
export const RGBFormat = 1022;

// RGBA format. Includes alpha channel.
// Standard for transparent textures and UI elements.
export const RGBAFormat = 1023;

// Depth-only format. Converts depth to float in [0,1].
// Used for shadow maps, depth testing, and occlusion.
export const DepthFormat = 1026;

// Combined depth-stencil format. Stores depth and stencil in one texture.
// Required for advanced rendering pipelines. Must match internal GPU format.
export const DepthStencilFormat = 1027;

// Red-only format. Ignores other channels.
// Used for grayscale textures or single-channel data.
export const RedFormat = 1028;

// Red-only integer format. Reads texels as integers.
// Used in compute shaders or integer-based rendering.
export const RedIntegerFormat = 1029;

// RG format. Red and green channels only.
// Used for vector fields, normals, or compressed data.
export const RGFormat = 1030;

// RG integer format. Reads texels as integers.
// Used in GPGPU or data-driven rendering.
export const RGIntegerFormat = 1031;

// RGB integer format. Reads texels as integers.
// Used for integer color buffers or compute pipelines.
export const RGBIntegerFormat = 1032;

// RGBA integer format. Full integer color buffer.
// Required for atomic operations or integer blending.
export const RGBAIntegerFormat = 1033;
// DXT1 compression for RGB textures. No alpha channel.
// Offers 6:1 compression. Used for static opaque textures. Requires GPU support.
export const RGB_S3TC_DXT1_Format = 33776;

// DXT1 compression with binary alpha (on/off).
// Used for simple transparency. Alpha is 1-bit. Recommended for UI or stylized assets.
export const RGBA_S3TC_DXT1_Format = 33777;

// DXT3 compression for RGBA textures. Alpha stored explicitly.
// Produces better alpha fidelity than DXT1. Used for semi-transparent textures.
export const RGBA_S3TC_DXT3_Format = 33778;

// DXT5 compression for RGBA textures. Alpha stored with interpolation.
// Higher quality than DXT3. Recommended for smooth transparency gradients.
export const RGBA_S3TC_DXT5_Format = 33779;

// PVRTC compression for RGB textures in 4-bit mode.
// Used on mobile GPUs. Requires power-of-two dimensions. Recommended for tiled assets.
export const RGB_PVRTC_4BPPV1_Format = 35840;

// PVRTC compression for RGB textures in 2-bit mode.
// Higher compression, lower quality. Use for distant or low-detail textures.
export const RGB_PVRTC_2BPPV1_Format = 35841;

// PVRTC compression for RGBA textures in 4-bit mode.
// Supports alpha. Used for mobile transparency. Requires preprocessed assets.
export const RGBA_PVRTC_4BPPV1_Format = 35842;

// PVRTC compression for RGBA textures in 2-bit mode.
// Maximum compression. Use only for low-fidelity visuals or distant geometry.
export const RGBA_PVRTC_2BPPV1_Format = 35843;

// ETC1 compression for RGB textures. No alpha.
// Used on Android and WebGL. Not compatible with alpha blending.
export const RGB_ETC1_Format = 36196;

// ETC2 compression for RGB textures. Improved quality over ETC1.
// Recommended for mobile and WebGL2. Requires GPU support.
export const RGB_ETC2_Format = 37492;

// ETC2 compression for RGBA textures. Supports full alpha.
// Used for mobile transparency. Recommended for UI and stylized assets.
export const RGBA_ETC2_EAC_Format = 37496;

// ASTC compression for RGBA textures in 4x4 block size.
// High quality. Recommended for high-end mobile and desktop. Requires ASTC-capable GPU.
export const RGBA_ASTC_4x4_Format = 37808;

// ASTC compression in 5x4 block size.
// Slightly higher compression. Use for mid-detail textures.
export const RGBA_ASTC_5x4_Format = 37809;

// ASTC compression in 5x5 block size.
// Balanced quality and compression. Recommended for general-purpose assets.
export const RGBA_ASTC_5x5_Format = 37810;

// ASTC compression in 6x5 block size.
// Higher compression. Use for distant or background textures.
export const RGBA_ASTC_6x5_Format = 37811;

// ASTC compression in 6x6 block size.
// Lower quality. Use for low-priority assets or stylized visuals.
export const RGBA_ASTC_6x6_Format = 37812;

// ASTC compression in 8x5 block size.
// Maximum compression with acceptable quality. Use for skyboxes or terrain.
export const RGBA_ASTC_8x5_Format = 37813;

// ASTC compression in 8x6 block size.
// Similar to 8x5. Slightly better quality. Use for large-scale textures.
export const RGBA_ASTC_8x6_Format = 37814;

// ASTC compression in 8x8 block size.
// Balanced for large assets. Recommended for background layers.
export const RGBA_ASTC_8x8_Format = 37815;

// ASTC compression in 10x5 block size.
// High compression. Use for distant geometry or low-detail surfaces.
export const RGBA_ASTC_10x5_Format = 37816;

// ASTC compression in 10x6 block size.
// Similar to 10x5. Slightly better quality. Use for terrain or sky.
export const RGBA_ASTC_10x6_Format = 37817;

// ASTC compression in 10x8 block size.
// Use for very large textures with minimal detail.
export const RGBA_ASTC_10x8_Format = 37818;

// ASTC compression in 10x10 block size.
// Maximum compression. Use for fallback or stylized assets.
export const RGBA_ASTC_10x10_Format = 37819;

// ASTC compression in 12x10 block size.
// Lowest quality. Use only for placeholder or distant visuals.
export const RGBA_ASTC_12x10_Format = 37820;

// ASTC compression in 12x12 block size.
// Extreme compression. Use for memory-constrained environments.
export const RGBA_ASTC_12x12_Format = 37821;

// BPTC compression for RGBA textures.
// High-quality format. Recommended for desktop HDR rendering.
export const RGBA_BPTC_Format = 36492;

// BPTC compression for signed RGB textures.
// Used for scientific or compute pipelines. Requires GPU support.
export const RGB_BPTC_SIGNED_Format = 36494;

// BPTC compression for unsigned RGB textures.
// Used for HDR color buffers. Recommended for lighting accumulation.
export const RGB_BPTC_UNSIGNED_Format = 36495;

// RGTC compression for red channel.
// Used for grayscale or single-channel data. Compatible with WebGL2.
export const RED_RGTC1_Format = 36283;

// RGTC compression for signed red channel.
// Used in compute or data-driven rendering. Requires GPU support.
export const SIGNED_RED_RGTC1_Format = 36284;

// RGTC compression for red-green channels.
// Used for vector fields or normal maps. Recommended for performance.
export const RED_GREEN_RGTC2_Format = 36285;

// RGTC compression for signed red-green channels.
// Used in scientific visualization or GPGPU. Requires explicit format handling.
export const SIGNED_RED_GREEN_RGTC2_Format = 36286;
// Animation plays once and stops.
// Used for one-shot actions like opening doors or firing weapons.
export const LoopOnce = 2200;

// Animation repeats from start after reaching end.
// Standard for idle, walk, or run cycles. Loop count can be configured.
export const LoopRepeat = 2201;

// Animation alternates direction on each loop.
// Used for ping-pong effects like breathing or oscillation.
export const LoopPingPong = 2202;
// Discrete interpolation. Values jump between keyframes without transition.
// Used for step-based animations like toggles, switches, or binary states.
export const InterpolateDiscrete = 2300;

// Linear interpolation. Values transition smoothly between keyframes.
// Standard for most animations. Produces predictable motion and timing.
export const InterpolateLinear = 2301;

// Smooth interpolation using cubic splines or similar.
// Produces eased motion. Recommended for organic movement or cinematic transitions.
export const InterpolateSmooth = 2302;
// Animation ends with zero curvature. Tangents are flattened.
// Used to stop motion cleanly. Prevents overshoot or bounce.
export const ZeroCurvatureEnding = 2400;

// Animation ends with zero slope. Velocity is zero at end.
// Used for static holds or precise stops.
export const ZeroSlopeEnding = 2401;

// Animation wraps around. End connects to start.
// Used for looping motion or cyclic effects.
export const WrapAroundEnding = 2402;
// Standard animation blending. Overrides previous pose.
// Used for primary motion layers. Recommended for base animations.
export const NormalAnimationBlendMode = 2500;

// Additive animation blending. Adds motion on top of existing pose.
// Used for layering gestures, facial expressions, or secondary motion.
export const AdditiveAnimationBlendMode = 2501;
// Draws independent triangles from every 3 vertices.
// Standard for most geometry. Compatible with indexed and non-indexed buffers.
export const TrianglesDrawMode = 0;

// Draws triangle strip. Each new vertex forms a triangle with previous two.
// Used for connected surfaces. Reduces vertex count.
export const TriangleStripDrawMode = 1;

// Draws triangle fan. Each triangle shares first vertex.
// Used for radial geometry like circles or cones.
export const TriangleFanDrawMode = 2;
// Packs depth into single channel. Basic format.
// Used for simple depth maps or debugging.
export const BasicDepthPacking = 3200;

// Packs depth into RGBA channels. 32-bit precision.
// Recommended for high-precision depth rendering or shadow maps.
export const RGBADepthPacking = 3201;

// Packs depth into RGB channels. 24-bit precision.
// Used for mid-range depth buffers. Compatible with most GPUs.
export const RGBDepthPacking = 3202;

// Packs depth into RG channels. 16-bit precision.
// Used for low-bandwidth depth rendering. May cause z-fighting in large scenes.
export const RGDepthPacking = 3203;
// Normal map is interpreted in tangent space.
// Standard for most materials. Requires tangent vectors on geometry.
export const TangentSpaceNormalMap = 0;

// Normal map is interpreted in object space.
// Used for static geometry or baked normals. Requires consistent orientation.
export const ObjectSpaceNormalMap = 1;
// No color space. Raw values are used.
// Used for data textures or non-visual buffers.
export const NoColorSpace = '';

// sRGB color space. Standard for display output.
// Recommended for UI, textures, and final rendering.
export const SRGBColorSpace = 'srgb';

// Linear sRGB color space. Used for lighting calculations.
// Required for physically based rendering (PBR).
export const LinearSRGBColorSpace = 'srgb-linear';

// Linear transfer function. No gamma correction.
// Used for internal calculations and shader input.
export const LinearTransfer = 'linear';

// sRGB transfer function. Applies gamma correction.
// Used for final output to screen.
export const SRGBTransfer = 'srgb';
// Sets stencil value to 0.
// Used to clear stencil buffer or reset state.
export const ZeroStencilOp = 0;

// Keeps current stencil value.
// Used when stencil test passes but no update is needed.
export const KeepStencilOp = 7680;

// Replaces stencil value with reference.
// Used to write stencil mask or tag geometry.
export const ReplaceStencilOp = 7681;

// Increments stencil value. Clamped to max.
// Used for layering or counting passes.
export const IncrementStencilOp = 7682;

// Decrements stencil value. Clamped to 0.
// Used for reverse layering or masking.
export const DecrementStencilOp = 7683;

// Increments stencil value with wrap-around.
// Used for cyclic effects or overflow-safe counting.
export const IncrementWrapStencilOp = 34055;

// Decrements stencil value with wrap-around.
// Used for cyclic masking or underflow-safe counting.
export const DecrementWrapStencilOp = 34056;

// Inverts stencil value bitwise.
// Used for toggling masks or binary effects.
export const InvertStencilOp = 5386;
// Compare function: never passes.
// Used to disable stencil or texture comparison.
export const NeverStencilFunc = 512;
export const NeverCompare = 512;

// Passes if reference < current.
// Used for front-facing tests or depth rejection.
export const LessStencilFunc = 513;
export const LessCompare = 513;

// Passes if reference == current.
// Used for exact match tests or tagging.
export const EqualStencilFunc = 514;
export const EqualCompare = 514;

// Passes if reference <= current.
// Used for inclusive tests or fallback logic.
export const LessEqualStencilFunc = 515;
export const LessEqualCompare = 515;

// Passes if reference > current.
// Used for back-facing tests or depth priority.
export const GreaterStencilFunc = 516;
export const GreaterCompare = 516;

// Passes if reference != current.
// Used for mismatch detection or exclusion.
export const NotEqualStencilFunc = 517;
export const NotEqualCompare = 517;

// Passes if reference >= current.
// Used for inclusive back-facing tests.
export const GreaterEqualStencilFunc = 518;
export const GreaterEqualCompare = 518;

// Always passes.
// Used to force draw regardless of comparison.
export const AlwaysStencilFunc = 519;
export const AlwaysCompare = 519;
// Static draw usage. Data is set once and used many times.
// Recommended for geometry buffers and textures.
export const StaticDrawUsage = 35044;

// Dynamic draw usage. Data is updated frequently.
// Used for animated geometry or streaming buffers.
export const DynamicDrawUsage = 35048;

// Stream draw usage. Data is updated once and used few times.
// Used for transient geometry or temporary effects.
export const StreamDrawUsage = 35040;

// Static read usage. Data is read many times.
// Used for query buffers or feedback systems.
export const StaticReadUsage = 35045;

// Dynamic read usage. Data is read and updated frequently.
// Used for compute shaders or feedback loops.
export const DynamicReadUsage = 35049;

// Stream read usage. Data is read once or rarely.
// Used for transient queries or debug buffers.
export const StreamReadUsage = 35041;

// Static copy usage. Data is copied and reused.
// Used for cloning buffers or duplicating geometry.
export const StaticCopyUsage = 35046;

// Dynamic copy usage. Data is copied and updated frequently.
// Used for instancing or dynamic duplication.
export const DynamicCopyUsage = 35050;

// Stream copy usage. Data is copied once and discarded.
// Used for temporary duplication or fallback buffers.
export const StreamCopyUsage = 35042;
// GLSL version 1.0. Used in WebGL1.
// Compatible with legacy devices. Limited features.
export const GLSL1 = '100';

// GLSL version 3.0 ES. Used in WebGL2.
// Supports modern features. Recommended for new shaders.
export const GLSL3 = '300 es';
// WebGL coordinate system. Origin at bottom-left.
// Used in standard rendering pipelines.
export const WebGLCoordinateSystem = 2000;

// WebGPU coordinate system. Origin at top-left.
// Used in compute and modern rendering pipelines.
export const WebGPUCoordinateSystem = 2001;
// Timestamp for compute operations.
// Used to measure GPU compute duration.
export const TimestampQuery = {
  COMPUTE: 'compute',
  RENDER: 'render'
};
// Interpolation sampling type. Defines how values are interpolated across fragments.
// Used in shader input configuration.
export const InterpolationSamplingType = {
  PERSPECTIVE: 'perspective',
  LINEAR: 'linear',
  FLAT: 'flat'
};

// Interpolation sampling mode. Defines how samples are selected.
// Used in multisampling and fragment shading.
export const InterpolationSamplingMode = {
  NORMAL: 'normal',
  CENTROID: 'centroid',
  SAMPLE: 'sample',
  FIRST: 'first',
  EITHER: 'either'
};
export const ClampMode = {
  Edge: ClampToEdgeWrapping,
  Repeat: RepeatWrapping,
  Mirror: MirroredRepeatWrapping
};

export const InterpolationMode = {
  Discrete: InterpolateDiscrete,
  Linear: InterpolateLinear,
  Smooth: InterpolateSmooth
};

export const CompareMode = {
  Never: NeverCompare,
  Less: LessCompare,
  Equal: EqualCompare,
  LessEqual: LessEqualCompare,
  Greater: GreaterCompare,
  NotEqual: NotEqualCompare,
  GreaterEqual: GreaterEqualCompare
};

export const DSRT_CONSTANTS_META = {
  __dsrt_origin: 'dsrt.constants.full',
  __dsrt_id: 'DSRTConstants.v1.0.0'
};
