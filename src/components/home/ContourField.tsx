"use client";

import { useEffect, useRef } from "react";

const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

// Animated topographic contours over fbm noise, brightening near the pointer.
const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform vec3 uColor; uniform float uAlpha;
out vec4 o;
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; mat2 r=mat2(.8,-.6,.6,.8); for(int i=0;i<5;i++){ v+=a*noise(p); p=r*p*2.02; a*=.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes.y;
  vec2 m = uMouse / uRes.y;
  float t = uTime*0.035;
  vec2 q = uv*1.35 + vec2(t*0.6, -t*0.3);
  float h = fbm(q + fbm(q*0.7 + t)*0.85);
  float d = length(uv - m);
  h += 0.10*exp(-d*d*9.0);              // pointer lifts the terrain
  float levels = 15.0;
  float c = h*levels;
  float line = abs(fract(c-0.5)-0.5)/fwidth(c);
  float a = 1.0 - min(line, 1.0);
  float major = step(0.5, fract(floor(c)/4.0)) ; // every 4th line slightly stronger
  float glow = exp(-d*d*6.0);
  vec2 s = gl_FragCoord.xy/uRes;
  float vign = smoothstep(1.15, 0.25, length((s-vec2(0.62,0.55))*vec2(1.25,1.0)));
  float alpha = a*(0.16 + 0.10*major + 0.55*glow)*vign*uAlpha;
  o = vec4(uColor*alpha, alpha);
}`;

function readColor(): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--contour").trim() || "79 143 255";
  const [r, g, b] = raw.split(/\s+/).map(Number);
  return [r / 255, g / 255, b / 255];
}

export function ContourField({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    // A fresh canvas per mount: React Strict Mode (dev) mounts, unmounts and
    // remounts effects, and a canvas whose context was released cannot get a
    // new one - Chrome then paints it as an opaque white box over the hero.
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "block h-full w-full transition-opacity duration-[1200ms]";
    canvas.style.opacity = "0";
    parent.appendChild(canvas);
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, antialias: false, alpha: true, powerPreference: "low-power" });
    if (!gl) {
      canvas.remove();
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS) || gl.isContextLost()) {
      canvas.remove();
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uMouse = gl.getUniformLocation(prog, "uMouse");
    const uColor = gl.getUniformLocation(prog, "uColor");
    const uAlpha = gl.getUniformLocation(prog, "uAlpha");

    let color = readColor();
    let alpha = document.documentElement.dataset.theme === "light" ? 0.9 : 1;
    const onTheme = () => {
      color = readColor();
      alpha = document.documentElement.dataset.theme === "light" ? 0.9 : 1;
      if (!running) draw(performance.now());
    };
    const mo = new MutationObserver(onTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // Contours are soft lines, so render below device resolution to keep fragment cost low.
    const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 0.75 : 1.25);
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (!running) draw(performance.now());
    };

    let mx = 0.7, my = 0.55, tx = mx, ty = my;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width;
      ty = 1 - (e.clientY - r.top) / r.height;
    };

    const start = performance.now();
    let raf = 0;
    let running = false;
    let visible = true;
    function draw(now: number) {
      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uTime, reduce ? 12 : (now - start) / 1000);
      gl!.uniform2f(uMouse, mx * canvas!.width, my * canvas!.height);
      gl!.uniform3f(uColor, color[0], color[1], color[2]);
      gl!.uniform1f(uAlpha, alpha);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < (coarse ? 33 : 16)) return; // ~30fps on touch devices
      last = now;
      draw(now);
    };
    const play = () => {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) play();
      else pause();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVis);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    if (!coarse) window.addEventListener("pointermove", onMove, { passive: true });
    const onLost = (e: Event) => {
      e.preventDefault();
      pause();
      canvas.style.opacity = "0";
    };
    canvas.addEventListener("webglcontextlost", onLost);
    resize();
    draw(performance.now());
    canvas.style.opacity = "1";
    play();

    return () => {
      pause();
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <div ref={host} aria-hidden="true" className={`pointer-events-none ${className}`} />;
}
