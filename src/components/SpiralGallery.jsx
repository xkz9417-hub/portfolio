import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COMPACT_MOTION, REDUCED_MOTION, useMediaQuery } from './useMediaQuery';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function SpiralGallery({ projects }) {
  const sectionRef = useRef(null);
  const compact = useMediaQuery(COMPACT_MOTION);
  const reducedMotion = useMediaQuery(REDUCED_MOTION);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) return;
    const sticky = section.querySelector('.spiral-sticky');
    const cards = [...section.querySelectorAll('.spiral-card')];
    const covers = cards.map(card => card.querySelector('img'));
    const visibleRadius = compact ? 2.3 : 3.45;
    let side = 0;
    let stride = 0;
    let nearGallery = false;
    let progressAtRender = 0;
    const measure = () => {
      side = Math.min(sticky.clientWidth * (compact ? .11 : .2), 310);
      stride = Math.min(sticky.clientHeight * (compact ? .27 : .245), 230);
    };
    const render = progress => {
      progressAtRender = progress;
      const focus = progress * (projects.length - 1);
      cards.forEach((card, index) => {
        const d = index - focus;
        const distance = Math.abs(d);
        const visible = distance < visibleRadius;
        const keyboardReachable = distance < (compact ? 1.45 : .8);
        card.style.visibility = visible ? 'visible' : 'hidden';
        card.style.pointerEvents = visible ? 'auto' : 'none';
        card.tabIndex = keyboardReachable ? 0 : -1;
        if (nearGallery && distance < visibleRadius + 2 && covers[index].loading === 'lazy') {
          covers[index].loading = 'eager';
        }
        if (!visible) return;
        const x = Math.sin(d * 1.08) * side;
        const angle = compact ? 10 : 16;
        card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${d * stride}px, ${-distance * 125}px) rotateY(${-d * angle}deg) rotateZ(${Math.sin(d * .8) * 7}deg) scale(${Math.max(.58, 1 - distance * .13)})`;
        card.style.opacity = String(Math.max(0, 1 - distance / visibleRadius));
        card.style.zIndex = String(Math.round(100 - distance * 10));
      });
    };
    measure();
    render(0);
    const coverObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      nearGallery = true;
      coverObserver.disconnect();
      render(progressAtRender);
    }, { rootMargin: '500px' });
    coverObserver.observe(section);
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: () => `top ${getComputedStyle(sticky).top}`,
      end: () => `+=${section.clientHeight - sticky.clientHeight}`,
      invalidateOnRefresh: true,
      onUpdate: self => render(self.progress),
      onRefresh: self => {
        measure();
        render(self.progress);
      }
    });
    return () => {
      coverObserver.disconnect();
      trigger.kill();
      for (const card of cards) {
        for (const property of ['visibility', 'pointer-events', 'transform', 'opacity', 'z-index']) {
          card.style.removeProperty(property);
        }
        card.removeAttribute('tabindex');
      }
    };
  }, { scope: sectionRef, dependencies: [projects, compact, reducedMotion], revertOnUpdate: true });

  return <section className="work spiral-work" id="work" aria-label="精选作品">
    <div className="spiral-scroll" ref={sectionRef}>
    <div className="spiral-sticky">
      <div className="spiral-grid" aria-hidden="true" />
      <div className="spiral-space" aria-label="作品展示">
        {projects.map((project, index) => <a
          className="spiral-card" href={project.href} key={project.n}
          aria-label={`查看项目 ${project.n}：${project.title}`}
          style={{ '--card-index': index }}>
          <img src={`${import.meta.env.BASE_URL}media/${project.cover ?? project.image}`} alt={project.title} loading="lazy" decoding="async" />
          <span className="spiral-card-label"><small>PROJECT / {project.n}</small><strong>{project.title}</strong><i>↗︎</i></span>
        </a>)}
      </div>
      {compact && !reducedMotion && <a className="spiral-index-jump" href="#project-index">查看全部作品 ↓</a>}
    </div>
    </div>
    <div className="spiral-index container" id="project-index" aria-label="十三个项目列表">
      <div className="spiral-index-heading"><span>PROJECT INDEX / 01—13</span><span>选择项目，查看完整作品页 ↗</span></div>
      <div className="spiral-index-grid">{projects.map(project => <a href={project.href} key={project.n} className="spiral-index-row">
        <span>{project.n}</span><strong>{project.title}</strong><small>{project.category}</small><span>↗</span>
      </a>)}</div>
      <a className="spiral-all" href={`${import.meta.env.BASE_URL}media/Vicky-Portfolio-2027.pdf`} target="_blank" rel="noreferrer">完整作品集 PDF <span>↗</span></a>
    </div>
  </section>;
}
