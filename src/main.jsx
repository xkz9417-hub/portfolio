import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import UnifiedHeroVideo from './components/UnifiedHeroVideo';
import FuzzyArtwork from './components/FuzzyArtwork';
import FuzzyCopy from './components/FuzzyCopy';
import FuzzyText from './components/FuzzyText';
import IdentityArchive from './components/IdentityArchive';
import DotField from './components/DotField';
import SpiralGallery from './components/SpiralGallery';
import ProjectPage from './components/ProjectPage';
import CursorFollower from './components/CursorFollower';
import { usePortfolioMotion } from './components/usePortfolioMotion';
import { COMPACT_MOTION, useMediaQuery } from './components/useMediaQuery';
import './style.css';
import './reference-theme.css';
import './motion.css';
import './corridor.css';
import './hero-scrub.css';
import './spiral-gallery.css';
import './project-page.css';
import './palette.css';

const M = `${import.meta.env.BASE_URL}media/`;

const projects = [
  { n: '01', title: '爱奇艺', en: 'BEYOND THE SCREEN', category: 'IP / DIGITAL CAMPAIGN', year: '2026', image: 'work-06-22.webp', description: '在爱奇艺 IP 衍生运营组，参与内容视觉、产品宣传与 APP 商城资源位的设计。', role: 'IP 衍生运营组 / 视觉设计' },
  { n: '02', title: '东方甄选', en: 'COMMERCE IN MOTION', category: 'DIGITAL / OPERATION', year: '2026', image: 'oriental.webp', description: '围绕 APP 运营场景，设计活动页面和传播素材，让内容与商品信息更清晰地被看见。', role: 'APP 运营部 / 视觉设计' },
  { n: '03', title: '小马到，好运来', en: 'GOOD THINGS AHEAD', category: 'BRAND / PACKAGING', year: '2026', image: 'horse.webp', description: '把「马到成功」转化成有亲和力的礼赠语言，构建角色、包装与品牌延展系统。', role: '品牌视觉 / 包装设计 / 物料延展' },
  { n: '04', title: '金凤扒鸡焕活', en: 'AN OLD CLASSIC, REIMAGINED', category: 'BRAND / IDENTITY', year: '2025', image: 'work-30-0.webp', description: '为老字号探索新的视觉性格，从识别系统到包装、零售物料形成完整表达。', role: '品牌策略 / 视觉系统 / 包装方案' },
  { n: '05', title: '冻梨零嘴', en: 'A LITTLE TASTE OF HOME', category: 'CHARACTER / BRAND', year: '2025', image: 'snacks-board.webp', description: '从东北「冻三样」提取角色特征，将地域记忆变成轻松鲜明的品牌故事。', role: '角色设定 / 品牌视觉 / 衍生应用' },
  { n: '06', title: '何氏布艺海报', en: 'FABRIC, REFRAMED', category: 'POSTER / PRINT', year: '2025', image: 'he-fabric.webp', description: '围绕布艺品牌的产品与纹理，完成平面海报及应用视觉设计。', role: '平面视觉 / 海报设计' },
  { n: '07', title: 'AI 抱抱年度晚会', en: 'A SOFTER FUTURE', category: 'AIGC / EVENT VISUAL', year: '2025', image: 'ai-hug-poster.jpg', description: '以「拥抱」回应技术变化，参与主题策划、概念影像与活动现场的视觉表达。', role: '主题策划 / AIGC 概念影像 / 活动物料' },
  { n: '08', title: '沈阳博士行创意宣传片', en: 'CITY OF IDEAS', category: 'AIGC / FILM', year: '2025', image: 'shenyang.webp', description: '为城市人才活动探索角色与影像的叙事方式，将创意概念延伸至传播场景。', role: '角色概念 / 创意影像' },
  { n: '09', title: '兰蔻品牌广告 AI 复刻', en: 'REIMAGINING BEAUTY', category: 'AIGC / FILM', year: '2025', image: 'lancome.webp', description: '以 AI 影像工作流复刻品牌广告的光线、材质与产品氛围。', role: 'AIGC 影像 / 视觉实验' },
  { n: '10', title: '世界小屋 Atlas Nook', en: 'SMALL OBJECTS, BIG STORIES', category: 'EXHIBITION / CULTURE', year: '2025', image: 'atlas.webp', description: '从手工玩偶的鲜明色彩和质朴形态提取语言，形成展览主视觉与现场应用。', role: '主视觉 / 宣传物料 / 展览落地' },
  { n: '11', title: '魔法学院派对', en: 'THREE FLOORS PARTY', category: 'EVENT / CAMPAIGN', year: '2025', image: 'magic-party.webp', description: '为派对活动建立带有奇幻氛围的主题视觉与现场传播物料。', role: '主题视觉 / 活动物料' },
  { n: '12', title: '大学生科技成果展', en: 'MADE TO DISCOVER', category: 'EXHIBITION / EVENT', year: '2025', image: 'science.webp', description: '将科技成果内容组织成便于观众阅读的展览视觉与展示空间。', role: '展示视觉 / 信息设计' },
  { n: '13', title: '春和艺术展', en: 'SPRING IN FORM', category: 'EXHIBITION / VISUAL', year: '2025', image: 'spring-art.webp', description: '以轻盈流动的视觉符号，为艺术展建立统一的平面与现场表达。', role: '展览视觉 / 空间应用' },
];

const projectSlides = [
  [139, 55, 148, 149], [141, 155, 156], [6, 7, 100, 101, 102, 103, 104, 105],
  [143, 13, 15, 106, 107, 108, 109], [122, 110, 111, 112], [113, 114, 115, 116],
  [117, 118, 119, 120, 121], [123, 124], [125, 126],
  [127, 128, 129], [130, 131, 132], [136, 134, 135], [137, 147]
];
const projectVideos = {
  '07': 'ai-hug-opening.mp4',
  '09': 'beauty-ad-remake.mp4'
};
projects.forEach((project, index) => {
  project.slides = projectSlides[index];
  project.href = `${import.meta.env.BASE_URL}projects/${project.n}/`;
  project.cover = `work-covers/${project.n}.webp`;
  project.video = projectVideos[project.n];
});

function Arrow({ diagonal = false }) {
  return <span className="arrow" aria-hidden="true">{diagonal ? '↗' : '→'}</span>;
}

function SectionLabel({ index, children, light = false }) {
  return <div className={`section-label ${light ? 'section-label-light' : ''}`}><span>{index}</span><span>{children}</span><span className="label-line" /></div>;
}

function ChapterTitle({ children }) {
  return <div className="chapter-title" aria-hidden="true"><span className="chapter-mask"><span className="chapter-line"><span className="contact-title-text"><FuzzyText
    fontSize="inherit"
    color="currentColor"
    colorSplit={0}
    trigger="hover"
    direction="horizontal"
    baseIntensity={0.2}
    hoverIntensity={0.5}
    fuzzRange={30}
    sliceSize={1}
    fps={60}
    transitionDuration={0}
    intro
    introDuration={1400}
    letterSpacing={0}
    enableHover
    clickEffect={false}
    glitchMode={false}
    glitchInterval={2000}
    glitchDuration={200}
  >{children}</FuzzyText></span><i>.</i></span></span></div>;
}

function App() {
  const compact = useMediaQuery(COMPACT_MOTION);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef(null);
  const heroScrollRef = useRef(null);
  const pageRef = useRef(null);
  usePortfolioMotion(pageRef);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText('2832920184@qq.com');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = 'mailto:2832920184@qq.com';
    }
  }

  return <div className="site-shell" ref={pageRef}>
    {!compact && <CursorFollower />}
    <span className="brand-avatar" aria-hidden="true"><img src={`${M}vicky-nav-avatar.webp`} alt="" width="37" height="37" /></span>
    <header className={`site-header${menuOpen ? ' menu-open' : ''}`}>
      <a className="brand" href="#top" aria-label="张许可，返回首页" onClick={() => setMenuOpen(false)}><span className="brand-symbol" /><span className="brand-name">VICKY XUKE<small>VISUAL PORTFOLIO</small></span></a>
      <nav id="primary-nav" className={menuOpen ? 'nav nav-open' : 'nav'} aria-label="主导航">
        <a href="#about" onClick={() => setMenuOpen(false)}>关于我</a>
        <a href="#work" onClick={() => setMenuOpen(false)}>精选作品</a>
        <a className="mobile-nav-contact" href="#contact" onClick={() => setMenuOpen(false)}>联系我</a>
      </nav>
      <a className="header-contact" href="#contact">LET'S TALK <Arrow diagonal /></a>
      <button className="menu-toggle" type="button" aria-label={menuOpen ? '关闭菜单' : '打开菜单'} aria-controls="primary-nav" aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? '×' : '☰'}</button>
    </header>

    <main>
      <div className="hero-scroll" ref={heroScrollRef}>
      <section className="hero" id="top" ref={heroRef} aria-labelledby="hero-title">
        {!compact && <DotField
          className="hero-dot-field"
          pattern="grid"
          gradientFrom="#6e716f"
          gradientTo="#aaaead"
          dotRadius={1.4}
          dotSpacing={14}
          cursorRadius={190}
          bulgeStrength={0.38}
          glowColor="#686d6b"
          glowRadius={140}
          glowIntensity={0.28}
          baseOpacity={0.38}
          waveAmplitude={0}
          sparkle={false}
          intro={false}
          lightMode
        />}
        <h1 id="hero-title" className="hero-title-art-wrap" aria-label="Vicky's Archive · 张许可的视觉作品集">
          <FuzzyArtwork src={`${M}hero-title.webp`} className="hero-title-art" />
        </h1>
        <UnifiedHeroVideo stageRef={heroRef} scrollRef={heroScrollRef} />
        <FuzzyCopy className="hero-film-copy" lines={['耳机一戴，', '脑洞打开。']} />
        <div className="hero-inner container">
          <div className="hero-bottom">
            <a href="#work" className="round-scroll" aria-label="向下浏览作品">↓</a>
            <span className="hero-coordinate">MOVE YOUR CURSOR <span>✳</span> EXPLORE THE ARCHIVE</span>
          </div>
        </div>
        <span className="hero-side-note">INTERACTIVE ARCHIVE — 01 / 04</span>
      </section>
      </div>

      <IdentityArchive />

      <SpiralGallery projects={projects} />

      <section className="contact" id="contact" aria-labelledby="contact-title"><div className="container contact-inner">
        <SectionLabel index="04 / 04" light>CONTACT · 联系我</SectionLabel>
        <ChapterTitle>THANK YOU</ChapterTitle>
        <h2 id="contact-title" className="reveal">一起做点<span>不一样的。</span></h2>
        <a className="contact-email reveal" href="mailto:2832920184@qq.com">2832920184@qq.com <Arrow diagonal /></a>
        <div className="contact-actions reveal"><button type="button" onClick={copyEmail}>{copied ? '已复制邮箱 ✓' : '复制邮箱地址 ↗'}</button><a href={`${M}Vicky-Zhang-Resume.pdf`} download="Vicky-Zhang-Resume.pdf">下载简历 ↗</a></div>
        <footer className="footer"><span>© 2026 VICKY XUKE</span><span>VISUAL THINKING, ALWAYS IN MOTION.</span><a href="#top">BACK TO TOP ↑</a></footer>
      </div></section>
    </main>

  </div>;
}

const currentPath = window.location.pathname.replace(/\/(?:index\.html)?$/, '');
const routeProject = projects.find(project => currentPath === project.href.slice(0, -1));
createRoot(document.getElementById('root')).render(routeProject ? <ProjectPage project={routeProject} projects={projects} /> : <App />);
