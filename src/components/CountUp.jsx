import React, { useEffect, useRef } from 'react';

const easeOutCubic = value => 1 - (1 - value) ** 3;
const clamp = value => Math.min(1, Math.max(0, value));

export default function CountUp({
  from = 0,
  to = 100,
  mode = 'count',
  easing = 'easeOut',
  format = 'standard',
  separator = ',',
  prefix = '',
  suffix = '',
  direction = 'up',
  duration = 1,
  delay = 0,
  trigger = 'view',
  replayOnHover = false,
  padStart = 0,
  className = '',
  style
}) {
  const ref = useRef(null);
  const initial = direction === 'down' ? to : from;

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let timer = 0;
    let visible = false;

    const display = number => {
      const whole = Math.round(number);
      const absolute = Math.abs(whole).toString().padStart(padStart, '0');
      const grouped = format === 'standard' && separator
        ? absolute.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
        : absolute;
      element.textContent = `${prefix}${whole < 0 ? '-' : ''}${grouped}${suffix}`;
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      frame = 0;
      timer = 0;
    };
    const play = () => {
      stop();
      const startValue = direction === 'down' ? to : from;
      const endValue = direction === 'down' ? from : to;
      if (reducedMotion.matches || mode !== 'count' || duration <= 0) {
        display(endValue);
        return;
      }
      display(startValue);
      timer = window.setTimeout(() => {
        const started = performance.now();
        const tick = now => {
          const progress = clamp((now - started) / (duration * 1000));
          const eased = easing === 'easeOut' ? easeOutCubic(progress) : progress;
          display(startValue + (endValue - startValue) * eased);
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      }, delay * 1000);
    };
    const onHover = () => { if (replayOnHover && visible) play(); };
    element.addEventListener('pointerenter', onHover);
    const card = element.closest('.identity-exp-card');
    const onManualPlay = () => { visible = true; play(); };
    const onManualReset = () => { visible = false; stop(); display(initial); };

    let observer;
    if (trigger === 'view') {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !visible) { visible = true; play(); }
        if (!entry.isIntersecting && visible) {
          visible = false;
          stop();
          display(initial);
        }
      }, { threshold: 0.25 });
      observer.observe(element);
    } else if (trigger === 'manual') {
      card?.addEventListener('countup:play', onManualPlay);
      card?.addEventListener('countup:reset', onManualReset);
      if (card?.dataset.countActive === 'true') onManualPlay();
    } else {
      visible = true;
      play();
    }

    return () => {
      stop();
      observer?.disconnect();
      element.removeEventListener('pointerenter', onHover);
      card?.removeEventListener('countup:play', onManualPlay);
      card?.removeEventListener('countup:reset', onManualReset);
    };
  }, [from, to, mode, easing, format, separator, prefix, suffix, direction, duration, delay, trigger, replayOnHover, padStart, initial]);

  return <span ref={ref} className={className} style={style} aria-label={`${prefix}${to}${suffix}`}>
    {prefix}{String(initial).padStart(padStart, '0')}{suffix}
  </span>;
}
