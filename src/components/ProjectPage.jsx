import React, { useEffect } from 'react';
const MEDIA = `${import.meta.env.BASE_URL}media/`;

export default function ProjectPage({ project, projects }) {
  const index = projects.indexOf(project);
  const next = projects[(index + 1) % projects.length];
  useEffect(() => {
    document.title = `${project.title} · Vicky's Archive`;
    return () => { document.title = "Vicky's Archive"; };
  }, [project.title]);

  return <div className="project-page">
    <header className="project-page-header"><a href="/#work" aria-label="返回作品列表" className="project-page-brand">VICKY'S ARCHIVE<span>↗</span></a><a href="/#work" className="project-page-back">← BACK TO WORK</a></header>
    <main>
      <div className="project-page-intro container">
        <p>PROJECT FILE / {project.n} — 13 <span>{project.category}</span></p>
        <h1>{project.title}<i>.</i></h1>
        <div className="project-page-intro-bottom"><strong>{project.en}</strong><span>{project.year} / {project.role}</span></div>
      </div>
      <div className="project-page-summary container"><span>ABOUT THE PROJECT / 项目简介</span><p>{project.description}</p></div>
      {project.video && <figure className="project-page-video container">
        <video controls playsInline preload="metadata" poster={`${MEDIA}${project.image}`} aria-label={`${project.title}项目视频`}>
          <source src={`${MEDIA}${project.video}`} type="video/mp4" />
          您的浏览器暂不支持播放此视频。
        </video>
        <figcaption>{project.title} / 项目视频</figcaption>
      </figure>}
      <div className="project-page-slides container" aria-label={`${project.title}完整项目展示`}>
        {project.slides.map((slide, slideIndex) => <figure key={slide}>
          <img src={`${MEDIA}project-pages/${slide}.png`} alt={`${project.title}项目作品第${slideIndex + 1}页`} loading={slideIndex < 2 ? 'eager' : 'lazy'} />
          <figcaption><span>{project.n} / {String(slideIndex + 1).padStart(2, '0')}</span><span>VICKY'S ARCHIVE</span></figcaption>
        </figure>)}
      </div>
      <nav className="project-page-next container" aria-label="继续浏览项目"><span>NEXT PROJECT / {next.n}</span><a href={next.href}>{next.title}<i>↗</i></a></nav>
    </main>
  </div>;
}
