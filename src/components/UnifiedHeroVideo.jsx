import React, { useEffect, useRef } from 'react';
import { COMPACT_MOTION, REDUCED_MOTION, useMediaQuery } from './useMediaQuery';
import { loadSeekableVideo } from './loadSeekableVideo';

const MEDIA = `${import.meta.env.BASE_URL}media/`;

function clipSources(webm, mp4) {
  const transparent = { url: MEDIA + webm, type: 'video/webm' };
  const compatible = { url: MEDIA + mp4, type: 'video/mp4' };
  // iOS in-app browsers need the version with the background already composited.
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios ? [compatible, transparent] : [transparent, compatible];
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smooth = value => value * value * (3 - 2 * value);
const ramp = (value, start, end) => smooth(clamp((value - start) / (end - start), 0, 1));

const SCROLL_SCREENS = 2.4;
const HOLD_SCREENS = 1.2;
const FIRST_FRAME = 0.02;
const SEEK_INTERVAL = 1000 / 30;
const LOOK_LEFT = 0.62;
const LOOK_RIGHT = 0.2;

// Quantize seeks to frame boundaries so small scroll changes don't redraw the same frame.
const frameTime = (target, duration, fps) => {
  const lastFrame = Math.max(0, Math.floor(duration * fps - 1) / fps);
  return clamp(Math.round(target * fps) / fps, 0, lastFrame);
};

export default function UnifiedHeroVideo({ stageRef, scrollRef }) {
  const compact = useMediaQuery(COMPACT_MOTION);
  const reducedMotion = useMediaQuery(REDUCED_MOTION);
  const gazeRef = useRef(null);
  const filmRef = useRef(null);
  const pointerBarRef = useRef(null);
  const scrollBarRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const scrollSection = scrollRef.current;
    const gaze = gazeRef.current;
    const film = filmRef.current;
    const pointerBar = pointerBarRef.current;
    const scrollBar = scrollBarRef.current;
    if (!stage || !scrollSection || !gaze || !film || !pointerBar || !scrollBar || reducedMotion) return undefined;

    const scrollScreens = compact ? 0.9 : SCROLL_SCREENS;
    const holdScreens = compact ? 0.08 : HOLD_SCREENS;
    const seekInterval = compact ? 1000 / 24 : SEEK_INTERVAL;
    const controller = new AbortController();

    let gazeDuration = NaN;
    let filmDuration = NaN;
    let gazeTarget = FIRST_FRAME;
    let filmTarget = FIRST_FRAME;
    let gazeProgress = 0;
    let scrollProgress = 0;
    let filmLoaded = false;
    let filmRequested = false;
    let gazeRequested = false;
    let gazeInitialized = false;
    let pointerInside = false;
    let hasGazeInput = false;
    let pointerId = null;
    let touchStartX = null;
    let intersects = false;
    let frameId = 0;
    let scrollFrame = 0;
    let lastGazeSeek = -Infinity;
    let lastFilmSeek = -Infinity;
    let viewportHeight = 0;
    let destroyed = false;

    const valid = duration => Number.isFinite(duration) && duration > 0;
    const isVisible = () => !destroyed && intersects && !document.hidden;
    const gazeActive = () => isVisible() && scrollProgress < 0.005 && hasGazeInput && valid(gazeDuration);
    const filmActive = () => isVisible() && scrollProgress >= 0.005 && valid(filmDuration);
    const requestGaze = () => {
      if (gazeRequested) return;
      gazeRequested = true;
      void loadSeekableVideo(gaze, clipSources(
        compact ? 'hero-eyes-mobile.webm' : 'hero-eyes-desktop.webm',
        compact ? 'hero-eyes-mobile.mp4' : 'hero-eyes-hd-scrub.mp4'
      ), controller.signal);
    };
    const requestFilm = () => {
      if (filmRequested) return;
      filmRequested = true;
      void loadSeekableVideo(film, clipSources(
        compact ? 'middle-film-mobile.webm' : 'middle-film-desktop.webm',
        compact ? 'middle-film-mobile.mp4' : 'middle-film-scrub.mp4'
      ), controller.signal);
    };

    const cancelFrame = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
    };
    const tick = now => {
      frameId = 0;
      if (!isVisible()) return;
      let waitingForRate = false;

      if (gazeActive()) {
        const desired = frameTime(gazeTarget, gazeDuration, 30);
        if (Math.abs(gaze.currentTime - desired) >= 1 / 60 && !gaze.seeking) {
          if (now - lastGazeSeek >= seekInterval) {
            try { gaze.currentTime = desired; lastGazeSeek = now; } catch { /* Keep the current frame. */ }
          } else waitingForRate = true;
        }
      }

      if (filmActive()) {
        const desired = frameTime(filmTarget, filmDuration, 24);
        if (Math.abs(film.currentTime - desired) >= 1 / 48 && !film.seeking) {
          if (now - lastFilmSeek >= seekInterval) {
            try { film.currentTime = desired; lastFilmSeek = now; } catch { /* Keep the current frame. */ }
          } else waitingForRate = true;
        }
      }

      // Seek completion wakes the next frame. There is no continuous loop
      // while the browser decodes a frame.
      if (waitingForRate) frameId = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (isVisible() && !frameId) frameId = requestAnimationFrame(tick);
    };

    const stopPointer = () => {
      pointerInside = false;
      if (pointerId !== null && stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId);
      pointerId = null;
      touchStartX = null;
      stage.classList.remove('is-scrubbing');
    };
    const updatePointer = event => {
      if (!isVisible() || scrollProgress >= 0.005) return;
      const rect = stage.getBoundingClientRect();
      if (!(rect.width > 0) || !Number.isFinite(rect.width)) return;
      const inside = event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) { stopPointer(); return; }
      pointerInside = true;
      hasGazeInput = true;
      gazeProgress = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      pointerBar.style.transform = `scaleX(${gazeProgress})`;
      if (valid(gazeDuration)) {
        gazeTarget = gazeDuration * (LOOK_LEFT + (LOOK_RIGHT - LOOK_LEFT) * gazeProgress);
        wake();
      }
    };
    const onPointerMove = event => {
      if (pointerId !== null && event.pointerId !== pointerId) return;
      if (event.pointerType === 'touch' && pointerId === null) return;
      if (touchStartX !== null) {
        if (Math.abs(event.clientX - touchStartX) < 10) return;
        touchStartX = null;
      }
      if (scrollProgress < 0.005) requestGaze();
      updatePointer(event);
    };
    const onPointerDown = event => {
      if (!isVisible() || scrollProgress >= 0.005 || event.isPrimary === false ||
        pointerId !== null || event.target.closest('a, button')) return;
      pointerId = event.pointerId;
      stage.setPointerCapture(pointerId);
      stage.classList.add('is-scrubbing');
      if (event.pointerType === 'touch') touchStartX = event.clientX;
      else updatePointer(event);
    };
    const onPointerUp = event => {
      if (event.pointerId !== pointerId) return;
      if (touchStartX === null) updatePointer(event);
      if (pointerId === null) return;
      const keepHover = event.pointerType === 'mouse' && pointerInside && scrollProgress < 0.005;
      if (stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId);
      pointerId = null;
      touchStartX = null;
      stage.classList.remove('is-scrubbing');
      if (!keepHover) pointerInside = false;
    };
    const onPointerCancel = event => { if (event.pointerId === pointerId) stopPointer(); };
    const onPointerLeave = () => { if (pointerId === null) stopPointer(); };
    const onLostCapture = event => { if (event.pointerId === pointerId) stopPointer(); };

    const syncScroll = () => {
      scrollFrame = 0;
      if (!isVisible()) return;
      const distance = viewportHeight * scrollScreens;
      const offset = -scrollSection.getBoundingClientRect().top;
      scrollProgress = distance > 0 && Number.isFinite(distance)
        ? clamp(offset / distance, 0, 1)
        : 0;
      if (scrollProgress >= 0.005 && (pointerInside || pointerId !== null)) stopPointer();
      if (offset > 8 && scrollProgress < 1) requestFilm();

      // The first visible state remains the original hero. The film takes
      // over within the same pinned viewport as scrolling begins.
      const reveal = filmLoaded ? ramp(scrollProgress, 0.006, compact ? .18 : .045) : 0;
      const artwork = filmLoaded
        ? 1 - ramp(scrollProgress, compact ? .57 : .025, compact ? .73 : .09)
        : 1;
      stage.style.setProperty('--hero-film-opacity', String(reveal));
      stage.style.setProperty('--hero-sequence-opacity', String(reveal));
      stage.style.setProperty('--hero-artwork-opacity', String(artwork));
      stage.style.setProperty('--hero-artwork-display', artwork > 0 ? 'block' : 'none');
      const details = filmLoaded ? 1 - ramp(scrollProgress, 0.01, 0.08) : 1;
      stage.style.setProperty('--hero-details-opacity', String(details));
      stage.style.setProperty('--hero-details-visibility', details > 0 ? 'visible' : 'hidden');
      const copyReveal = filmLoaded
        ? ramp(scrollProgress, compact ? 0.68 : 0.74, compact ? 0.90 : 0.92)
        : 0;
      const transitionDistance = offset - distance;
      const copyExit = 1 - ramp(transitionDistance, 0, Math.max(1, viewportHeight * (compact ? .08 : .14)));
      stage.style.setProperty('--hero-copy-display', copyReveal * copyExit > 0 ? 'block' : 'none');
      stage.style.setProperty('--hero-copy-opacity', String(copyReveal * copyExit));
      stage.style.setProperty('--hero-copy-offset', `${Math.round((1 - copyReveal) * 46)}px`);
      scrollBar.style.transform = `scaleX(${scrollProgress})`;
      if (valid(filmDuration)) filmTarget = scrollProgress * filmDuration;
      wake();
    };
    const scheduleScroll = () => {
      if (isVisible() && !scrollFrame) scrollFrame = requestAnimationFrame(syncScroll);
    };
    const onResize = () => {
      const height = compact ? stage.offsetHeight : window.innerHeight;
      if (height > 0 && height !== viewportHeight) {
        viewportHeight = height;
        if (!compact) scrollSection.style.setProperty('--hero-viewport', `${height}px`);
        scrollSection.style.setProperty('--hero-scroll-distance', `${Math.round(height * (scrollScreens + holdScreens))}px`);
      }
      scheduleScroll();
    };
    const onGazeMetadata = () => {
      gazeDuration = Number.isFinite(gaze.duration) && gaze.duration > 0 ? gaze.duration : NaN;
      gaze.pause();
      if (!valid(gazeDuration)) return;
      if (!gazeInitialized) {
        try { gaze.currentTime = Math.min(FIRST_FRAME, gazeDuration / 2); gazeInitialized = true; }
        catch { return; }
      }
      gazeTarget = hasGazeInput
        ? gazeDuration * (LOOK_LEFT + (LOOK_RIGHT - LOOK_LEFT) * gazeProgress)
        : gaze.currentTime;
      wake();
    };
    const onFilmMetadata = () => {
      filmDuration = Number.isFinite(film.duration) && film.duration > 0 ? film.duration : NaN;
      film.pause();
      scheduleScroll();
    };
    const onFilmFrame = () => {
      // Keep the portrait in view until the film has decoded the requested frame.
      if (!filmLoaded && film.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          Math.abs(film.currentTime - filmTarget) < .18) {
        filmLoaded = true;
        scheduleScroll();
      }
      wake();
    };
    const onVisibility = () => {
      if (document.hidden) {
        gaze.pause();
        film.pause();
        stopPointer();
        cancelFrame();
      } else { scheduleScroll(); wake(); }
    };

    gaze.pause();
    film.pause();
    stage.addEventListener('pointermove', onPointerMove, { passive: true });
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerCancel);
    stage.addEventListener('pointerleave', onPointerLeave);
    stage.addEventListener('lostpointercapture', onLostCapture);
    window.addEventListener('scroll', scheduleScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pageshow', scheduleScroll);
    document.addEventListener('visibilitychange', onVisibility);
    gaze.addEventListener('loadedmetadata', onGazeMetadata);
    gaze.addEventListener('durationchange', onGazeMetadata);
    gaze.addEventListener('seeked', wake);
    film.addEventListener('loadedmetadata', onFilmMetadata);
    film.addEventListener('durationchange', onFilmMetadata);
    film.addEventListener('loadeddata', onFilmFrame);
    film.addEventListener('seeked', onFilmFrame);

    const observer = new IntersectionObserver(([entry]) => {
      intersects = entry.isIntersecting && entry.intersectionRatio >= 0.01;
      if (!intersects) { stopPointer(); cancelFrame(); gaze.pause(); film.pause(); }
      else {
        if (!compact && window.scrollY < 8) requestGaze();
        scheduleScroll();
        wake();
      }
    }, { threshold: [0, 0.01] });
    observer.observe(stage);
    onResize();
    if (gaze.readyState >= HTMLMediaElement.HAVE_METADATA) onGazeMetadata();
    if (film.readyState >= HTMLMediaElement.HAVE_METADATA) onFilmMetadata();

    return () => {
      destroyed = true;
      controller.abort();
      stopPointer();
      cancelFrame();
      cancelAnimationFrame(scrollFrame);
      scrollSection.style.removeProperty('--hero-viewport');
      scrollSection.style.removeProperty('--hero-scroll-distance');
      for (const property of ['film-opacity', 'sequence-opacity', 'artwork-opacity', 'artwork-display', 'details-opacity', 'details-visibility', 'copy-display', 'copy-opacity', 'copy-offset']) {
        stage.style.removeProperty(`--hero-${property}`);
      }
      observer.disconnect();
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerCancel);
      stage.removeEventListener('pointerleave', onPointerLeave);
      stage.removeEventListener('lostpointercapture', onLostCapture);
      window.removeEventListener('scroll', scheduleScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pageshow', scheduleScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      gaze.removeEventListener('loadedmetadata', onGazeMetadata);
      gaze.removeEventListener('durationchange', onGazeMetadata);
      gaze.removeEventListener('seeked', wake);
      film.removeEventListener('loadedmetadata', onFilmMetadata);
      film.removeEventListener('durationchange', onFilmMetadata);
      film.removeEventListener('loadeddata', onFilmFrame);
      film.removeEventListener('seeked', onFilmFrame);
    };
  }, [stageRef, scrollRef, compact, reducedMotion]);

  const gazePoster = compact ? 'hero-eyes-mobile-poster.webp' : 'hero-eyes-hd-alpha-poster.png';
  return <>
    <div className="hero-scrub">
      {reducedMotion ? <img className="hero-gaze-video" src={MEDIA + gazePoster} alt="" /> : <>
        <video key={gazePoster} ref={gazeRef} className="hero-gaze-video" muted playsInline
          preload="auto" poster={MEDIA + gazePoster} aria-label="人物眼神随横向拖动" />
        <div className="hero-scrub-hint" aria-hidden="true"><span>←</span> {compact ? '左右拖动看眼神' : 'MOVE / DRAG TO LOOK AROUND'} <span>→</span></div>
        <div className="hero-scrub-track" aria-hidden="true"><span ref={pointerBarRef} /></div>
        <div className="hero-film-track" aria-hidden="true"><span ref={scrollBarRef} /></div>
      </>}
    </div>
    {!reducedMotion && <video key={String(compact)} ref={filmRef} className="hero-film-video" muted playsInline
      preload="auto" aria-label="人物动作随页面滚动向前和向后" />}
  </>;
}
