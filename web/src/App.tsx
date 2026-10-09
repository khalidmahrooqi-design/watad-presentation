import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  asset,
  BASE,
  SITE,
  sections,
  ui,
  audiences,
  layers,
  elements,
  stages,
  stageBodies,
  cases,
  faqs,
  performance,
  blockReference,
  blockU,
  thermalComparison,
  acousticSource,
  type PerformanceMetric,
  type Locale,
  type CaseRecord,
} from './content';
import { Icon, type IconName } from './icons';
import { Gallery, GalleryBrowser, galleryForCase } from './Gallery';
import Metrics from './Metrics';
import renderData from './element-renders.json';
import { nextIndex, keyboardDelta, shouldIgnoreShortcut } from './navigation.mjs';
const Scene = lazy(() => import('./Scene'));
const thermalMetrics: PerformanceMetric[] = [performance.wall, performance.floor];
export type PageProps = { locale: Locale; caseId?: string };
const elementRenders: Record<string, { width: number; height: number; widths: number[] }> =
  renderData;

function ElementImage({
  id,
  alt,
  thumbnail = false,
}: {
  id: string;
  alt: string;
  thumbnail?: boolean;
}) {
  const render = elementRenders[id];
  return (
    <img
      src={asset(`media/element-${id}-${thumbnail ? 'thumb' : `w${render.width}`}.webp`)}
      srcSet={
        thumbnail
          ? undefined
          : render.widths
              .map((width) => `${asset(`media/element-${id}-w${width}.webp`)} ${width}w`)
              .join(', ')
      }
      sizes={thumbnail ? undefined : '(max-width:1100px) 88vw, 45vw'}
      width={thumbnail ? 160 : render.width}
      height={thumbnail ? Math.round((render.height * 160) / render.width) : render.height}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  );
}

function Photo({
  item,
  hero = false,
  locale,
}: {
  item: CaseRecord;
  hero?: boolean;
  locale: Locale;
}) {
  const widths = [
    ...new Set([
      480,
      960,
      Math.min(1600, item.width),
      Math.min(2400, item.width),
      Math.min(3840, item.width),
    ]),
  ];
  return (
    <img
      src={asset(`media/${item.image}-w${Math.min(1600, item.width)}.webp`)}
      srcSet={widths.map((w) => `${asset(`media/${item.image}-w${w}.webp`)} ${w}w`).join(', ')}
      sizes={
        hero
          ? '(max-width: 760px) 94vw, 58vw'
          : '(max-width: 760px) 94vw, (max-width: 1200px) 45vw, 30vw'
      }
      width={item.width}
      height={item.height}
      alt={`${item.name[locale]} — ${item.country[locale]}`}
      loading={hero ? 'eager' : 'lazy'}
      fetchPriority={hero ? 'high' : 'auto'}
      decoding="async"
    />
  );
}
function Heading({ index, locale }: { index: number; locale: Locale }) {
  const s = sections[index];
  return (
    <div className="section-heading">
      <h2>{s.title[locale]}</h2>
      <p>{s.body[locale]}</p>
    </div>
  );
}
function Concept({ id, locale }: { id: string; locale: Locale }) {
  const width = id === 'partnership' ? 1536 : 1600;
  const height = id === 'partnership' ? 1024 : 900;
  const descriptions: Record<string, { ar: string; en: string }> = {
    applications: {
      ar: 'تصوّر معماري لفيلا ومباني سكنية وضيافة',
      en: 'Architectural concept of villa, residential and hospitality applications',
    },
    partnership: {
      ar: 'تصوّر لمواد الألواح في استوديو هندسي',
      en: 'Concept material study in an engineering studio',
    },
    comfort: {
      ar: 'تصوّر لمساحة سكنية مطلّة على فناء مظلّل',
      en: 'Concept living space opening onto a shaded courtyard',
    },
    evidence: {
      ar: 'تصوّر لمراجعة عينة من مواد الجدار',
      en: 'Concept wall-material sample review',
    },
    comparison: {
      ar: 'تصوّر لتخطيط مشروع مع نموذج معماري وعينات مواد',
      en: 'Project planning concept with architectural model and material samples',
    },
    planning: {
      ar: 'تصوّر لمشروع سكني في بيئة عُمانية',
      en: 'Residential project concept in an Omani setting',
    },
  };
  return (
    <figure className={`section-concept concept-${id}`}>
      <img
        src={asset(`media/concept-${id}-w1600.webp`)}
        srcSet={[480, 960, 1600]
          .map((w) => `${asset(`media/concept-${id}-w${w}.webp`)} ${Math.min(w, width)}w`)
          .join(', ')}
        sizes="(max-width:760px) 92vw, 85vw"
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        alt={descriptions[id][locale]}
      />
      <figcaption>
        {locale === 'ar' ? 'تصوّر معماري — صورة توضيحية' : 'Architectural concept — illustration'}
      </figcaption>
    </figure>
  );
}
function Flag({ country, locale }: { country: 'om' | 'it'; locale: Locale }) {
  return (
    <div className="flag-object">
      <img
        src={asset(`brand/${country}.svg`)}
        width="96"
        height="64"
        alt={
          country === 'om'
            ? locale === 'ar'
              ? 'علم سلطنة عُمان'
              : 'Flag of Oman'
            : locale === 'ar'
              ? 'علم إيطاليا'
              : 'Flag of Italy'
        }
      />
      <span>
        {country === 'om'
          ? locale === 'ar'
            ? 'عُمان'
            : 'Oman'
          : locale === 'ar'
            ? 'إيطاليا'
            : 'Italy'}
      </span>
    </div>
  );
}

function ModelVisual({
  id,
  model,
  poster,
  locale,
  active,
  onActivate,
  onClose,
  amount = 0,
  stage = 5,
  element = 'single',
  paused,
  children,
}: {
  id: string;
  model: 'panel' | 'building' | 'elements';
  poster: string;
  locale: Locale;
  active: string | null;
  onActivate: (id: string) => void;
  onClose: () => void;
  amount?: number;
  stage?: number;
  element?: string;
  paused: boolean;
  children?: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [reset, setReset] = useState(0);
  const shown = active === id;
  useEffect(() => {
    setReady(false);
  }, [shown]);
  return (
    <div className="model-study" data-shortcuts="local">
      <div className="model-frame">
        <img
          className={shown && ready ? 'model-poster is-hidden' : 'model-poster'}
          src={asset(`media/${poster}-w1600.webp`)}
          srcSet={`${asset(`media/${poster}-w960.webp`)} 960w, ${asset(`media/${poster}-w1600.webp`)} 1600w, ${asset(`media/${poster}-w2560.webp`)} 2560w`}
          sizes="(max-width: 760px) 94vw, 55vw"
          width="2560"
          height="1920"
          loading="lazy"
          alt={
            locale === 'ar'
              ? 'تصوّر توضيحي لطبقات النظام وعناصره'
              : 'Illustrative study of the system layers and elements'
          }
        />
        {shown && (
          <Suspense
            fallback={
              <div className="scene-status" role="status">
                {ui.loading[locale]}
              </div>
            }
          >
            <Scene
              key={model}
              model={model}
              locale={locale}
              amount={amount}
              stage={stage}
              element={element}
              paused={paused}
              reset={reset}
              onReady={setReady}
            />
          </Suspense>
        )}
        <div className="model-actions">
          <button
            className="pill small"
            onClick={() => (shown ? onClose() : onActivate(id))}
            aria-pressed={shown}
          >
            <Icon name={shown ? 'close' : 'layers'} />
            {shown ? ui.close[locale] : ui.load3d[locale]}
          </button>
          {shown && (
            <button
              className="icon-button"
              onClick={() => setReset((x) => x + 1)}
              aria-label={ui.reset[locale]}
              title={ui.reset[locale]}
            >
              <Icon name="rotate" />
            </button>
          )}
        </div>
        <span className="model-note">
          {shown && ready ? ui.rotate[locale] : ui.illustration[locale]}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function App({ locale, caseId }: PageProps) {
  const rtl = locale === 'ar';
  const localCase = cases.find((c) => c.id === caseId);
  const [theme, setTheme] = useState('dark');
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [current, setCurrent] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const [help, setHelp] = useState(false);
  const [activeScene, setActiveScene] = useState<string | null>(null);
  const [separation, setSeparation] = useState(0.68);
  const [element, setElement] = useState('single');
  const [stage, setStage] = useState(2);
  const [roof, setRoof] = useState(0.8);
  const moving = useRef(false);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const currentRef = useRef(current);
  const [preferencesReady, setPreferencesReady] = useState(false);
  currentRef.current = current;
  const motion = paused || reduced;
  const languageHref = `${BASE}${rtl ? 'en' : 'ar'}/${localCase ? `cases/${localCase.id}/` : ''}`;
  const announce = useCallback((s: string) => {
    setNotice(s);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 6000);
  }, []);
  useEffect(() => {
    let storedTheme = '';
    let storedMotion = false;
    try {
      storedTheme = localStorage.getItem('watad-theme') || '';
      storedMotion = localStorage.getItem('watad-motion') === 'paused';
    } catch {
      /* Preferences remain usable when storage is unavailable. */
    }
    const initial = storedTheme || document.documentElement.dataset.theme || 'dark';
    setTheme(initial);
    setPaused(storedMotion);
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    setPreferencesReady(true);
    const change = () => setReduced(mq.matches);
    mq.addEventListener('change', change);
    const full = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', full);
    return () => {
      mq.removeEventListener('change', change);
      document.removeEventListener('fullscreenchange', full);
      clearTimeout(navigationTimer.current);
      clearTimeout(noticeTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('watad-theme', theme);
    } catch {
      /* Use an in-memory preference. */
    }
  }, [theme, preferencesReady]);
  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.dataset.motion = motion ? 'paused' : 'active';
    try {
      localStorage.setItem('watad-motion', paused ? 'paused' : 'active');
    } catch {
      /* Use an in-memory preference. */
    }
  }, [motion, paused, preferencesReady]);
  useEffect(() => {
    document.body.classList.toggle('presentation', presentation);
    return () => document.body.classList.remove('presentation');
  }, [presentation]);
  const go = useCallback(
    (index: number) => {
      if (localCase) return;
      const next = nextIndex(index, 0, sections.length);
      const target = document.getElementById(sections[next].id);
      if (!target) return;
      moving.current = true;
      currentRef.current = next;
      setCurrent(next);
      setMenu(false);
      clearTimeout(navigationTimer.current);
      history.replaceState(null, '', `#${sections[next].id}`);
      target.scrollIntoView({ behavior: motion ? 'instant' : 'smooth', block: 'start' });
      navigationTimer.current = setTimeout(
        () => {
          moving.current = false;
        },
        motion ? 30 : 2500,
      );
    },
    [localCase, motion],
  );
  const toggleFull = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else announce(ui.unavailable[locale]);
    } catch {
      announce(ui.unavailable[locale]);
    }
  }, [announce, locale]);
  useEffect(() => {
    if (localCase) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (moving.current) return;
      const line = innerHeight * 0.38;
      let best = 0;
      sections.forEach((s, i) => {
        const e = document.getElementById(s.id);
        if (e && e.getBoundingClientRect().top < line) best = i;
      });
      setCurrent(best);
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const settled = () => {
      moving.current = false;
      clearTimeout(navigationTimer.current);
      update();
    };
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('scrollend', settled);
    window.addEventListener('wheel', settled, { passive: true });
    window.addEventListener('touchstart', settled, { passive: true });
    update();
    const hash = () => {
      const index = sections.findIndex((s) => s.id === location.hash.slice(1));
      if (index >= 0) go(index);
    };
    window.addEventListener('hashchange', hash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('scrollend', settled);
      window.removeEventListener('wheel', settled);
      window.removeEventListener('touchstart', settled);
      window.removeEventListener('hashchange', hash);
    };
  }, [go, localCase]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement;
      if (target.closest('textarea,select,input:not([type="range"]),[contenteditable="true"]'))
        return;
      if (e.key === 'Escape') {
        setMenu(false);
        setHelp(false);
        setPresentation(false);
        return;
      }
      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setHidden((x) => !x);
        return;
      }
      if (e.key.toLowerCase() === 'p' && !localCase) {
        e.preventDefault();
        setPresentation((x) => !x);
        return;
      }
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        void toggleFull();
        return;
      }
      if (shouldIgnoreShortcut(e.target) || e.defaultPrevented) return;
      const delta = keyboardDelta(e.key, rtl);
      if (delta && !localCase) {
        e.preventDefault();
        go(nextIndex(currentRef.current, delta, sections.length));
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [go, localCase, rtl, toggleFull]);
  useEffect(() => {
    if (motion || localCase) return;
    const hero = document.querySelector<HTMLElement>('.hero-visual');
    if (!hero) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--px', `${(e.clientX - r.left - r.width / 2) * 0.018}px`);
        hero.style.setProperty('--py', `${(e.clientY - r.top - r.height / 2) * 0.018}px`);
      });
    };
    const leave = () => {
      hero.style.setProperty('--px', '0px');
      hero.style.setProperty('--py', '0px');
    };
    hero.addEventListener('pointermove', move);
    hero.addEventListener('pointerleave', leave);
    const scroll = () => {
      if (hero.getBoundingClientRect().bottom > 0)
        hero.style.setProperty('--sy', `${Math.min(scrollY * 0.035, 20)}px`);
    };
    window.addEventListener('scroll', scroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      leave();
      hero.style.setProperty('--sy', '0px');
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', leave);
      window.removeEventListener('scroll', scroll);
    };
  }, [motion, localCase]);
  const contactHref = `mailto:info@aloulaidc.om?subject=${encodeURIComponent(locale === 'ar' ? 'استفسار عن مشروع بنظام وتد' : 'WATAD project enquiry')}`;
  const header = (
    <header className="site-header">
      <a
        className="brand"
        href={`${BASE}${locale}/`}
        aria-label={locale === 'ar' ? 'وتد، الصفحة الرئيسية' : 'WATAD home'}
      >
        <img src={asset('brand/watad.svg')} width="100" height="56" alt="WATAD وتد" />
        <span>
          {locale === 'ar' ? 'نظام بناء. تفاصيل متكاملة.' : 'A building system. Connected details.'}
        </span>
      </a>
      <nav className="header-links" aria-label={locale === 'ar' ? 'روابط رئيسية' : 'Main links'}>
        <a href={`${BASE}${locale}/#system-layers`}>{sections[3].short[locale]}</a>
        <a href={`${BASE}${locale}/#oman-cases`}>
          {locale === 'ar' ? 'التطبيقات' : 'Applications'}
        </a>
        <a href={`${BASE}${locale}/#contact-card`}>{sections[14].short[locale]}</a>
      </nav>
      <div className="header-controls">
        <a
          className="language-button"
          href={languageHref}
          hrefLang={rtl ? 'en' : 'ar'}
          onClick={(e) => {
            if (!localCase) {
              (e.currentTarget as HTMLAnchorElement).href = languageHref + location.hash;
            }
          }}
        >
          {ui.language[locale]}
        </a>
        <button
          className="icon-button"
          onClick={() => setTheme((x) => (x === 'dark' ? 'light' : 'dark'))}
          aria-label={ui.theme[locale]}
          title={ui.theme[locale]}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <button
          className="icon-button"
          onClick={() => setPaused((x) => !x)}
          aria-pressed={paused}
          aria-label={paused ? ui.resume[locale] : ui.pause[locale]}
          title={paused ? ui.resume[locale] : ui.pause[locale]}
        >
          <Icon name={paused ? 'play' : 'pause'} />
        </button>
        {!localCase && (
          <button
            className="icon-button menu-button"
            onClick={() => setMenu((x) => !x)}
            aria-expanded={menu}
            aria-controls="section-menu"
            aria-label={ui.menu[locale]}
          >
            <Icon name={menu ? 'close' : 'menu'} />
          </button>
        )}
      </div>
    </header>
  );
  const card = (
    <div className="business-card">
      <div className="business-brand">
        <img src={asset('brand/al-oula.svg')} width="178" height="79" alt="Al Oula الأولى" />
        <img src={asset('brand/watad.svg')} width="91" height="51" alt="WATAD وتد" />
      </div>
      <div className="business-content">
        <div>
          <h2>{sections[14].title[locale]}</h2>
          <p>{sections[14].body[locale]}</p>
          <p>{locale === 'ar' ? 'عُمان' : 'Oman'}</p>
          <a className="pill primary" href={contactHref}>
            <Icon name="mail" />
            {ui.mail[locale]}
          </a>
          <a className="contact-email" href="mailto:info@aloulaidc.om" dir="ltr">
            info@aloulaidc.om
          </a>
          <a
            className="text-link"
            href="https://www.aloulaidc.om/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="link" />
            {ui.website[locale]}
          </a>
        </div>
        <a className="qr-block" href={SITE} aria-label={ui.qr[locale]}>
          <img src={asset('brand/qr.svg')} width="180" height="180" alt={ui.qr[locale]} />
          <span>{ui.qr[locale]}</span>
        </a>
      </div>
    </div>
  );
  if (localCase)
    return (
      <>
        <a className="skip-link" href="#main">
          {ui.skip[locale]}
        </a>
        {header}
        <main id="main" className="case-page">
          <a
            className="text-link"
            href={`${BASE}${locale}/#${localCase.region === 'oman' ? 'oman-cases' : 'international-cases'}`}
          >
            <Icon name="previous" className="flow-arrow" />
            {ui.back[locale]}
          </a>
          <p className="overline">
            {localCase.country[locale]} · {localCase.use[locale]}
          </p>
          <h1>{localCase.name[locale]}</h1>
          <Gallery collection={galleryForCase(localCase.id)} locale={locale} />
          <p className="small-note">{localCase.caption[locale]}</p>
          <div className="case-context">
            <span>{localCase.region === 'oman' ? ui.local[locale] : ui.international[locale]}</span>
            <a className="pill primary" href={contactHref}>
              {ui.contact[locale]}
              <Icon name="mail" />
            </a>
          </div>
        </main>
        <div className="toast" role="status">
          {notice}
        </div>
      </>
    );
  return (
    <>
      <a className="skip-link" href="#main">
        {ui.skip[locale]}
      </a>
      {header}
      {menu && (
        <nav id="section-menu" className="section-menu" aria-label={ui.menu[locale]}>
          {sections.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                go(i);
              }}
              aria-current={current === i ? 'location' : undefined}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              {s.short[locale]}
            </a>
          ))}
        </nav>
      )}
      <main id="main">
        <section id="hero" className="section hero" data-accent="mint">
          <div className="hero-copy">
            <div className="partnership-small">
              <Flag country="om" locale={locale} />
              <span className="partnership-line" />
              <Flag country="it" locale={locale} />
            </div>
            <h1>{sections[0].title[locale]}</h1>
            <p>{sections[0].body[locale]}</p>
            <div className="hero-cta">
              <a
                className="pill primary"
                href="#system-layers"
                onClick={(e) => {
                  e.preventDefault();
                  go(3);
                }}
              >
                {ui.explore[locale]}
                <Icon name="arrow" className="flow-arrow" />
              </a>
              <a className="text-link" href="#contact-card">
                {ui.contact[locale]}
              </a>
            </div>
            <div className="material-signature">
              <span>EPS</span>
              <span>{locale === 'ar' ? 'فولاذ' : 'Steel'}</span>
              <span>{locale === 'ar' ? 'خرسانة' : 'Concrete'}</span>
            </div>
          </div>
          <figure className="hero-visual">
            <div className="hero-photo">
              <Photo item={cases[0]} hero locale={locale} />
            </div>
            <div className="hero-caption">
              <Icon name="home" />
              <span>{locale === 'ar' ? 'تطبيقات وتد في عُمان' : 'WATAD applications in Oman'}</span>
            </div>
            <div className="hero-material">
              <Icon name="layers" />
              <span>
                {locale === 'ar'
                  ? 'من اللوح إلى المساحة التي تعيشها'
                  : 'From a panel to the space you live in'}
              </span>
            </div>
          </figure>
        </section>
        <section id="applications" className="section" data-accent="mint">
          <Heading index={1} locale={locale} />
          <Concept id="applications" locale={locale} />
          <div className="audience-grid">
            {audiences.map((a) => (
              <a
                key={a.target}
                className="audience-card"
                href={`#${a.target}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(sections.findIndex((section) => section.id === a.target));
                }}
              >
                <Icon name={a.icon as IconName} />
                <h3>{a.title[locale]}</h3>
                <p>{a.body[locale]}</p>
                <Icon name="arrow" className="flow-arrow" />
              </a>
            ))}
          </div>
        </section>
        <section id="partnership" className="section partnership" data-accent="azure">
          <Heading index={2} locale={locale} />
          <Concept id="partnership" locale={locale} />
          <div className="partnership-stage">
            <div className="partner-end">
              <Flag country="it" locale={locale} />
              <h3>Emmedue</h3>
              <p>{locale === 'ar' ? 'تقنية الألواح' : 'Panel technology'}</p>
              <a
                className="text-link"
                href="https://www.mdue.it/en/"
                target="_blank"
                rel="noopener noreferrer"
              >
                mdue.it <Icon name="link" />
              </a>
            </div>
            <div className="partnership-bridge">
              <Icon name="layers" />
              <span>WATAD</span>
            </div>
            <div className="partner-end">
              <Flag country="om" locale={locale} />
              <img
                className="partner-logo"
                src={asset('brand/al-oula.svg')}
                width="178"
                height="79"
                alt="Al Oula الأولى"
              />
              <p>
                {locale === 'ar' ? 'التصنيع والتوريد في عُمان' : 'Manufacturing & supply in Oman'}
              </p>
              <a className="text-link" href={contactHref}>
                {ui.contact[locale]}
                <Icon name="mail" />
              </a>
            </div>
          </div>
        </section>
        <section id="system-layers" className="section technical" data-accent="azure">
          <Heading index={3} locale={locale} />
          <div className="study-layout">
            <ModelVisual
              id="layers"
              model="panel"
              poster="panel"
              locale={locale}
              active={activeScene}
              onActivate={setActiveScene}
              onClose={() => setActiveScene(null)}
              amount={separation}
              paused={motion}
            >
              <label className="range-control">
                <span>{ui.explode[locale]}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(separation * 100)}
                  onChange={(e) => setSeparation(Number(e.target.value) / 100)}
                  aria-label={ui.explode[locale]}
                />
                <output>{Math.round(separation * 100)}%</output>
              </label>
            </ModelVisual>
            <ol className="layer-list">
              {layers.map((l, i) => (
                <li key={l.title.en}>
                  <span className="layer-index">{i + 1}</span>
                  <div>
                    <h3>{l.title[locale]}</h3>
                    <p>{l.body[locale]}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section id="elements" className="section" data-accent="violet">
          <Heading index={4} locale={locale} />
          <div className="study-layout elements-layout">
            <figure className="element-render" data-element={element}>
              <div className="element-render-stage">
                <ElementImage
                  key={element}
                  id={element}
                  alt={elements.find((el) => el.id === element)!.title[locale]}
                />
              </div>
              <figcaption aria-live="polite" aria-atomic="true">
                <h3>{elements.find((el) => el.id === element)!.title[locale]}</h3>
                <p>{locale === 'ar' ? 'تفاصيل العنصر وطبقاته' : 'Element and layer details'}</p>
              </figcaption>
            </figure>
            <div className="element-selector" role="group" aria-label={sections[4].title[locale]}>
              {elements.map((el) => (
                <button
                  key={el.id}
                  data-element={el.id}
                  aria-pressed={element === el.id}
                  onClick={() => setElement(el.id)}
                >
                  <ElementImage id={el.id} alt="" thumbnail />
                  <div>
                    <span>{el.title[locale]}</span>
                    <p>{el.body[locale]}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
        <section id="construction-process" className="section technical" data-accent="mint">
          <Heading index={5} locale={locale} />
          <div className="process-layout">
            <ModelVisual
              id="process"
              model="building"
              poster="process"
              locale={locale}
              active={activeScene}
              onActivate={setActiveScene}
              onClose={() => setActiveScene(null)}
              stage={stage}
              amount={stage === 5 ? 0.8 : 0}
              paused={motion}
            />
            <div className="process-navigation">
              <div className="stage-buttons" role="group" aria-label={ui.stage[locale]}>
                {stages.map((s, i) => (
                  <button key={s.en} onClick={() => setStage(i)} aria-pressed={stage === i}>
                    <span>{i + 1}</span>
                    {s[locale]}
                  </button>
                ))}
              </div>
              <h3>{stages[stage][locale]}</h3>
              <p>{stageBodies[stage][locale]}</p>
              <p className="small-note">{ui.illustration[locale]}</p>
            </div>
          </div>
        </section>
        <section id="comfort" className="section comfort" data-accent="azure">
          <Heading index={6} locale={locale} />
          <Concept id="comfort" locale={locale} />
          <div className="comfort-grid">
            <article>
              <Icon name="heat" />
              <h3>
                {locale === 'ar' ? 'عزل حراري يناسب تصميمك' : 'Thermal insulation for your design'}
              </h3>
              {thermalMetrics.map((metric) => (
                <div className="comfort-metric" key={metric.value}>
                  <h4>{metric.label[locale]}</h4>
                  <strong dir="ltr">
                    U = {metric.value} <small>{metric.unit}</small>
                  </strong>
                  {metric.comparison && (
                    <p className="insulation-comparison">{metric.comparison[locale]}</p>
                  )}
                  <p>{metric.context[locale]}</p>
                </div>
              ))}
              <p className="small-note">
                {locale === 'ar'
                  ? 'للجدار المفرد PSM140: معامل U محسوب قدره 0.240 W/m²K، بسماكة نهائية 21 سم وكثافة EPS قدرها 25 كغ/م³.'
                  : 'For the PSM140 single wall: calculated U = 0.240 W/m²K, with 21 cm finished thickness and EPS density of 25 kg/m³.'}{' '}
                {thermalComparison(0.24)[locale]}
              </p>
              <div className="heat-diagram" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            </article>
            <article>
              <Icon name="volume" />
              <h3>{locale === 'ar' ? 'راحة تسمع الفرق فيها' : 'Comfort you can hear'}</h3>
              <div className="comfort-metric">
                <h4>{performance.sound.label[locale]}</h4>
                <strong dir="ltr">
                  {performance.sound.value} <small>{performance.sound.unit}</small>
                </strong>
                <p>{performance.sound.context[locale]}</p>
              </div>
              <p>
                {locale === 'ar'
                  ? 'الأداء الصوتي مرتبط بتركيب الجدار والوصلات والفتحات. اطلب تقريراً يطابق التركيب المستخدم في مشروعك.'
                  : 'Acoustic performance depends on the wall assembly, joints and openings. Request a report matching your project assembly.'}
              </p>
              <div className="sound-diagram" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </article>
            <article>
              <Icon name="home" />
              <h3>{locale === 'ar' ? 'فكّر في المبنى بالكامل' : 'Consider the whole building'}</h3>
              <p>
                {locale === 'ar'
                  ? 'السقف والنوافذ والتظليل والتكييف والتنفيذ الجيد تكمل الاختيار. ناقشها ضمن تصميم متكامل.'
                  : 'Roof, windows, shading, air conditioning and workmanship complete the choice. Discuss them as one coordinated design.'}
              </p>
            </article>
          </div>
          <p className="metric-source">{performance.insulationSource[locale]}</p>
          <details id="insulation-reference" className="insulation-reference">
            <summary>
              {locale === 'ar'
                ? 'المواصفات ومراجع الأداء'
                : 'Specifications and performance references'}
            </summary>
            <p>
              {locale === 'ar'
                ? 'المرجع الدولي للمقارنة: بلوك خرساني مفرغ 200 مم + لياسة أسمنتية 10 مم على كل وجه = 220 مم نهائياً. حُسب أداء الجدار غير المعزول باستخدام خصائص الطبقات المنشورة لدى هيئة الكهرباء والماء في البحرين.'
                : 'International comparison reference: 200 mm hollow concrete block + 10 mm cement plaster on each face = 220 mm finished. The uninsulated wall performance is calculated from layer properties published by Bahrain’s Electricity and Water Authority.'}
            </p>
            <p dir="ltr" className="reference-formula">
              R = 0.059 + 0.226 + 0.121 + (2 × 0.010 ÷ 0.75) ={' '}
              {blockReference.resistance.toFixed(4)} m²K/W
              <br />U = 1 ÷ R ≈ {blockU.toFixed(2)} W/m²K
            </p>
            <p>
              {locale === 'ar'
                ? 'نسبة الخفض = (1 − معامل U لوتد ÷ معامل U المرجعي) × 100. مقارنة حسابية إرشادية لتركيبات الجدران المذكورة عند تساوي المساحة وفرق الحرارة، وليست اختباراً مقارناً متطابق الشروط. النسبة تخص انتقال الحرارة عبر الجدار فقط؛ ولا تمثل وفراً في فاتورة التكييف أو انخفاضاً في درجة حرارة الغرفة.'
                : 'Reduction = (1 − WATAD U ÷ reference U) × 100. An indicative calculation for the stated wall assemblies at equal area and temperature difference, rather than a matched laboratory comparison. The percentage applies to wall heat transfer only, not cooling bills or room-temperature reduction.'}
            </p>
            <p>
              {locale === 'ar'
                ? 'الأداء الصوتي: خفض إجمالي مقاس قدره 45 dB(A) لعينة PSM90 بسماكة نهائية 180 مم. يختلف الأداء المنفذ بحسب تركيب الجدار والوصلات والفتحات.'
                : 'Acoustic performance: 45 dB(A) measured gross reduction for the 180 mm finished PSM90 specimen. Installed performance depends on the wall assembly, joints and openings.'}
            </p>
            <div className="reference-links">
              <a href={blockReference.source} target="_blank" rel="noreferrer">
                {locale === 'ar'
                  ? 'مرجع الخصائص الحرارية — البحرين (PDF)'
                  : 'Thermal property reference — Bahrain (PDF)'}
              </a>
              <a href={acousticSource} target="_blank" rel="noreferrer">
                {locale === 'ar'
                  ? 'تقرير اختبار الصوت — Emmedue / IDIEM (PDF)'
                  : 'Acoustic test report — Emmedue / IDIEM (PDF)'}
              </a>
            </div>
          </details>
        </section>
        <section id="design-flexibility" className="section design" data-accent="violet">
          <div className="design-copy">
            <Heading index={7} locale={locale} />
            <div className="design-tags">
              <span>{locale === 'ar' ? 'منحنيات' : 'Curves'}</span>
              <span>{locale === 'ar' ? 'قباب' : 'Domes'}</span>
              <span>{locale === 'ar' ? 'فتحات' : 'Openings'}</span>
              <span>{locale === 'ar' ? 'سلالم' : 'Stairs'}</span>
            </div>
            <a
              className="pill"
              href="#international-cases"
              onClick={(e) => {
                e.preventDefault();
                go(11);
              }}
            >
              {ui.viewCase[locale]}
              <Icon name="arrow" className="flow-arrow" />
            </a>
          </div>
          <figure className="architectural-image">
            <Photo item={cases[2]} locale={locale} />
            <figcaption>
              {cases[2].country[locale]} · {ui.international[locale]}
            </figcaption>
          </figure>
        </section>
        <section id="performance-evidence" className="section" data-accent="amber">
          <Heading index={8} locale={locale} />
          <Concept id="evidence" locale={locale} />
          <div className="evidence-grid">
            {[
              biText(
                'الأداء الإنشائي',
                'Structural performance',
                'الأحمال والتفاصيل ودور العنصر في المبنى.',
                'Loads, details and the element’s role in the building.',
              ),
              biText(
                'اختبارات التركيب',
                'Assembly testing',
                'المعيار والسماكات والمواد وشروط الاختبار.',
                'Standard, thicknesses, materials and test conditions.',
              ),
              biText(
                'ملاءمة المشروع',
                'Project suitability',
                'مراجعة الاستشاري والمتطلبات والموافقات المحلية.',
                'Consultant review, requirements and local approvals.',
              ),
            ].map((e, i) => (
              <article key={e.title.en}>
                <Icon name={i === 0 ? 'building' : i === 1 ? 'layers' : 'check'} />
                <h3>{e.title[locale]}</h3>
                <p>{e.body[locale]}</p>
              </article>
            ))}
          </div>
          <a className="pill" href={contactHref}>
            <Icon name="mail" />
            {ui.technical[locale]}
          </a>
        </section>
        <section id="project-comparison" className="section comparison" data-accent="amber">
          <Heading index={9} locale={locale} />
          <Concept id="comparison" locale={locale} />
          <Metrics locale={locale} />
          <div className="comparison-table" role="table" aria-label={sections[9].title[locale]}>
            <div role="row" className="table-header">
              <span role="columnheader">{locale === 'ar' ? 'قارن' : 'Compare'}</span>
              <span role="columnheader">
                {locale === 'ar' ? 'ما الذي يشمله؟' : 'What should it include?'}
              </span>
            </div>
            {[
              biText(
                'المواد',
                'Materials',
                'الألواح، التسليح، الخرسانة، النقل والتخزين.',
                'Panels, reinforcement, concrete, transport and storage.',
              ),
              biText(
                'العمل بالموقع',
                'Site work',
                'التركيب والدعم والخدمات والتشطيب والفحوصات.',
                'Assembly, support, services, finishes and inspections.',
              ),
              biText(
                'البرنامج',
                'Programme',
                'التوريد وتنسيق الفرق والمعالجة والتسليم.',
                'Supply, crew coordination, curing and handover.',
              ),
              biText(
                'التشغيل',
                'Operation',
                'تصميم الغلاف والتكييف والصيانة واستخدام المبنى.',
                'Envelope design, air conditioning, maintenance and building use.',
              ),
            ].map((e) => (
              <div role="row" key={e.title.en}>
                <strong role="cell">{e.title[locale]}</strong>
                <span role="cell">{e.body[locale]}</span>
              </div>
            ))}
          </div>
          <a className="text-link" href={contactHref}>
            {locale === 'ar'
              ? 'اطلب مقارنة لنطاق مشروعك'
              : 'Request a comparison for your project scope'}
            <Icon name="arrow" className="flow-arrow" />
          </a>
        </section>
        <section id="oman-cases" className="section" data-accent="mint">
          <Heading index={10} locale={locale} />
          <GalleryBrowser locale={locale} region="oman" />
        </section>
        <section id="international-cases" className="section global" data-accent="violet">
          <Heading index={11} locale={locale} />
          <img
            className="reference-map"
            src={asset('brand/reference-map.svg')}
            width="960"
            height="360"
            loading="lazy"
            alt={
              locale === 'ar'
                ? 'خريطة تقريبية للدول الثماني عشرة الممثلة في مكتبة الصور'
                : 'Approximate map of the eighteen countries represented in the photo library'
            }
          />
          <GalleryBrowser locale={locale} region="international" />
          <p className="reference-note">{ui.international[locale]} · Emmedue</p>
        </section>
        <section id="sustainability" className="section sustainability" data-accent="mint">
          <div className="sustain-copy">
            <Heading index={12} locale={locale} />
            <ul className="resource-list">
              {[
                biText(
                  'العزل في مرحلة التصميم',
                  'Insulation at design stage',
                  'اربط اختيار الغلاف بحسابات المبنى وظروف استخدامه.',
                  'Connect envelope choices to building calculations and use conditions.',
                ),
                biText(
                  'تنسيق المواد والموقع',
                  'Material & site coordination',
                  'راجع الكميات والتقطيع والتخزين ومسارات العمل.',
                  'Review quantities, cutting, storage and work routes.',
                ),
                biText(
                  'قياس النتيجة',
                  'Measure the outcome',
                  'التقييم أو الشهادة يخصّ المبنى ومراجعته، ولا ينتج تلقائياً عن مادة واحدة.',
                  'Assessment or certification relates to the building and its review; it does not follow automatically from one material.',
                ),
              ].map((r) => (
                <li key={r.title.en}>
                  <Icon name="leaf" />
                  <div>
                    <h3>{r.title[locale]}</h3>
                    <p>{r.body[locale]}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <ModelVisual
            id="layout"
            model="building"
            poster="building"
            locale={locale}
            active={activeScene}
            onActivate={setActiveScene}
            onClose={() => setActiveScene(null)}
            amount={roof}
            paused={motion}
          >
            <label className="range-control">
              <span>{ui.roof[locale]}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(roof * 100)}
                onChange={(e) => setRoof(Number(e.target.value) / 100)}
                aria-label={ui.roof[locale]}
              />
              <output>{Math.round(roof * 100)}%</output>
            </label>
          </ModelVisual>
        </section>
        <section id="start-your-project" className="section start" data-accent="azure">
          <Heading index={13} locale={locale} />
          <Concept id="planning" locale={locale} />
          <div className="brief-steps">
            {[
              biText(
                'حدّد المشروع',
                'Define the project',
                'الموقع والاستخدام ونطاق العمل.',
                'Location, use and required scope.',
              ),
              biText(
                'جهّز المتاح',
                'Gather what you have',
                'المخططات والتفاصيل والبرنامج.',
                'Drawings, details and programme.',
              ),
              biText(
                'افتح النقاش',
                'Start the discussion',
                'أرسل الملخص إلى فريق الأولى.',
                'Email your brief to Al Oula.',
              ),
            ].map((b, i) => (
              <div key={b.title.en}>
                <span>{i + 1}</span>
                <h3>{b.title[locale]}</h3>
                <p>{b.body[locale]}</p>
              </div>
            ))}
          </div>
          <div className="faq-list">
            {faqs.map((f) => (
              <details key={f.q.en}>
                <summary>
                  {f.q[locale]}
                  <Icon name="plus" />
                </summary>
                <p>{f.a[locale]}</p>
              </details>
            ))}
          </div>
          <a className="pill primary" href={contactHref}>
            <Icon name="mail" />
            {ui.contact[locale]}
          </a>
        </section>
        <section id="contact-card" className="section final-section" data-accent="amber">
          {card}
        </section>
      </main>
      {!hidden ? (
        <nav
          className="presentation-dock"
          aria-label={locale === 'ar' ? 'التحكم بالعرض' : 'Presentation controls'}
        >
          <button
            className="icon-button"
            onClick={() => go(current - 1)}
            disabled={current === 0}
            aria-label={ui.previous[locale]}
            title={ui.previous[locale]}
          >
            <Icon name={rtl ? 'next' : 'previous'} />
          </button>
          <div className="dock-progress">
            <span>{sections[current].short[locale]}</span>
            <div
              className="progress-track"
              role="progressbar"
              aria-label={ui.section[locale]}
              aria-valuemin={1}
              aria-valuemax={sections.length}
              aria-valuenow={current + 1}
            >
              <div style={{ width: `${((current + 1) / sections.length) * 100}%` }} />
            </div>
            <small dir="ltr">{String(current + 1).padStart(2, '0')} / 15</small>
          </div>
          <button
            className="icon-button"
            onClick={() => go(current + 1)}
            disabled={current === sections.length - 1}
            aria-label={ui.next[locale]}
            title={ui.next[locale]}
          >
            <Icon name={rtl ? 'previous' : 'next'} />
          </button>
          <div className="dock-divider" />
          <button
            className="icon-button"
            onClick={() => void toggleFull()}
            aria-pressed={fullscreen}
            aria-label={fullscreen ? ui.exitFull[locale] : ui.full[locale]}
            title={fullscreen ? ui.exitFull[locale] : ui.full[locale]}
          >
            <Icon name={fullscreen ? 'collapse' : 'fullscreen'} />
          </button>
          <button
            className="icon-button"
            onClick={() => {
              setPresentation((x) => !x);
              go(current);
            }}
            aria-pressed={presentation}
            aria-label={presentation ? ui.exitPresent[locale] : ui.present[locale]}
            title={presentation ? ui.exitPresent[locale] : ui.present[locale]}
          >
            <Icon name="present" />
          </button>
          <button
            className="icon-button"
            onClick={() => setHidden(true)}
            aria-label={ui.hide[locale]}
            title={ui.hide[locale]}
          >
            <Icon name="hide" />
          </button>
          <button
            className="shortcut-button"
            onClick={() => setHelp((x) => !x)}
            aria-expanded={help}
            aria-label={ui.guide[locale]}
          >
            <Icon name="help" />
          </button>
        </nav>
      ) : (
        <button
          className="restore-dock icon-button"
          onClick={() => setHidden(false)}
          aria-label={ui.show[locale]}
          title={ui.show[locale]}
        >
          <Icon name="show" />
        </button>
      )}
      {help && !hidden && (
        <div className="shortcut-help" role="status">
          {ui.guideText[locale]}
        </div>
      )}
      <div className={`toast ${notice ? 'visible' : ''}`} role="status">
        {notice}
      </div>
    </>
  );
}
function biText(arTitle: string, enTitle: string, arBody: string, enBody: string) {
  return { title: { ar: arTitle, en: enTitle }, body: { ar: arBody, en: enBody } };
}
