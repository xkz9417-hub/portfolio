import React, { useEffect, useRef } from 'react';
import { REDUCED_MOTION, useMediaQuery } from './useMediaQuery';

const media = `${import.meta.env.BASE_URL}media/`;
const width = 480;
const height = 270;
// Tiles are sampled from the original hero clips at 16 frames per second.
const gazeTiles = { name: 'gaze', columns: 7, perSheet: 28, count: 28, tileWidth: 200, offset: 140 };
const filmTiles = { name: 'film', columns: 4, perSheet: 16, count: 64, tileWidth: width, offset: 0 };
const clamp = value => Math.min(1, Math.max(0, value));
const fade = (value, start, end) => {
  const progress = clamp((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
};

function spritePlayer(canvas, tiles, wake) {
  const context = canvas.getContext('2d');
  if (!context) return { load() {}, draw: () => false, dispose() {} };
  const sheets = new Map();
  let lastFrame = -1;

  function load(sheet) {
    if (sheet < 0 || sheet * tiles.perSheet >= tiles.count || sheets.has(sheet)) return;
    const image = new Image();
    sheets.set(sheet, image);
    image.onload = wake;
    image.onerror = () => { sheets.delete(sheet); };
    image.src = `${media}mobile-frames/${tiles.name}-${sheet + 1}.webp`;
  }

  function draw(frame) {
    const sheet = Math.floor(frame / tiles.perSheet);
    const image = sheets.get(sheet);
    if (!image?.complete || !image.naturalWidth) return false;
    if (lastFrame === frame) return true;
    const tile = frame % tiles.perSheet;
    const x = (tile % tiles.columns) * tiles.tileWidth;
    const y = Math.floor(tile / tiles.columns) * height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, x, y, tiles.tileWidth, height, tiles.offset, 0, tiles.tileWidth, height);
    lastFrame = frame;
    return true;
  }

  return { load, draw, dispose() {
    for (const image of sheets.values()) {
      image.onload = null;
      image.onerror = null;
    }
  } };
}

export default function MobileHeroMotion({ stageRef, scrollRef, viewportRef }) {
  const reducedMotion = useMediaQuery(REDUCED_MOTION);
  const gazeRef = useRef(null);
  const filmRef = useRef(null);
  const pointerBarRef = useRef(null);
  const scrollBarRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const stage = stageRef.current;
    const scroll = scrollRef.current;
    const viewport = viewportRef.current;
    const gazeCanvas = gazeRef.current;
    const filmCanvas = filmRef.current;
    let frame = 0;
    let visible = false;
    let gazePosition = null;
    let activeTouch = null;
    let filmDrawn = false;
    const wake = () => {
      if (visible && !document.hidden && !frame) frame = requestAnimationFrame(render);
    };
    const gaze = spritePlayer(gazeCanvas, gazeTiles, wake);
    const film = spritePlayer(filmCanvas, filmTiles, wake);

    function render() {
      frame = 0;
      if (!visible || document.hidden) return;
      const viewportHeight = viewport.offsetHeight;
      const offset = -scroll.getBoundingClientRect().top;
      const distance = viewportHeight * .9;
      const progress = clamp(offset / Math.max(1, distance));
      if (progress < .005 && gazePosition !== null) {
        gaze.load(0);
        if (gaze.draw(Math.round((1 - gazePosition) * (gazeTiles.count - 1)))) {
          gazeCanvas.parentElement.classList.add('has-gaze-frame');
          pointerBarRef.current.style.transform = `scaleX(${gazePosition})`;
        }
      }
      if (progress >= .005) {
        const target = Math.round(progress * (filmTiles.count - 1));
        const sheet = Math.floor(target / filmTiles.perSheet);
        film.load(sheet);
        film.load(sheet + 1);
        if (target % filmTiles.perSheet < 4) film.load(sheet - 1);
        filmDrawn = film.draw(target) || filmDrawn;
      }
      const reveal = filmDrawn ? fade(progress, .006, .18) : 0;
      const artwork = filmDrawn ? 1 - fade(progress, .57, .73) : 1;
      const copy = filmDrawn ? fade(progress, .68, .90) : 0;
      const copyExit = 1 - fade(offset - distance, 0, Math.max(1, viewportHeight * .08));
      stage.style.setProperty('--hero-film-opacity', String(reveal));
      stage.style.setProperty('--hero-sequence-opacity', String(reveal));
      stage.style.setProperty('--hero-artwork-opacity', String(artwork));
      stage.style.setProperty('--hero-artwork-display', artwork > 0 ? 'block' : 'none');
      stage.style.setProperty('--hero-details-opacity', String(1 - reveal));
      stage.style.setProperty('--hero-copy-opacity', String(copy * copyExit));
      stage.style.setProperty('--hero-copy-display', copy * copyExit > 0 ? 'block' : 'none');
      stage.style.setProperty('--hero-copy-offset', `${Math.round((1 - copy) * 16)}px`);
      scrollBarRef.current.style.transform = `scaleX(${progress})`;
    }

    function position(x) {
      const rect = stage.getBoundingClientRect();
      gazePosition = clamp((x - rect.left) / Math.max(1, rect.width));
      wake();
    }

    const onTouchStart = event => {
      if (event.touches.length !== 1) { activeTouch = null; return; }
      const touch = event.touches[0];
      activeTouch = { id: touch.identifier, x: touch.clientX, y: touch.clientY, horizontal: false };
    };
    const onTouchMove = event => {
      if (!activeTouch || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (touch.identifier !== activeTouch.id) return;
      if (!activeTouch.horizontal) {
        const x = Math.abs(touch.clientX - activeTouch.x);
        const y = Math.abs(touch.clientY - activeTouch.y);
        if (y > 8 && y >= x) { activeTouch = null; return; }
        if (x < 7 || x <= y) return;
        activeTouch.horizontal = true;
      }
      if (event.cancelable) event.preventDefault();
      position(touch.clientX);
    };
    const onTouchEnd = () => { activeTouch = null; };
    const onPointerMove = event => { if (event.pointerType !== 'touch') position(event.clientX); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        if (window.scrollY < 20) gaze.load(0);
        wake();
      }
    });
    observer.observe(stage);
    stage.addEventListener('touchstart', onTouchStart, { passive: true });
    stage.addEventListener('touchmove', onTouchMove, { passive: false });
    stage.addEventListener('touchend', onTouchEnd);
    stage.addEventListener('touchcancel', onTouchEnd);
    stage.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', wake, { passive: true });
    document.addEventListener('visibilitychange', wake);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      gaze.dispose();
      film.dispose();
      gazeCanvas.parentElement?.classList.remove('has-gaze-frame');
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchmove', onTouchMove);
      stage.removeEventListener('touchend', onTouchEnd);
      stage.removeEventListener('touchcancel', onTouchEnd);
      stage.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', wake);
      window.removeEventListener('resize', wake);
      document.removeEventListener('visibilitychange', wake);
      for (const property of ['film-opacity', 'sequence-opacity', 'artwork-opacity', 'artwork-display', 'details-opacity', 'copy-opacity', 'copy-display', 'copy-offset']) {
        stage.style.removeProperty(`--hero-${property}`);
      }
    };
  }, [stageRef, scrollRef, viewportRef, reducedMotion]);

  return <>
    <div className="hero-scrub">
      <img className="hero-gaze-video" src={media + 'hero-eyes-mobile-poster.webp'} alt="" />
      {!reducedMotion && <>
        <canvas className="mobile-gaze-frames" ref={gazeRef} width={width} height={height} aria-hidden="true" />
        <div className="hero-scrub-hint" aria-hidden="true"><span>←</span> 左右拖动看眼神 <span>→</span></div>
        <div className="hero-scrub-track" aria-hidden="true"><span ref={pointerBarRef} /></div>
        <div className="hero-film-track" aria-hidden="true"><span ref={scrollBarRef} /></div>
      </>}
    </div>
    {!reducedMotion && <canvas className="hero-film-video" ref={filmRef} width={width} height={height} aria-hidden="true" />}
  </>;
}
