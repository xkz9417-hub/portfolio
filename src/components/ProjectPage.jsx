import React, { useEffect, useRef, useState } from 'react';
import { loadSeekableVideo } from './loadSeekableVideo';
const MEDIA = `${import.meta.env.BASE_URL}media/`;
const workHref = `${import.meta.env.BASE_URL}#work`;
const slideHeights = { 6: 915, 7: 1271, 13: 915, 15: 908, 103: 2178, 104: 980, 105: 1067, 106: 969, 107: 969, 143: 915 };

function ProjectVideo({ project }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('waiting');
  const url = MEDIA + project.video;

  useEffect(() => {
    const video = videoRef.current;
    const controller = new AbortController();
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      setStatus('loading');
      loadSeekableVideo(video, [{ url, type: 'video/mp4' }], controller.signal).then(ready => {
        if (!controller.signal.aborted) setStatus(ready ? 'ready' : 'error');
      });
    }, { rootMargin: '240px' });
    observer.observe(video);
    return () => {
      observer.disconnect();
      controller.abort();
    };
  }, [url]);

  return <figure className="project-page-video container">
    <video ref={videoRef} controls={status === 'ready'} playsInline preload="auto"
      poster={MEDIA + project.image} aria-label={`${project.title}项目视频`} />
    <figcaption>
      {project.title} / 项目视频
      <span role="status">{status === 'loading' ? ' · 正在加载视频…' : ''}</span>
      {status === 'error' && <> · 视频暂时无法播放，<a href={url} download>下载原视频</a></>}
    </figcaption>
  </figure>;
}

export default function ProjectPage({ project, projects }) {
  const index = projects.indexOf(project);
  const next = projects[(index + 1) % projects.length];
  useEffect(() => {
    document.title = `${project.title} · Vicky's Archive`;
    return () => { document.title = "Vicky's Archive"; };
  }, [project.title]);

  return <div className="project-page">
    <header className="project-page-header"><a href={workHref} aria-label="返回作品列表" className="project-page-brand">VICKY'S ARCHIVE<span>↗</span></a><a href={workHref} className="project-page-back">← BACK TO WORK</a></header>
    <main>
      <div className="project-page-intro container">
        <p>PROJECT FILE / {project.n} — 13 <span>{project.category}</span></p>
        <h1>{project.title}<i>.</i></h1>
        <div className="project-page-intro-bottom"><strong>{project.en}</strong><span>{project.year} / {project.role}</span></div>
      </div>
      <div className="project-page-summary container"><span>ABOUT THE PROJECT / 项目简介</span><p>{project.description}</p></div>
      {project.video && <ProjectVideo project={project} />}
      <div className="project-page-slides container" aria-label={`${project.title}完整项目展示`}>
        {project.slides.map((slide, slideIndex) => <figure key={slide}>
          <img src={`${MEDIA}project-pages/${slide}.png`} width={1625} height={slideHeights[slide] ?? 917}
            alt={`${project.title}项目作品第${slideIndex + 1}页`} loading="lazy" decoding="async" />
          <figcaption><span>{project.n} / {String(slideIndex + 1).padStart(2, '0')}</span><span>VICKY'S ARCHIVE</span></figcaption>
        </figure>)}
      </div>
      <nav className="project-page-next container" aria-label="继续浏览项目"><span>NEXT PROJECT / {next.n}</span><a href={next.href}>{next.title}<i>↗</i></a></nav>
    </main>
  </div>;
}
