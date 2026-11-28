import React, { useLayoutEffect, useRef } from 'react';
import FuzzyArtwork from './FuzzyArtwork';
import FuzzyCopy from './FuzzyCopy';
import MobileHeroMotion from './MobileHeroMotion';

const media = `${import.meta.env.BASE_URL}media/`;

export default function MobileIntro() {
  const scrollRef = useRef(null);
  const viewportRef = useRef(null);
  const stageRef = useRef(null);

  useLayoutEffect(() => {
    const site = scrollRef.current.closest('.mobile-site');
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    let frame = 0;

    // A plain homepage visit starts at the hero, including after a WebView restores a page.
    const resetHome = () => {
      if (window.location.hash) return;
      window.scrollTo({ top: 0, behavior: 'instant' });
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!window.location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
      });
    };
    // Keep the shareable URL clean when jumping between sections on mobile.
    const onAnchorClick = event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target.closest('a[href^="#"]');
      const id = anchor?.getAttribute('href')?.slice(1);
      const section = id && document.getElementById(id);
      if (!section || !site.contains(section)) return;
      event.preventDefault();
      cancelAnimationFrame(frame);
      if (window.location.hash) history.replaceState(history.state, '', window.location.pathname + window.location.search);
      section.scrollIntoView({ behavior: 'auto' });
    };
    resetHome();
    window.addEventListener('pageshow', resetHome);
    site.addEventListener('click', onAnchorClick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pageshow', resetHome);
      site.removeEventListener('click', onAnchorClick);
      history.scrollRestoration = previous;
    };
  }, []);

  return <div className="hero-scroll mobile-hero-scroll" id="top" ref={scrollRef}>
    <div className="mobile-intro" ref={viewportRef}>
      <div className="mobile-intro-backdrop" aria-hidden="true"
        style={{ backgroundImage: `url("${media}hero-eyes-mobile-poster.webp")` }} />
      <section className="hero mobile-intro-frame" ref={stageRef} aria-labelledby="mobile-intro-title">
        <h1 id="mobile-intro-title" className="hero-title-art-wrap" aria-label="Vicky's Archive · 张许可的视觉作品集">
          <FuzzyArtwork src={media + 'hero-title.webp'} className="hero-title-art" />
        </h1>
        <MobileHeroMotion stageRef={stageRef} scrollRef={scrollRef} viewportRef={viewportRef} />
        <FuzzyCopy className="hero-film-copy" lines={['耳机一戴，', '脑洞打开。']} />
      </section>
      <a className="mobile-intro-enter" href="#work">进入作品集 <span aria-hidden="true">↓</span></a>
    </div>
  </div>;
}
