import React, { useEffect, useRef } from 'react';
import { COMPACT_MOTION, REDUCED_MOTION, useMediaQuery } from './useMediaQuery';

// Keep the hand-lettered title's original shape while matching FuzzyText's horizontal fuzz.
export default function FuzzyArtwork({ src, className = '', label = '' }) {
  const canvasRef = useRef(null);
  const compact = useMediaQuery(COMPACT_MOTION);
  const reduceMotion = useMediaQuery(REDUCED_MOTION);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return undefined;

    const image = new Image();
    image.src = src;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let hovering = false;
    let frame = 0;
    let lastDraw = 0;
    let visible = false;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2);
      width = Math.round(bounds.width * dpr);
      height = Math.round(bounds.height * dpr);
      canvas.width = width;
      canvas.height = height;
      if (image.complete && image.naturalWidth) draw(0, true);
    };

    const draw = (time, force = false) => {
      if (!image.complete || !image.naturalWidth || !width || !height) return;
      if (!force && time - lastDraw < (compact ? 50 : 33)) return;
      lastDraw = time;
      context.clearRect(0, 0, width, height);

      const intensity = reduceMotion ? 0 : hovering ? 0.5 : 0.2;
      const amplitude = intensity * 30 * dpr;
      const sliceHeight = Math.max(1, Math.round(dpr));

      if (reduceMotion) {
        context.drawImage(image, 0, 0, width, height);
        return;
      }
      for (let y = 0; y < height; y += sliceHeight) {
        const h = Math.min(sliceHeight + 1, height - y);
        const sourceY = (y / height) * image.naturalHeight;
        const sourceH = (h / height) * image.naturalHeight;
        const shift = amplitude < 0.5 ? 0 : Math.round((Math.random() - 0.5) * amplitude);
        context.drawImage(image, 0, sourceY, image.naturalWidth, sourceH, shift, y, width, h);
      }
    };

    const animate = (time) => {
      draw(time);
      frame = window.requestAnimationFrame(animate);
    };
    const syncAnimation = () => {
      if (visible && !reduceMotion && !document.hidden) {
        if (!frame) frame = window.requestAnimationFrame(animate);
      } else {
        window.cancelAnimationFrame(frame);
        frame = 0;
        hovering = false;
      }
    };

    const onPointerMove = (event) => {
      if (!visible || reduceMotion) return;
      const bounds = (canvas.parentElement || canvas).getBoundingClientRect();
      // The lettering artwork reaches the viewport edges while the canvas is capped in width.
      // Use the full horizontal title band so both ends respond consistently.
      hovering = event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    };
    const onPointerLeave = () => { hovering = false; };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    });
    intersection.observe(canvas);
    image.onload = resize;
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerLeave);
    window.addEventListener('pointercancel', onPointerLeave);
    window.addEventListener('blur', onPointerLeave);
    document.addEventListener('visibilitychange', syncAnimation);
    resize();

    return () => {
      image.onload = null;
      observer.disconnect();
      intersection.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerLeave);
      window.removeEventListener('pointercancel', onPointerLeave);
      window.removeEventListener('blur', onPointerLeave);
      document.removeEventListener('visibilitychange', syncAnimation);
    };
  }, [src, compact, reduceMotion]);

  return <canvas ref={canvasRef} className={className} role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true} />;
}
