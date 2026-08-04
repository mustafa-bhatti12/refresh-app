import { useEffect, useRef, useState } from "react";
import { PixelRatio, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import { Renderer, Program, Mesh, Color, Triangle } from "ogl";

// Ported from refresh-web/src/components/reactbits/Aurora/Aurora.tsx —
// same shader, same math, same ogl library. The only RN-specific part is below:
// expo-gl hands back a raw WebGL2 context (no DOM canvas), and ogl's Renderer
// insists on calling `canvas.getContext()` and poking `gl.canvas.width/style`.
// A tiny stub object satisfies both without touching ogl's source.
//
// Softness/perf: web Aurora uses ogl's default dpr:1 (1 buffer pixel per CSS
// pixel, then the browser upscales). expo-gl always allocates the backing
// store at device pixels, so a full-bleed GLView is ~2–3× denser than web and
// looks crunchier + drops frames. Layout the GLView at (logical / pr) points
// and scale it back up by pr — backing store lands at 1× logical, matching web.
const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ),
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;

  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

const AURORA_STOPS = ["#AD7547", "#C36C59", "#916444"];

export function AuroraBackground({ amplitude = 0.45, blend = 0.7, speed = 1.6 }: { amplitude?: number; blend?: number; speed?: number }) {
  const speedRef = useRef({ amplitude, blend, speed });
  speedRef.current = { amplitude, blend, speed };
  const animateIdRef = useRef(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const pr = PixelRatio.get();

  // GLView has no onContextCreate cleanup callback — cancel the RAF loop
  // ourselves on unmount so it doesn't keep calling gl methods on a torn-down
  // native context (the web version's `useEffect` return does this for free).
  useEffect(() => () => cancelAnimationFrame(animateIdRef.current), []);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width === size.w && height === size.h) return;
    setSize({ w: width, h: height });
  };

  const onContextCreate = (exgl: ExpoWebGLRenderingContext) => {
    // See file header — stub just enough of a "canvas" for ogl to leave alone.
    (exgl as unknown as { canvas: unknown }).canvas = {
      width: exgl.drawingBufferWidth,
      height: exgl.drawingBufferHeight,
      style: {},
    };

    const renderer = new Renderer({
      canvas: { getContext: () => exgl } as unknown as HTMLCanvasElement,
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      width: exgl.drawingBufferWidth,
      height: exgl.drawingBufferHeight,
      dpr: 1,
    });
    // Same object as `exgl`, just typed the way ogl expects (it stamped a
    // `.renderer` back-reference onto it above) — use this for every ogl call.
    const gl = renderer.gl;

    // Match web Aurora compositing (transparent clear + premultiplied blend).
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const colorStopsArray = AURORA_STOPS.map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: colorStopsArray },
        uResolution: { value: [exgl.drawingBufferWidth, exgl.drawingBufferHeight] },
        uBlend: { value: blend },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const update = (t: number) => {
      animateIdRef.current = requestAnimationFrame(update);
      const { amplitude: a, blend: b, speed: s } = speedRef.current;
      program.uniforms.uTime.value = t * 0.01 * s * 0.1;
      program.uniforms.uAmplitude.value = a;
      program.uniforms.uBlend.value = b;
      renderer.render({ scene: mesh });
      // expo-gl specific: sync + present. No equivalent needed on the web,
      // where the browser flips the canvas's backing buffer automatically.
      exgl.flushEXP();
      exgl.endFrameEXP();
    };
    animateIdRef.current = requestAnimationFrame(update);
  };

  const gw = size.w / pr;
  const gh = size.h / pr;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      {size.w > 0 && (
        <GLView
          style={{
            width: gw,
            height: gh,
            transform: [
              { translateX: (size.w - gw) / 2 },
              { translateY: (size.h - gh) / 2 },
              { scale: pr },
            ],
          }}
          onContextCreate={onContextCreate}
        />
      )}
    </View>
  );
}
