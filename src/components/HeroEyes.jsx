import React, { useEffect, useRef } from 'react';
import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';

const vertex = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tPortrait;
uniform vec2 uLook;

float ellipse(vec2 p, vec2 center, vec2 radius) {
  vec2 d = (p - center) / radius;
  return exp(-dot(d, d) * 2.0);
}

void main() {
  vec2 uv = vUv;
  // Sample one image through a continuous field, so the eyes have no clipped edge.
  float head = ellipse(uv, vec2(0.5, 0.677), vec2(0.178, 0.294));
  float leftEye = ellipse(uv, vec2(0.447, 0.675), vec2(0.041, 0.032));
  float rightEye = ellipse(uv, vec2(0.553, 0.675), vec2(0.041, 0.032));
  vec2 turn = vec2(uLook.x * (0.0038 + (uv.y - 0.57) * 0.012), uLook.y * 0.0033) * head;
  vec2 glance = vec2(uLook.x * 0.0048, uLook.y * 0.0034) * (leftEye + rightEye);
  gl_FragColor = texture2D(tPortrait, clamp(uv - turn - glance, 0.0, 1.0));
}`;

export default function HeroEyes({ stageRef }) {
  const canvasHost = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const host = canvasHost.current;
    if (!stage || !host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const renderer = new Renderer({ alpha: true, depth: false, antialias: false, dpr: Math.min(window.devicePixelRatio || 1, 1.5) });
    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR });
    const look = { value: [0, 0] };
    const mesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program: new Program(gl, { vertex, fragment, uniforms: { tPortrait: { value: texture }, uLook: look }, depthTest: false, depthWrite: false })
    });
    const image = new Image();
    image.decoding = 'async';
    image.src = `${import.meta.env.BASE_URL}media/hero-reference.png`;
    let alive = true;
    let ready = false;
    let raf = 0;
    let visible = true;
    const target = [0, 0];
    const current = [0, 0];

    const frame = () => {
      raf = 0;
      if (!alive || !ready || !visible) return;
      current[0] += (target[0] - current[0]) * 0.085;
      current[1] += (target[1] - current[1]) * 0.085;
      look.value = current;
      renderer.render({ scene: mesh });
      if (Math.abs(target[0] - current[0]) > 0.001 || Math.abs(target[1] - current[1]) > 0.001) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };
    const resize = () => {
      renderer.setSize(Math.max(stage.clientWidth, 1), Math.max(stage.clientHeight, 1));
      wake();
    };
    const move = event => {
      const rect = stage.getBoundingClientRect();
      const centerX = rect.left + rect.width * 0.5;
      const centerY = rect.top + rect.height * 0.325;
      target[0] = Math.max(-1, Math.min(1, (event.clientX - centerX) / (rect.width * 0.3)));
      target[1] = Math.max(-1, Math.min(1, (centerY - event.clientY) / (rect.height * 0.4)));
      wake();
    };
    const reset = () => { target[0] = 0; target[1] = 0; wake(); };
    const observer = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) wake(); });
    observer.observe(stage);
    intersection.observe(stage);
    image.onload = () => {
      if (!alive) return;
      texture.image = image;
      ready = true;
      resize();
      host.classList.add('is-ready');
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('blur', reset);
    document.addEventListener('mouseleave', reset);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('blur', reset);
      document.removeEventListener('mouseleave', reset);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, [stageRef]);

  return <div className="hero-eye-field" ref={canvasHost} aria-hidden="true" />;
}
