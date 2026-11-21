import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function SpiralGallery({ projects }) {
  const sectionRef = useRef(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia('(max-width: 700px), (prefers-reduced-motion: reduce)').matches) return;
    const cards = [...section.querySelectorAll('.spiral-card')];
    const render = progress => {
      const focus = progress * (projects.length - 1);
      const side = Math.min(window.innerWidth * .2, 310);
      const stride = Math.min(window.innerHeight * .245, 230);
      cards.forEach((card, index) => {
        const d = index - focus;
        const distance = Math.abs(d);
        gsap.set(card, {
          xPercent: -50,
          yPercent: -50,
          x: Math.sin(d * 1.08) * side,
          y: d * stride,
          z: -distance * 125,
          rotationY: -d * 16,
          rotationZ: Math.sin(d * .8) * 7,
          scale: Math.max(.58, 1 - distance * .13),
          opacity: distance < 3.45 ? Math.max(.18, 1 - distance * .23) : 0,
          visibility: distance < 3.45 ? 'visible' : 'hidden',
          pointerEvents: distance < .8 ? 'auto' : 'none',
          zIndex: Math.round(100 - distance * 10)
        });
      });
    };
    render(0);
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      onUpdate: self => render(self.progress),
      onRefresh: self => render(self.progress)
    });
    return () => trigger.kill();
  }, { scope: sectionRef, dependencies: [projects] });

  return <section className="work spiral-work" id="work" aria-label="精选作品">
    <div className="spiral-scroll" ref={sectionRef}>
    <div className="spiral-sticky">
      <div className="spiral-grid" aria-hidden="true" />
      <div className="spiral-space" aria-label="可点击的项目螺旋展示">
        {projects.map((project, index) => <a
          className="spiral-card" href={project.href} key={project.n}
          aria-label={`查看项目 ${project.n}：${project.title}`}
          style={{ '--card-index': index }}>
          <img src={`${import.meta.env.BASE_URL}media/${project.cover ?? project.image}`} alt={project.title} loading={index < 3 ? 'eager' : 'lazy'} />
          <span className="spiral-card-label"><small>PROJECT / {project.n}</small><strong>{project.title}</strong><i>↗</i></span>
        </a>)}
      </div>
    </div>
    </div>
    <div className="spiral-index container" aria-label="十三个项目列表">
      <div className="spiral-index-heading"><span>PROJECT INDEX / 01—13</span><span>选择项目，查看完整作品页 ↗</span></div>
      <div className="spiral-index-grid">{projects.map(project => <a href={project.href} key={project.n} className="spiral-index-row">
        <span>{project.n}</span><strong>{project.title}</strong><small>{project.category}</small><span>↗</span>
      </a>)}</div>
      <a className="spiral-all" href={`${import.meta.env.BASE_URL}media/Vicky-Portfolio-2027.pdf`} target="_blank" rel="noreferrer">完整作品集 PDF <span>↗</span></a>
    </div>
  </section>;
}
