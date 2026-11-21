import React, { useEffect, useRef } from 'react';

// Keep the hand-lettered title's original shape while matching FuzzyText's horizontal fuzz.
export default function FuzzyArtwork({ src, className = '', label = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return undefined;

    const image = new Image();
    image.src = src;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let hovering = false;
    let frame = 0;
    let lastDraw = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.round(bounds.width * dpr);
      height = Math.round(bounds.height * dpr);
      canvas.width = width;
      canvas.height = height;
      if (image.complete && image.naturalWidth) draw(0, true);
    };

    const draw = (time, force = false) => {
      if (!image.complete || !image.naturalWidth || !width || !height) return;
      if (!force && time - lastDraw < 33) return;
      lastDraw = time;
      context.clearRect(0, 0, width, height);

      const intensity = reduceMotion ? 0 : hovering ? 0.5 : 0.2;
      const amplitude = intensity * 30 * dpr;
      const sliceHeight = Math.max(1, Math.round(dpr));

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

    const onPointerMove = (event) => {
      const bounds = (canvas.parentElement || canvas).getBoundingClientRect();
      // The lettering artwork reaches the viewport edges while the canvas is capped in width.
      // Use the full horizontal title band so both ends respond consistently.
      hovering = event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    };
    const onPointerLeave = () => { hovering = false; };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    image.onload = resize;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('blur', onPointerLeave);
    resize();
    if (reduceMotion) draw(0, true);
    else frame = window.requestAnimationFrame(animate);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('blur', onPointerLeave);
    };
  }, [src]);

  return <canvas ref={canvasRef} className={className} role="img" aria-label={label} />;
}
