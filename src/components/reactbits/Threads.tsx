import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Color } from 'ogl';

import './Threads.css';

interface ThreadsProps {
  color?: [number, number, number];
  amplitude?: number;
  distance?: number;
  enableMouseInteraction?: boolean;
}

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
// Referans çözünürlük: çizgi kalınlığı/blur bu değere göre hesaplanır, böylece
// iç render çözünürlüğü (dpr/boyut kapağı) değişse de CSS px kalınlığı sabit kalır.
uniform vec2 uRefResolution;
uniform vec3 uColor;
uniform float uAmplitude;
uniform float uDistance;
uniform vec2 uMouse;

#define PI 3.1415926538

const int u_line_count = 40;
const float u_line_width = 7.0;
const float u_line_blur = 10.0;

float Perlin2D(vec2 P) {
    vec2 Pi = floor(P);
    vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);
    vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);
    Pt = Pt - floor(Pt * (1.0 / 71.0)) * 71.0;
    Pt += vec2(26.0, 161.0).xyxy;
    Pt *= Pt;
    Pt = Pt.xzxz * Pt.yyww;
    vec4 hash_x = fract(Pt * (1.0 / 951.135664));
    vec4 hash_y = fract(Pt * (1.0 / 642.949883));
    vec4 grad_x = hash_x - 0.49999;
    vec4 grad_y = hash_y - 0.49999;
    vec4 grad_results = inversesqrt(grad_x * grad_x + grad_y * grad_y)
        * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);
    grad_results *= 1.4142135623730950;
    vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy
               * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
    vec4 blend2 = vec4(blend, vec2(1.0 - blend));
    return dot(grad_results, blend2.zxzx * blend2.wwyy);
}

float pixel(float count, vec2 resolution) {
    return (1.0 / max(resolution.x, resolution.y)) * count;
}

float lineFn(vec2 st, float width, float perc, float offset, vec2 mouse, float time, float amplitude, float distance) {
    float split_offset = (perc * 0.4);
    float split_point = 0.1 + split_offset;

    float amplitude_normal = smoothstep(split_point, 0.7, st.x);
    float amplitude_strength = 0.5;
    float finalAmplitude = amplitude_normal * amplitude_strength
                           * amplitude * (1.0 + (mouse.y - 0.5) * 0.2);

    float time_scaled = time / 10.0 + (mouse.x - 0.5) * 1.0;
    float blur = smoothstep(split_point, split_point + 0.05, st.x) * perc;

    float xnoise = mix(
        Perlin2D(vec2(time_scaled, st.x + perc) * 2.5),
        Perlin2D(vec2(time_scaled, st.x + time_scaled) * 3.5) / 1.5,
        st.x * 0.3
    );

    float y = 0.5 + (perc - 0.5) * distance + xnoise / 2.0 * finalAmplitude;

    float blur_px = u_line_blur * pixel(1.0, uRefResolution) * blur;

    float line_start = smoothstep(
        y + (width / 2.0) + blur_px,
        y,
        st.y
    );

    float line_end = smoothstep(
        y,
        y - (width / 2.0) - blur_px,
        st.y
    );

    return clamp(
        (line_start - line_end) * (1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3))),
        0.0,
        1.0
    );
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float line_px = u_line_width * pixel(1.0, uRefResolution);

    float line_strength = 1.0;
    for (int i = 0; i < u_line_count; i++) {
        float p = float(i) / float(u_line_count);
        line_strength *= (1.0 - lineFn(
            uv,
            line_px * (1.0 - p),
            p,
            (PI * 1.0) * p,
            uMouse,
            iTime,
            uAmplitude,
            uDistance
        ));
    }

    float colorVal = 1.0 - line_strength;
    fragColor = vec4(uColor * colorVal, colorVal);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

/** Retina'da bile 1.25x yeter: çizgiler yumuşak, aradaki fark görünmez. */
const MAX_DPR = 1.25;
/**
 * Fragment shader ağır (piksel başına 40 çizgi × Perlin). Uzun kenar bu piksel
 * sayısını aşmasın; efekt yumuşak olduğundan yukarı ölçekleme fark edilmez.
 */
const MAX_RENDER_DIM = 1280;
/**
 * Görsel referans: çizgi kalınlığı ve blur, eski render kuralına (dpr ≤ 2, uzun
 * kenar ≤ 1920) göre hesaplanır. Böylece düşük iç çözünürlükte de çizgiler CSS px
 * cinsinden aynı kalınlıkta kalır (7 / referansDpr); yalnızca örnekleme seyrekleşir.
 */
const REF_MAX_DPR = 2;
const REF_MAX_RENDER_DIM = 1920;
/** Yumuşatılmış imleç hedefe bu kadar yaklaştıysa uniform güncellemesi atlanır. */
const MOUSE_EPS = 1e-4;

const Threads: React.FC<ThreadsProps> = ({
  color = [1, 1, 1],
  amplitude = 1,
  distance = 0,
  enableMouseInteraction = false,
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the latest props in a ref so updating them mutates the live shader
  // uniforms instead of tearing down and rebuilding the whole WebGL context.
  const propsRef = useRef({ color, amplitude, distance, enableMouseInteraction });
  propsRef.current = { color, amplitude, distance, enableMouseInteraction };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    let renderer: Renderer;
    try {
      renderer = new Renderer({ alpha: true, dpr: 1 });
    } catch (error) {
      console.warn('WebGL unavailable for Threads:', error);
      return;
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height)
        },
        uRefResolution: { value: new Float32Array([gl.canvas.width, gl.canvas.height]) },
        uColor: { value: new Color(...propsRef.current.color) },
        uAmplitude: { value: propsRef.current.amplitude },
        uDistance: { value: propsRef.current.distance },
        uMouse: { value: new Float32Array([0.5, 0.5]) }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    /* ---- döngü durumu ---- */
    let rafId = 0;
    let running = false;
    let intersecting = false;
    let needsFrame = true;
    // Faz sürekliliği: bileşen (görünürlük kapısıyla) yeniden mount edilirse
    // animasyon 0'dan değil, sayfa zamanının kaldığı yerden devam eder.
    let elapsed = (typeof performance !== 'undefined' ? performance.now() : 0) * 0.001;
    let lastT = 0;

    /** Uzun kenar kapağına göre etkin dpr. */
    function cappedDpr(baseDpr: number, cssW: number, cssH: number, maxDim: number) {
      const longestSide = Math.max(cssW, cssH) * baseDpr;
      return longestSide > maxDim ? (baseDpr * maxDim) / longestSide : baseDpr;
    }

    function resize() {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      const devicePr = window.devicePixelRatio || 1;
      const dpr = cappedDpr(Math.min(devicePr, MAX_DPR), clientWidth, clientHeight, MAX_RENDER_DIM);
      renderer.dpr = dpr;
      renderer.setSize(clientWidth, clientHeight);
      program.uniforms.iResolution.value.r = gl.canvas.width;
      program.uniforms.iResolution.value.g = gl.canvas.height;
      program.uniforms.iResolution.value.b = gl.canvas.width / gl.canvas.height;
      // Çizgi kalınlığı referansı: eski kuralla elde edilecek çözünürlük.
      const refDpr = cappedDpr(Math.min(devicePr, REF_MAX_DPR), clientWidth, clientHeight, REF_MAX_RENDER_DIM);
      program.uniforms.uRefResolution.value[0] = Math.round(clientWidth * refDpr);
      program.uniforms.uRefResolution.value[1] = Math.round(clientHeight * refDpr);
      needsFrame = true;
    }

    /* ---- imleç: pasif dinleyici ham konumu saklar; normalizasyon karede yapılır ---- */
    let pointerX = 0;
    let pointerY = 0;
    let pointerDirty = false;
    let pointerInside = false;
    const currentMouse = [0.5, 0.5];
    const targetMouse = [0.5, 0.5];

    function handlePointerMove(e: PointerEvent) {
      if (!propsRef.current.enableMouseInteraction) return;
      pointerX = e.clientX;
      pointerY = e.clientY;
      pointerInside = true;
      pointerDirty = true;
    }
    function handlePointerLeave() {
      pointerInside = false;
      pointerDirty = true;
    }
    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    // Prop → uniform yazımı yalnızca değer değişince (her karede değil).
    let lastColor: [number, number, number] = [NaN, NaN, NaN];
    let lastAmplitude = NaN;
    let lastDistance = NaN;
    let lastMouseMode: boolean | null = null;

    function syncUniforms() {
      const { color, amplitude, distance, enableMouseInteraction } = propsRef.current;
      if (color[0] !== lastColor[0] || color[1] !== lastColor[1] || color[2] !== lastColor[2]) {
        program.uniforms.uColor.value.set(...color);
        lastColor = [color[0], color[1], color[2]];
      }
      if (amplitude !== lastAmplitude) {
        program.uniforms.uAmplitude.value = amplitude;
        lastAmplitude = amplitude;
      }
      if (distance !== lastDistance) {
        program.uniforms.uDistance.value = distance;
        lastDistance = distance;
      }
      if (enableMouseInteraction) {
        if (pointerDirty) {
          pointerDirty = false;
          if (pointerInside) {
            const rect = container.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              targetMouse[0] = (pointerX - rect.left) / rect.width;
              targetMouse[1] = 1.0 - (pointerY - rect.top) / rect.height;
            }
          } else {
            targetMouse[0] = 0.5;
            targetMouse[1] = 0.5;
          }
        }
        const dx = targetMouse[0] - currentMouse[0];
        const dy = targetMouse[1] - currentMouse[1];
        if (Math.abs(dx) > MOUSE_EPS || Math.abs(dy) > MOUSE_EPS) {
          const smoothing = 0.05;
          currentMouse[0] += smoothing * dx;
          currentMouse[1] += smoothing * dy;
          program.uniforms.uMouse.value[0] = currentMouse[0];
          program.uniforms.uMouse.value[1] = currentMouse[1];
        }
        lastMouseMode = true;
      } else if (lastMouseMode !== false) {
        currentMouse[0] = targetMouse[0] = 0.5;
        currentMouse[1] = targetMouse[1] = 0.5;
        program.uniforms.uMouse.value[0] = 0.5;
        program.uniforms.uMouse.value[1] = 0.5;
        lastMouseMode = false;
      }
    }

    /* ---- döngü: yalnızca ekranda ve sekme görünürken çalışır; değilse rAF durur ---- */
    function update(t: number) {
      rafId = 0;
      if (!intersecting || document.hidden) {
        running = false;
        return;
      }
      // Duraklamalarda zaman sıçramasın: gerçek dt biriktirilir (üst sınırlı).
      const dt = lastT ? Math.min((t - lastT) * 0.001, 0.1) : 0;
      lastT = t;
      elapsed += dt;
      program.uniforms.iTime.value = elapsed;

      syncUniforms();
      renderer.render({ scene: mesh });
      needsFrame = false;
      rafId = requestAnimationFrame(update);
    }

    function start() {
      if (running || !intersecting || document.hidden) return;
      running = true;
      lastT = 0;
      rafId = requestAnimationFrame(update);
    }
    function stop() {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }
    function sync() {
      if (intersecting && !document.hidden) start();
      else stop();
    }

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        intersecting = entries[entries.length - 1].isIntersecting;
        sync();
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(container);
    document.addEventListener('visibilitychange', sync);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (needsFrame && !running) start();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', resize);
    resize();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('resize', resize);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return <div ref={containerRef} className="threads-container" {...rest} />;
};

export default Threads;
