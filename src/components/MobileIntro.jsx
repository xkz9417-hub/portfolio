import React, { useRef } from 'react';
import FuzzyArtwork from './FuzzyArtwork';
import FuzzyCopy from './FuzzyCopy';
import UnifiedHeroVideo from './UnifiedHeroVideo';

const media = `${import.meta.env.BASE_URL}media/`;

export default function MobileIntro() {
  const scrollRef = useRef(null);
  const viewportRef = useRef(null);
  const stageRef = useRef(null);

  return <div className="hero-scroll mobile-hero-scroll" id="top" ref={scrollRef}>
    <div className="mobile-intro" ref={viewportRef}>
      <div className="mobile-intro-backdrop" aria-hidden="true"
        style={{ backgroundImage: `url("${media}hero-eyes-mobile-poster.webp")` }} />
      <section className="hero mobile-intro-frame" ref={stageRef} aria-labelledby="mobile-intro-title">
        <h1 id="mobile-intro-title" className="hero-title-art-wrap" aria-label="Vicky's Archive · 张许可的视觉作品集">
          <FuzzyArtwork src={media + 'hero-title.webp'} className="hero-title-art" />
        </h1>
        <UnifiedHeroVideo stageRef={stageRef} scrollRef={scrollRef} viewportRef={viewportRef} />
        <FuzzyCopy className="hero-film-copy" lines={['耳机一戴，', '脑洞打开。']} />
      </section>
      <a className="mobile-intro-enter" href="#work">进入作品集 <span aria-hidden="true">↓</span></a>
    </div>
  </div>;
}
