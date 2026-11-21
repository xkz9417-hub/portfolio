import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const EASE = 'power4.out';

export function usePortfolioMotion(scopeRef) {
  useGSAP(() => {
    const root = scopeRef.current;
    if (!root) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const initialAnchor = ['#about', '#work', '#contact'].includes(window.location.hash)
      ? window.location.hash : null;

    if (reducedMotion) {
      if (initialAnchor) {
        requestAnimationFrame(() => root.querySelector(initialAnchor)?.scrollIntoView({ behavior: 'instant' }));
      }
      return undefined;
    }

    const indexRows = root.querySelectorAll('.spiral-index-row');
    if (indexRows.length) gsap.fromTo(indexRows, { y: 45, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.045, ease: EASE,
      scrollTrigger: { trigger: '.spiral-index', start: 'top 83%', once: true }
    });

    let alive = true;
    const refresh = () => { if (alive) ScrollTrigger.refresh(); };
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh, { once: true });
    let anchorFrame = 0;
    if (initialAnchor) {
      anchorFrame = requestAnimationFrame(() => {
        const target = root.querySelector(initialAnchor);
        target?.scrollIntoView({ behavior: 'instant' });
        ScrollTrigger.refresh();
      });
    }
    return () => {
      alive = false;
      cancelAnimationFrame(anchorFrame);
      window.removeEventListener('load', refresh);
    };
  }, { scope: scopeRef });

}
