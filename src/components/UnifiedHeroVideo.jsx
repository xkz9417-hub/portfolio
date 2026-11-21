import React, { useEffect, useRef } from 'react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smooth = value => value * value * (3 - 2 * value);
const ramp = (value, start, end) => smooth(clamp((value - start) / (end - start), 0, 1));

const SCROLL_SCREENS = 2.4;
const HOLD_SCREENS = 1.2;
const FIRST_FRAME = 0.02;
const SEEK_INTERVAL = 1000 / 30;
const LOOK_LEFT = 0.62;
const LOOK_RIGHT = 0.2;

// Both clips are encoded with every frame as a keyframe. Seeking to a frame
// boundary avoids asking the decoder to redraw the same frame for every pixel.
const frameTime = (target, duration, fps) => {
  const lastFrame = Math.max(0, Math.floor(duration * fps - 1) / fps);
  return clamp(Math.round(target * fps) / fps, 0, lastFrame);
};

export default function UnifiedHeroVideo({ stageRef, scrollRef }) {
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
    if (!stage || !scrollSection || !gaze || !film || !pointerBar || !scrollBar) return undefined;

    let gazeDuration = NaN;
    let filmDuration = NaN;
    let gazeTarget = FIRST_FRAME;
    let filmTarget = FIRST_FRAME;
    let gazeProgress = 0;
    let scrollProgress = 0;
    let filmLoaded = false;
    let gazeInitialized = false;
    let filmInitialized = false;
    let pointerInside = false;
    let pointerId = null;
    let intersects = false;
    let frameId = 0;
    let lastGazeSeek = -Infinity;
    let lastFilmSeek = -Infinity;
    let viewportHeight = 0;
    let destroyed = false;

    const valid = duration => Number.isFinite(duration) && duration > 0;
    const isVisible = () => !destroyed && intersects && !document.hidden;
    const gazeActive = () => isVisible() && scrollProgress < 0.005 && pointerInside && valid(gazeDuration);
    const filmActive = () => isVisible() && scrollProgress >= 0.005 &&
      filmLoaded && valid(filmDuration);

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
          if (now - lastGazeSeek >= SEEK_INTERVAL) {
            try { gaze.currentTime = desired; lastGazeSeek = now; } catch { /* Keep the current frame. */ }
          } else waitingForRate = true;
        }
      }

      if (filmActive()) {
        const desired = frameTime(filmTarget, filmDuration, 24);
        if (Math.abs(film.currentTime - desired) >= 1 / 48 && !film.seeking) {
          if (now - lastFilmSeek >= SEEK_INTERVAL) {
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
      updatePointer(event);
    };
    const onPointerDown = event => {
      if (!isVisible() || scrollProgress >= 0.005 || event.isPrimary === false ||
        pointerId !== null || event.target.closest('a, button')) return;
      pointerId = event.pointerId;
      stage.setPointerCapture(pointerId);
      stage.classList.add('is-scrubbing');
      updatePointer(event);
    };
    const onPointerUp = event => {
      if (event.pointerId !== pointerId) return;
      updatePointer(event);
      if (pointerId === null) return;
      const keepHover = event.pointerType === 'mouse' && pointerInside && scrollProgress < 0.005;
      if (stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId);
      pointerId = null;
      stage.classList.remove('is-scrubbing');
      if (!keepHover) pointerInside = false;
    };
    const onPointerCancel = event => { if (event.pointerId === pointerId) stopPointer(); };
    const onPointerLeave = () => { if (pointerId === null) stopPointer(); };
    const onLostCapture = event => { if (event.pointerId === pointerId) stopPointer(); };

    const syncScroll = () => {
      const distance = viewportHeight * SCROLL_SCREENS;
      scrollProgress = distance > 0 && Number.isFinite(distance)
        ? clamp(-scrollSection.getBoundingClientRect().top / distance, 0, 1)
        : 0;
      if (scrollProgress >= 0.005 && (pointerInside || pointerId !== null)) stopPointer();

      // The first visible state remains the original hero. The film takes
      // over within the same pinned viewport as scrolling begins.
      const reveal = filmLoaded ? ramp(scrollProgress, 0, 0.02) : 0;
      const artwork = filmLoaded ? 1 - ramp(scrollProgress, 0.005, 0.055) : 1;
      stage.style.setProperty('--hero-film-opacity', String(reveal));
      stage.style.setProperty('--hero-sequence-opacity', String(reveal));
      stage.style.setProperty('--hero-artwork-opacity', String(artwork));
      stage.style.setProperty('--hero-details-opacity', String(filmLoaded ? 1 - ramp(scrollProgress, 0.01, 0.08) : 1));
      const mobileCopy = window.innerWidth <= 600;
      const copyReveal = filmLoaded
        ? ramp(scrollProgress, mobileCopy ? 0.78 : 0.74, mobileCopy ? 0.96 : 0.92)
        : 0;
      const transitionDistance = -scrollSection.getBoundingClientRect().top - distance;
      const copyExit = 1 - ramp(transitionDistance, 0, Math.max(1, viewportHeight * .14));
      stage.style.setProperty('--hero-copy-opacity', String(copyReveal * copyExit));
      stage.style.setProperty('--hero-copy-offset', `${Math.round((1 - copyReveal) * 46)}px`);
      scrollBar.style.transform = `scaleX(${scrollProgress})`;
      if (valid(filmDuration)) filmTarget = scrollProgress * filmDuration;
      wake();
    };
    const onResize = () => {
      const height = window.innerHeight;
      if (height > 0 && height !== viewportHeight) {
        viewportHeight = height;
        scrollSection.style.setProperty('--hero-viewport', `${height}px`);
        scrollSection.style.setProperty('--hero-scroll-distance', `${Math.round(height * (SCROLL_SCREENS + HOLD_SCREENS))}px`);
      }
      syncScroll();
    };
    const onGazeMetadata = () => {
      gazeDuration = Number.isFinite(gaze.duration) && gaze.duration > 0 ? gaze.duration : NaN;
      gaze.pause();
      if (!valid(gazeDuration)) return;
      if (!gazeInitialized) {
        try { gaze.currentTime = Math.min(FIRST_FRAME, gazeDuration / 2); gazeInitialized = true; }
        catch { return; }
      }
      gazeTarget = pointerInside
        ? gazeDuration * (LOOK_LEFT + (LOOK_RIGHT - LOOK_LEFT) * gazeProgress)
        : gaze.currentTime;
      wake();
    };
    const onFilmMetadata = () => {
      filmDuration = Number.isFinite(film.duration) && film.duration > 0 ? film.duration : NaN;
      film.pause();
      if (!valid(filmDuration)) return;
      if (!filmInitialized) {
        try { film.currentTime = Math.min(FIRST_FRAME, filmDuration / 2); filmInitialized = true; }
        catch { return; }
      }
      syncScroll();
    };
    const onFilmLoaded = () => { filmLoaded = true; syncScroll(); };
    const onVisibility = () => {
      if (document.hidden) {
        gaze.pause();
        film.pause();
        stopPointer();
        cancelFrame();
      } else { syncScroll(); wake(); }
    };

    gaze.pause();
    film.pause();
    stage.addEventListener('pointermove', onPointerMove, { passive: true });
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerCancel);
    stage.addEventListener('pointerleave', onPointerLeave);
    stage.addEventListener('lostpointercapture', onLostCapture);
    window.addEventListener('scroll', syncScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pageshow', syncScroll);
    window.addEventListener('load', syncScroll);
    window.visualViewport?.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    gaze.addEventListener('loadedmetadata', onGazeMetadata);
    gaze.addEventListener('durationchange', onGazeMetadata);
    gaze.addEventListener('seeked', wake);
    film.addEventListener('loadedmetadata', onFilmMetadata);
    film.addEventListener('durationchange', onFilmMetadata);
    film.addEventListener('loadeddata', onFilmLoaded);
    film.addEventListener('seeked', wake);

    const observer = new IntersectionObserver(([entry]) => {
      intersects = entry.isIntersecting && entry.intersectionRatio >= 0.01;
      if (!intersects) { stopPointer(); cancelFrame(); gaze.pause(); film.pause(); }
      else { syncScroll(); wake(); }
    }, { threshold: [0, 0.01] });
    observer.observe(stage);
    onResize();
    if (gaze.readyState >= HTMLMediaElement.HAVE_METADATA) onGazeMetadata();
    if (film.readyState >= HTMLMediaElement.HAVE_METADATA) onFilmMetadata();
    if (film.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) onFilmLoaded();

    return () => {
      destroyed = true;
      stopPointer();
      cancelFrame();
      observer.disconnect();
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerCancel);
      stage.removeEventListener('pointerleave', onPointerLeave);
      stage.removeEventListener('lostpointercapture', onLostCapture);
      window.removeEventListener('scroll', syncScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pageshow', syncScroll);
      window.removeEventListener('load', syncScroll);
      window.visualViewport?.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      gaze.removeEventListener('loadedmetadata', onGazeMetadata);
      gaze.removeEventListener('durationchange', onGazeMetadata);
      gaze.removeEventListener('seeked', wake);
      film.removeEventListener('loadedmetadata', onFilmMetadata);
      film.removeEventListener('durationchange', onFilmMetadata);
      film.removeEventListener('loadeddata', onFilmLoaded);
      film.removeEventListener('seeked', wake);
    };
  }, [stageRef, scrollRef]);

  return <>
    <div className="hero-scrub">
    <video ref={gazeRef} className="hero-gaze-video" muted playsInline preload="auto"
      poster={`${import.meta.env.BASE_URL}media/hero-eyes-hd-alpha-poster.png`} aria-label="人物眼神和头部随鼠标移动">
      <source src={`${import.meta.env.BASE_URL}media/hero-eyes-hd-alpha.webm?v=2`} type="video/webm" />
      <source src={`${import.meta.env.BASE_URL}media/hero-eyes-hd-scrub.mp4`} type="video/mp4" />
    </video>
    <div className="hero-scrub-hint" aria-hidden="true"><span>←</span> MOVE / DRAG TO LOOK AROUND <span>→</span></div>
    <div className="hero-scrub-track" aria-hidden="true"><span ref={pointerBarRef} /></div>
    <div className="hero-film-track" aria-hidden="true"><span ref={scrollBarRef} /></div>
    </div>
    <video ref={filmRef} className="hero-film-video" muted playsInline preload="auto"
      poster={`${import.meta.env.BASE_URL}media/middle-film-alpha-poster.png`} aria-label="人物动作随页面滚动向前和向后">
      <source src={`${import.meta.env.BASE_URL}media/middle-film-alpha.webm?v=8`} type="video/webm" />
      <source src={`${import.meta.env.BASE_URL}media/middle-film-scrub.mp4`} type="video/mp4" />
    </video>
  </>;
}
