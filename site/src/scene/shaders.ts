// GLSL for the particle field. Colours are passed as raw sRGB values and written
// straight to the framebuffer, so what you set is what you see.

export const BANDS = 8;

export const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBands[${BANDS}];   // per-band mode weights (ads, research, maps)
  uniform float uPixelRatio;
  uniform float uPointScale;        // css viewport height / (2 * tan(fov / 2))
  uniform vec2 uShift;              // screen-space offset in NDC
  uniform vec4 uMask;               // xy: fade in from the left between these NDC x; zw: fade out toward the top between these NDC y
  uniform float uFade;

  uniform vec3 uAdsLow;
  uniform vec3 uAdsHigh;
  uniform vec3 uAdsHot;
  uniform vec3 uInk;
  uniform vec3 uInkAccent;
  uniform vec3 uMapLow;
  uniform vec3 uMapHigh;
  uniform vec3 uMapRoad;

  attribute vec3 aAds;
  attribute vec3 aResearch;
  attribute vec3 aMaps;
  attribute vec3 aValue;
  attribute vec3 aSize;
  attribute vec2 aSeed;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vAdditive;

  void main() {
    // Each point reads its own blend of two neighbouring bands, so some lead and some trail.
    float fb = aSeed.y * float(${BANDS - 1});
    int i0 = int(floor(fb));
    int i1 = min(i0 + 1, ${BANDS - 1});
    vec3 w = mix(uBands[i0], uBands[i1], fract(fb));
    w = max(w, vec3(0.0));
    w /= max(w.x + w.y + w.z, 0.0001);

    // Idle life, per formation.
    vec3 ads = aAds;
    ads.y += (ads.y + 1.35) * 0.04 * sin(uTime * 0.6 + aAds.x * 0.8);

    float angle = uTime * 0.05;
    float ca = cos(angle);
    float sa = sin(angle);
    vec3 research = vec3(aResearch.x * ca - aResearch.z * sa, aResearch.y, aResearch.x * sa + aResearch.z * ca);

    vec3 maps = aMaps;

    vec3 pos = ads * w.x + research * w.y + maps * w.z;

    // In flight: 0 when settled in a formation, 1 mid-way between two.
    float flight = smoothstep(0.0, 0.5, 1.0 - max(w.x, max(w.y, w.z)));
    vec3 drift = vec3(
      sin(aSeed.x * 91.7 + uTime * 0.9 + pos.y * 1.3),
      sin(aSeed.x * 47.3 + uTime * 0.7 + pos.x * 1.1),
      sin(aSeed.x * 73.1 + uTime * 0.8 + pos.z * 1.2)
    );
    pos += drift * flight * 0.85;
    pos.y += flight * 0.7;

    // ---- colour and opacity per formation ----
    // Ads: 0 = floor grid, 0.1..1 = column height, 2 = trend line.
    float va = aValue.x;
    float isFloor = 1.0 - step(0.05, va);
    float isTrend = step(1.5, va);
    vec3 adsColor = mix(uAdsLow, uAdsHigh, clamp(va, 0.0, 1.0));
    adsColor = mix(adsColor, uAdsHot, isTrend);
    float adsAlpha = mix(0.46 + 0.44 * clamp(va, 0.0, 1.0), 0.14, isFloor);
    adsAlpha = mix(adsAlpha, 0.6, isTrend);

    // Research: below 1 = edge, 1 = node, 2 = hub.
    float vr = aValue.y;
    float isHub = step(1.5, vr);
    vec3 inkColor = mix(uInk, uInkAccent, isHub);
    float inkAlpha = mix(clamp(vr, 0.0, 1.0) * 0.62, 0.9, isHub);

    // Maps: 0..1 = elevation, 2..3 = road (fraction is the road class).
    float vm = aValue.z;
    float isRoad = step(1.5, vm);
    float elev = clamp(vm, 0.0, 1.0);
    float contour = smoothstep(0.36, 0.5, abs(fract(elev * 15.0) - 0.5));
    float scan = exp(-pow((aMaps.z - (mod(uTime * 0.55, 18.0) - 9.0)) * 1.6, 2.0));
    vec3 mapColor = mix(uMapLow, uMapHigh, pow(elev, 0.75));
    float mapAlpha = 0.22 + 0.6 * elev + 0.6 * contour + 0.2 * scan;
    float roadClass = clamp(vm - 2.0, 0.0, 1.0);
    mapColor = mix(mapColor, uMapRoad, isRoad);
    mapAlpha = mix(mapAlpha, 0.35 + 0.6 * roadClass + 0.2 * scan, isRoad);

    vColor = adsColor * w.x + inkColor * w.y + mapColor * w.z;
    vAlpha = (adsAlpha * w.x + inkAlpha * w.y + mapAlpha * w.z) * uFade * (1.0 - 0.35 * flight);
    // Glow on the two dark modes, ink on the light one.
    vAdditive = w.x + w.z;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    // Fade the far edge so the field has no hard horizon.
    vAlpha *= 1.0 - smoothstep(15.0, 26.0, -mv.z);

    float size = aSize.x * w.x + aSize.y * w.y + aSize.z * w.z;
    gl_PointSize = max(1.0, size * uPointScale * uPixelRatio / -mv.z);

    gl_Position = projectionMatrix * mv;
    gl_Position.xy += uShift * gl_Position.w;

    // Keep the field out of the area where the page puts its text.
    vec2 ndc = gl_Position.xy / gl_Position.w;
    vAlpha *= smoothstep(uMask.x, uMask.y, ndc.x) * (1.0 - smoothstep(uMask.z, uMask.w, ndc.y));
  }
`;

export const fragmentShader = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vAdditive;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    // smoothstep needs edge0 < edge1, so the falloff is written as 1 - smoothstep.
    float a = (1.0 - smoothstep(0.12, 0.5, d)) * vAlpha;
    if (a < 0.004) discard;
    // Premultiplied output with blendFunc(ONE, ONE_MINUS_SRC_ALPHA) onto an opaque canvas:
    // alpha 0 adds light (glow), alpha a lays ink over the page colour.
    gl_FragColor = vec4(vColor * a, a * (1.0 - vAdditive));
  }
`;
