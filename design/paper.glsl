#version 100
precision mediump float;

/** @resolution */
uniform vec2 u_resolution;

/**
 * @label Paper
 * @color
 * @default #FBF3EA
 */
uniform vec3 u_paper;

/**
 * @label Fiber
 * @color
 * @default #E4C4AE
 */
uniform vec3 u_fiber;

/**
 * @label Blush
 * @color
 * @default #E8B4B0
 */
uniform vec3 u_blush;

/**
 * @label Speck
 * @color
 * @default #792B3E
 */
uniform vec3 u_ink;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec2 px = gl_FragCoord.xy;
  vec2 uv = px / max(u_resolution.xy, vec2(1.0));

  float fiber = noise(vec2(px.x * 0.05, px.y * 0.9));
  float tooth = noise(px * 0.16);
  float blot = noise(uv * vec2(2.1, 2.8) + vec2(1.7, 0.4));
  float bloom = noise(uv * vec2(1.1, 0.8) + vec2(8.0, 2.4));

  vec3 col = u_paper;
  col = mix(col, u_fiber, smoothstep(0.38, 0.95, fiber) * 0.42);
  col = mix(col, u_fiber, smoothstep(0.5, 1.0, tooth) * 0.2);
  col = mix(col, u_blush, smoothstep(0.55, 0.98, blot) * 0.34);
  col = mix(col, u_ink, smoothstep(0.78, 1.0, bloom) * 0.06);

  float speck = step(0.988, hash(floor(px * 0.42)));
  col = mix(col, u_ink, speck * 0.16);
  col += (hash(px + vec2(3.0, 9.0)) - 0.5) * 0.035;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
