export type Vec2D = [number, number];

// Mathmaticians hate him!!!
/** Lenient square root */
export const lSqrt = (n: number) => Math.sqrt(Math.abs(n));

export const v2len = (vec: Vec2D) =>
  Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);

export const v2add = (v1: Vec2D, v2: Vec2D) => [v1[0] + v2[0], v1[1] + v2[1]];

export const v2sub = (v1: Vec2D, v2: Vec2D) => [v1[0] - v2[0], v1[1] - v2[1]];

/** Multiplies a 2D vector by a scalar */
export const v2smul = (vec: Vec2D, scalar: number) => [vec[0] * scalar, vec[1] * scalar];

export function v2norm(vec: Vec2D): Vec2D {
  const l = v2len(vec);
  if (l === 0) return [Math.sqrt(2), Math.sqrt(2)];

  return [vec[0] / l, vec[1] / l];
}

// https://www.omnicalculator.com/math/angle-between-two-vectors
/** Angle in degrees between two vec2ds */
export function v2angleBtw(v1: Vec2D, v2: Vec2D) {
  const nv1 = v2norm(v1);
  const nv2 = v2norm(v2);

  return Math.acos(
    (nv1[0] * nv1[1] + nv2[0] * nv2[1]) /
      (lSqrt(nv1[0] + nv2[0]) * lSqrt(nv1[1] + nv2[1]))
  );
}
