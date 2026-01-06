/**
 * Shaders GLSL pour les différents types de sol
 * Centralisés pour une meilleure maintenabilité
 */

// ============================================================================
// Shaders Arcade/Synthwave
// ============================================================================

export const arcadeVertexShader = `
  uniform float uTime;
  uniform float uSpeed;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vFog;

  void main() {
    vUv = uv;
    vPosition = position;

    // Déplacement pour effet de mouvement infini
    vec3 pos = position;

    // Fog basé sur la distance
    vFog = smoothstep(0.0, 25.0, length(pos.xz));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

export const arcadeFragmentShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3 uGridColor;
  uniform vec3 uGlowColor;
  uniform vec3 uBgColor;
  uniform vec3 uHorizonColor;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vFog;

  // Fonction pour créer les lignes de grille
  float grid(vec2 uv, float lineWidth, float cellSize) {
    vec2 grid = abs(fract(uv / cellSize - 0.5) - 0.5) / fwidth(uv / cellSize);
    float line = min(grid.x, grid.y);
    return 1.0 - min(line, 1.0);
  }

  // Glow effect
  float glow(float dist, float radius, float intensity) {
    return pow(radius / dist, intensity);
  }

  void main() {
    // Position avec animation de défilement
    vec2 animatedUv = vPosition.xz;
    animatedUv.y -= uTime * uSpeed;

    // Grille principale (grandes cellules)
    float mainGrid = grid(animatedUv, 0.02, 2.0);

    // Grille secondaire (petites cellules)
    float subGrid = grid(animatedUv, 0.01, 0.5) * 0.3;

    // Combinaison des grilles
    float gridPattern = max(mainGrid, subGrid);

    // Effet de pulsation
    float pulse = sin(uTime * 2.0) * 0.2 + 0.8;

    // Lignes horizontales d'accent (style Outrun)
    float horizonLine = smoothstep(0.02, 0.0, abs(fract(animatedUv.y * 0.1) - 0.5));

    // Couleur de base
    vec3 color = uBgColor;

    // Ajout de la grille avec glow
    vec3 gridColorFinal = mix(uGridColor, uGlowColor, sin(uTime + vPosition.x * 0.5) * 0.5 + 0.5);
    color = mix(color, gridColorFinal * pulse, gridPattern * 0.8);

    // Lignes d'horizon
    color = mix(color, uHorizonColor, horizonLine * 0.5);

    // Glow au centre
    float centerGlow = glow(length(vPosition.xz) + 5.0, 3.0, 1.5);
    color += uGlowColor * centerGlow * 0.1;

    // Scanlines subtiles
    float scanline = sin(vPosition.z * 50.0 + uTime * 10.0) * 0.02;
    color += scanline;

    // Fog vers les bords
    color = mix(color, uBgColor, vFog * 0.7);

    // Boost de luminosité pour les lignes
    float brightness = 1.0 + gridPattern * 0.5;
    color *= brightness;

    gl_FragColor = vec4(color, 1.0);
  }
`

// ============================================================================
// Shaders Nature
// ============================================================================

export const natureVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;

  // Fonction de bruit simplex simplifiée
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vUv = uv;
    vPosition = position;

    // Relief subtil basé sur le bruit
    vec3 pos = position;
    float noise = snoise(pos.xz * 0.1) * 0.15;
    pos.y += noise;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

export const natureFragmentShader = `
  uniform vec3 uColorBase;
  uniform vec3 uColorAccent;
  uniform vec3 uColorDark;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vPosition;

  // Même fonction de bruit pour la cohérence
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    // Bruit multi-échelle pour variation naturelle
    float noise1 = snoise(vPosition.xz * 0.3) * 0.5 + 0.5;
    float noise2 = snoise(vPosition.xz * 1.2) * 0.5 + 0.5;
    float noise3 = snoise(vPosition.xz * 3.0 + uTime * 0.05) * 0.5 + 0.5;

    // Mélange des couleurs basé sur le bruit
    vec3 color = mix(uColorBase, uColorAccent, noise1 * 0.6);
    color = mix(color, uColorDark, noise2 * 0.3);

    // Détails fins (brins d'herbe / grains de terre)
    color += (noise3 - 0.5) * 0.08;

    // Léger gradient du centre vers les bords
    float dist = length(vPosition.xz) * 0.02;
    color = mix(color, uColorDark, min(dist, 0.3));

    gl_FragColor = vec4(color, 1.0);
  }
`

// ============================================================================
// Shaders Urbain (Détails asphalte)
// ============================================================================

export const asphaltDetailVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const asphaltDetailFragmentShader = `
  varying vec2 vUv;

  // Hash function pour bruit
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Bruit de valeur
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    // Coordonnées étirées pour l'effet asphalte
    vec2 uv = vUv * 50.0;

    // Bruit multi-octave pour texture granuleuse
    float n = noise(uv) * 0.5;
    n += noise(uv * 2.0) * 0.25;
    n += noise(uv * 4.0) * 0.125;

    // Fissures (lignes sombres)
    float crack = smoothstep(0.48, 0.5, noise(vUv * 8.0));

    // Taches d'huile occasionnelles
    float oilSpot = smoothstep(0.85, 0.9, noise(vUv * 3.0 + 42.0));

    // Couleur finale
    vec3 color = vec3(0.0);
    float alpha = n * 0.15 + crack * 0.2 + oilSpot * 0.3;

    gl_FragColor = vec4(color, alpha);
  }
`
