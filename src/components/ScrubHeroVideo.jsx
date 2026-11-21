import React, { useEffect, useRef } from 'react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const SEEK_INTERVAL = 1000 / 30;
const FIRST_FRAME = 0.02;
const SEEK_TOLERANCE = 0.012;
// In this clip the eyes look right around 20% and left around 62%. Reading
// that interval backwards keeps the gaze aligned with the pointer.
const LOOK_LEFT = 0.62;
const LOOK_RIGHT = 0.2;

export default function ScrubHeroVideo({ stageRef }) {
  const videoRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    const root = stageRef.current;
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!root || !video) return undefined;

    let duration = NaN;
    let progress = 0;
    let targetTime = FIRST_FRAME;
    let activePointerId = null;
    let pointerInside = false;
    let inViewport = false;
    let intersects = false;
    let initialized = false;
    let frameId = 0;
    let lastSeekAt = -Infinity;
    let destroyed = false;

    const validDuration = () => Number.isFinite(duration) && duration > 0;
    const seekableTime = () => {
      const inset = Math.min(FIRST_FRAME, duration / 2);
      return clamp(targetTime, inset, Math.max(inset, duration - inset));
    };
    const cancelFrame = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
    };
    const shouldRun = () => !destroyed && inViewport && pointerInside && validDuration();

    const frame = now => {
      frameId = 0;
      if (!shouldRun()) return;

      const desired = seekableTime();
      if (!video.seeking && now - lastSeekAt >= SEEK_INTERVAL &&
          Math.abs(video.currentTime - desired) > SEEK_TOLERANCE) {
        try {
          video.currentTime = desired;
          lastSeekAt = now;
        } catch {
          // Metadata can disappear if the browser changes or rejects a source.
          return;
        }
      }

      if (video.seeking || Math.abs(video.currentTime - desired) > SEEK_TOLERANCE) {
        frameId = requestAnimationFrame(frame);
      }
    };
    const wake = () => {
      if (shouldRun() && !frameId) frameId = requestAnimationFrame(frame);
    };
    const stopTracking = () => {
      pointerInside = false;
      if (activePointerId !== null && root.hasPointerCapture(activePointerId)) {
        root.releasePointerCapture(activePointerId);
      }
      activePointerId = null;
      root.classList.remove('is-scrubbing');
      cancelFrame();
    };
    const updateFromPointer = event => {
      if (!inViewport) return;
      const rect = root.getBoundingClientRect();
      if (!(rect.width > 0) || !Number.isFinite(rect.width)) {
        stopTracking();
        return;
      }

      const inside = event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) {
        stopTracking();
        return;
      }

      pointerInside = true;
      progress = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      progressBar.style.transform = `scaleX(${progress})`;
      if (validDuration()) {
        targetTime = duration * (LOOK_LEFT + (LOOK_RIGHT - LOOK_LEFT) * progress);
        wake();
      }
    };
    const onPointerMove = event => {
      if (!inViewport || (activePointerId !== null && event.pointerId !== activePointerId)) return;
      if (event.pointerType === 'touch' && activePointerId === null) return;
      updateFromPointer(event);
    };
    const onPointerDown = event => {
      if (!inViewport || event.isPrimary === false || activePointerId !== null ||
          event.target.closest('a, button')) return;
      activePointerId = event.pointerId;
      root.setPointerCapture(event.pointerId);
      root.classList.add('is-scrubbing');
      updateFromPointer(event);
    };
    const onPointerUp = event => {
      if (event.pointerId !== activePointerId) return;
      updateFromPointer(event);
      if (activePointerId === null) return;
      const keepMouseHover = event.pointerType === 'mouse' && pointerInside && inViewport;
      if (root.hasPointerCapture(activePointerId)) root.releasePointerCapture(activePointerId);
      activePointerId = null;
      root.classList.remove('is-scrubbing');
      if (!keepMouseHover) {
        pointerInside = false;
        cancelFrame();
      }
    };
    const onPointerCancel = event => {
      if (event.pointerId === activePointerId) stopTracking();
    };
    const onPointerLeave = () => {
      if (activePointerId === null) stopTracking();
    };
    const onLostPointerCapture = event => {
      if (event.pointerId === activePointerId) stopTracking();
    };
    const onMetadata = () => {
      const nextDuration = video.duration;
      duration = Number.isFinite(nextDuration) && nextDuration > 0 ? nextDuration : NaN;
      video.pause();
      if (!validDuration()) return;
      if (!initialized) {
        try {
          video.currentTime = Math.min(FIRST_FRAME, duration / 2);
          initialized = true;
        } catch {
          return;
        }
      }
      targetTime = pointerInside
        ? duration * (LOOK_LEFT + (LOOK_RIGHT - LOOK_LEFT) * progress)
        : video.currentTime;
      wake();
    };
    const onSeeked = () => {
      if (shouldRun() && Math.abs(video.currentTime - seekableTime()) > SEEK_TOLERANCE) wake();
    };
    const onLoadedData = () => {
      if (validDuration() && !pointerInside && video.currentTime < FIRST_FRAME / 2) {
        try { video.currentTime = Math.min(FIRST_FRAME, duration / 2); } catch { /* Keep the poster. */ }
      }
    };
    const onVisibilityChange = () => {
      inViewport = intersects && !document.hidden;
      if (!inViewport) {
        video.pause();
        stopTracking();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      intersects = entry.isIntersecting && entry.intersectionRatio >= 0.05;
      inViewport = intersects && !document.hidden;
      if (!inViewport) {
        video.pause();
        stopTracking();
      }
    }, { threshold: [0, 0.05] });

    video.pause();
    root.addEventListener('pointermove', onPointerMove, { passive: true });
    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointercancel', onPointerCancel);
    root.addEventListener('pointerleave', onPointerLeave);
    root.addEventListener('lostpointercapture', onLostPointerCapture);
    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('durationchange', onMetadata);
    video.addEventListener('seeked', onSeeked);
    document.addEventListener('visibilitychange', onVisibilityChange);
    observer.observe(root);
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) onMetadata();

    return () => {
      destroyed = true;
      stopTracking();
      observer.disconnect();
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('pointercancel', onPointerCancel);
      root.removeEventListener('pointerleave', onPointerLeave);
      root.removeEventListener('lostpointercapture', onLostPointerCapture);
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('durationchange', onMetadata);
      video.removeEventListener('seeked', onSeeked);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      cancelFrame();
    };
  }, [stageRef]);

  return <div className="hero-scrub">
      <video ref={videoRef} muted playsInline preload="auto" poster={`${import.meta.env.BASE_URL}media/hero-eyes-sharp-poster.webp`} aria-label="人物眼神和头部随横向位置转动">
      <source src={`${import.meta.env.BASE_URL}media/hero-eyes-sharp.webm`} type="video/webm" />
      <source src={`${import.meta.env.BASE_URL}media/hero-eyes-sharp.mp4`} type="video/mp4" />
    </video>
    <div className="hero-scrub-hint" aria-hidden="true"><span>←</span> MOVE / DRAG TO LOOK AROUND <span>→</span></div>
    <div className="hero-scrub-track" aria-hidden="true"><span ref={progressRef} /></div>
  </div>;
}
