import React, { useEffect, useRef } from 'react';

export default function CursorFollower() {
  const ref = useRef(null);
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const el = ref.current;
    document.documentElement.classList.add('has-avatar-cursor');
    let raf = 0;
    const current = { x: -100, y: -100 };
    const target = { x: -100, y: -100 };
    const tick = () => {
      raf = 0;
      current.x += (target.x - current.x) * 0.2;
      current.y += (target.y - current.y) * 0.2;
      el.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`;
      if (Math.abs(current.x - target.x) > 0.1 || Math.abs(current.y - target.y) > 0.1) raf = requestAnimationFrame(tick);
    };
    const move = event => {
      target.x = event.clientX;
      target.y = event.clientY;
      el.classList.add('is-visible');
      el.classList.toggle('is-active', !!event.target.closest('a, button, .flex-carousel'));
      el.classList.toggle('is-corridor', !!event.target.closest('.project-corridor'));
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const hide = () => el.classList.remove('is-visible');
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('mouseleave', hide);
    window.addEventListener('blur', hide);
    return () => {
      document.documentElement.classList.remove('has-avatar-cursor');
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('mouseleave', hide);
      window.removeEventListener('blur', hide);
    };
  }, []);
  return <div className="cursor-follower" ref={ref} aria-hidden="true"><img src={`${import.meta.env.BASE_URL}media/vicky-pixel-avatar.png`} alt="" /><span>DRAG</span></div>;
}
