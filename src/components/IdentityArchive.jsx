import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import CountUp from './CountUp';
import FuzzyCopy from './FuzzyCopy';
import './identity-archive.css';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const PHOTO = `${import.meta.env.BASE_URL}media/vicky-photo.png`;

const experience = [
  {
    company: '爱奇艺', role: 'IP 衍生运营组 · 设计实习生',
    metrics: [
      { value: 8, padStart: 2, label: 'IP PROJECTS', cn: 'IP 项目' },
      { value: 30, suffix: '+', label: 'SOCIAL VISUALS', cn: '外宣设计' },
      { value: 50, suffix: '+', label: 'PROMOTION DESIGNS', cn: '推广设计' }
    ],
    detail: '参与《重器》《师兄太稳健》《莲花楼》等 8 个 IP 项目，完成主视觉、页面和推广延展；累计完成 30+ 外宣设计与 50+ 推广设计。负责 APP 商城资源位和专题页，并运用 ChatGPT、Codex、Lovart 辅助创意与视觉工作流。'
  },
  {
    company: '东方甄选', role: 'APP 运营部 · 设计实习生',
    metrics: [
      { value: 5, padStart: 2, label: 'CAMPAIGNS', cn: '营销活动' },
      { value: 30, suffix: '+', label: 'PROMOTION DESIGNS', cn: '推广延展设计' }
    ],
    detail: '负责 APP 商城 Banner、开屏、弹窗及落地页设计，参与 5 个营销活动专题，完成 30+ 推广延展设计；同时制作视频号直播预告、直播间和社媒宣传物料。'
  },
  {
    company: '沈阳元一文化产业发展有限公司', role: '设计实习生',
    metrics: [{ value: 8, padStart: 2, label: 'PROJECTS', cn: '参与项目' }],
    detail: '参与 8 个项目，涵盖世界小镇文化展、科技成果展及青年社区活动的视觉物料设计；参与沈阳博士行 AIGC 宣传片制作，主策划 AI 抱抱年度晚会并完成概念视觉、AIGC 开场动画及相关物料。'
  },
  {
    company: '自由插画师 / 设计师', role: '独立接案 · 2023.11 至今',
    metrics: [{ value: 300, suffix: '+', label: 'COMMISSIONS', cn: '定制稿件' }],
    detail: '独立承接线上插画及视觉设计需求，累计交付 300+ 定制稿件，具备从需求沟通、方案设计到优化交付的完整商业项目经验。'
  }
];

function IntroHeader({ preview = false }) {
  return <div className="identity-intro-header">
    <div className="identity-intro-title">
      <h2 id={preview ? undefined : 'identity-about-title'}><FuzzyCopy lines={['WORK', 'HISTORY']} className="identity-history-fuzzy" /><i>.</i></h2>
    </div>
    <div className="identity-intro-text">
      <span>张许可 / VICKY</span>
      <p>你好，我是张许可，一名专注于品牌视觉、运营视觉与 AIGC 创意的视觉设计师。</p>
      <small>VISUAL DESIGNER · 2027 GRADUATE</small>
    </div>
    <figure className="identity-portrait"><img src={PHOTO} alt={preview ? '' : '视觉设计师张许可的照片'} draggable="false" /></figure>
  </div>;
}

function Metric({ item, index = 0, preview = false }) {
  return <div className="identity-metric">
    <CountUp
      from={0} to={item.value} mode="count" easing="easeOut" format="standard"
      separator="," suffix={item.suffix || ''} padStart={item.padStart || 0}
      duration={1.15} delay={index * .09} trigger={preview ? 'manual' : 'view'}
      replayOnHover className="count-up-text"
    />
    <span>{item.label}<small>{item.cn}</small></span>
  </div>;
}

function ExperienceCard({ item, index, preview = false }) {
  return <details className={`identity-exp-card${preview ? ' identity-exp-card-preview' : ''}`}
    onMouseEnter={event => { if (window.matchMedia('(hover: hover)').matches) event.currentTarget.open = true; }}
    onMouseLeave={event => { if (event.currentTarget.dataset.pinned !== 'true') event.currentTarget.open = false; }}>
    <summary tabIndex={preview ? -1 : undefined} onClick={event => {
      event.preventDefault();
      const card = event.currentTarget.parentElement;
      const pinned = card.dataset.pinned === 'true';
      card.dataset.pinned = String(!pinned);
      card.open = !pinned;
    }}>
      <span className="identity-exp-index">FILE / 00{index + 1}<i>↗</i></span>
      <h3 className={index === 2 ? 'identity-company-long' : undefined}>{item.company}</h3>
      <span className="identity-exp-role">{item.role}</span>
      <div className="identity-exp-metrics">
        {item.metrics.map((metric, metricIndex) => <Metric key={metric.label} item={metric} index={metricIndex} preview={preview} />)}
      </div>
      <span className="identity-exp-action">OPEN FILE <i>＋</i></span>
    </summary>
    <div className="identity-exp-detail"><p>{item.detail}</p></div>
  </details>;
}

export default function IdentityArchive() {
  const sequenceRef = useRef(null);
  const sectionRef = useRef(null);
  const [introVisible, setIntroVisible] = useState(true);

  const skip = useCallback(() => {
    const section = sectionRef.current;
    if (section) window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const update = () => setIntroVisible((sectionRef.current?.getBoundingClientRect().top ?? 0) > 2);
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  useGSAP(() => {
    const sequence = sequenceRef.current;
    if (!sequence || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const q = selector => sequence.querySelector(selector);
    const previewCards = sequence.querySelectorAll('.identity-preview .identity-exp-card');
    const compact = window.matchMedia('(max-width: 600px)').matches;
    gsap.set(previewCards, { y: 125, autoAlpha: 0, pointerEvents: 'none' });
    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sequence,
        start: 'top top',
        end: 'bottom bottom',
        scrub: compact ? .12 : .2,
        invalidateOnRefresh: true
      }
    });

    timeline
      .fromTo(q('.unlock-word'), { xPercent: -125, scale: .55, skewX: -12, autoAlpha: 0 },
        { xPercent: -7, scale: 1, skewX: 0, autoAlpha: 1, duration: .7, ease: 'power4.out' }, 0)
      .to(q('.unlock-word'), { xPercent: -30, scale: compact ? 3 : 4, duration: .68, ease: 'power3.in' }, .65)
      .to(q('.unlock-blackout'), { scaleY: 1, duration: .16 }, 1.17)
      .set(q('.unlock-freeze'), { autoAlpha: 0 }, 1.34)
      .set(q('.identity-preview'), { autoAlpha: 1 }, 1.35)
      .to(q('.unlock-blackout'), { yPercent: -101, duration: .83, ease: 'power3.inOut' }, 1.42)
      .fromTo(q('.identity-preview .identity-intro-header'), { y: 105, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: .92, ease: 'power3.out' }, 1.58)
      .fromTo(q('.identity-preview .identity-intro-title h2'), { y: 70, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: .9, ease: 'power3.out' }, 1.68)
      .fromTo(q('.identity-preview .identity-intro-text > *'), { y: 42, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: .7, stagger: .13, ease: 'power2.out' }, 1.85)
      .fromTo(q('.identity-preview .identity-portrait'), { clipPath: 'inset(100% 0 0 0)' },
        { clipPath: 'inset(0% 0 0 0)', duration: .94, ease: 'power3.out' }, 1.89)
      .fromTo(q('.identity-preview .identity-portrait img'), { yPercent: 15, scale: 1.08 },
        { yPercent: 0, scale: 1, duration: 1.05, ease: 'power3.out' }, 1.89)
      .fromTo(q('.identity-preview .identity-experience-topline'), { y: 48, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: .63, ease: 'power2.out' }, 2.1)
      .to({}, { duration: .4 }, 4.1)
      .fromTo(q('.unlock-stage'), { autoAlpha: 1 }, { autoAlpha: 0, duration: .02 }, 4.48);

    previewCards.forEach((card, index) => {
      timeline.to(card, {
        y: 0, autoAlpha: 1, duration: .85, ease: 'power3.out',
        onStart: () => { card.style.pointerEvents = 'auto'; card.dataset.countActive = 'true'; card.dispatchEvent(new Event('countup:play')); },
        onReverseComplete: () => { card.style.pointerEvents = 'none'; delete card.dataset.countActive; card.dispatchEvent(new Event('countup:reset')); }
      }, 2.25 + index * .23);
    });

    return () => timeline.scrollTrigger?.kill();
  }, { scope: sequenceRef });

  return <>
    <div className="unlock-sequence" ref={sequenceRef} aria-hidden="true">
      <div className="unlock-stage">
        <div className="unlock-freeze">
          <div className="unlock-word">WHO IS<br />VICKY?</div>
        </div>
        <div className="unlock-blackout" />
        <div className="identity-preview"><div className="identity-page container">
          <IntroHeader preview />
          <div className="identity-experience-topline"><span>SELECTED EXPERIENCE / 01—04</span><span>HOVER OR CLICK TO OPEN FILES</span></div>
          <div className="identity-experience-grid">{experience.map((item, index) => <ExperienceCard key={item.company} item={item} index={index} preview />)}</div>
        </div></div>
      </div>
    </div>

    {introVisible && <button className="unlock-skip" type="button" onClick={skip}>SKIP INTRO <span>↗</span></button>}

    <section className="identity-section" id="about" ref={sectionRef} aria-labelledby="identity-about-title">
      <div className="identity-page container">
        <IntroHeader />
        <div className="identity-experience-topline"><span>SELECTED EXPERIENCE / 01—04</span><span>HOVER OR CLICK TO OPEN FILES</span></div>
        <div className="identity-experience-grid">
          {experience.map((item, index) => <ExperienceCard key={item.company} item={item} index={index} />)}
        </div>
      </div>
    </section>
  </>;
}
