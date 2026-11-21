import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function WaveLetters({ text, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    const letters = [...root.querySelectorAll('span')];
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const movers = letters.map(letter => ({ y: gsap.quickTo(letter, 'y', { duration: 0.7, ease: 'power3.out' }), rotate: gsap.quickTo(letter, 'rotation', { duration: 0.8, ease: 'power3.out' }) }));
    const move = event => {
      letters.forEach((letter, i) => {
        const box = letter.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        const distance = Math.hypot(dx, dy);
        const wave = Math.pow(Math.max(0, 1 - distance / 230), 2);
        movers[i].y(-53 * wave * Math.sign(dy || 1));
        movers[i].rotate(-9 * wave * Math.sign(dx || 1));
      });
    };
    const reset = () => movers.forEach(mover => { mover.y(0); mover.rotate(0); });
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerleave', reset);
    return () => {
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', reset);
      movers.forEach(mover => { mover.y.tween?.kill(); mover.rotate.tween?.kill(); });
    };
  }, []);
  return <span ref={ref} className={`wave-letters ${className}`} aria-label={text}>{[...text].map((letter, i) => <span key={i} aria-hidden="true">{letter}</span>)}</span>;
}
