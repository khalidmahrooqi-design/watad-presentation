import { useEffect, useRef, useState } from 'react';
import { bi, companyName, performance, type Locale, type PerformanceMetric } from './content';
const metrics: PerformanceMetric[] = [
  {
    value: String(performance.costSaving),
    unit: '%',
    label: bi('توفير في التكلفة يصل إلى', 'Cost savings up to'),
    context: bi('حسب المواصفات وحجم المشروع.', 'Depending on specifications and project size.'),
  },
  performance.sound,
  performance.wall,
  performance.floor,
];
export default function Metrics({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const saving = performance.timeSaving;
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={root}
      className={`metrics ${visible ? 'metrics-visible' : ''}`}
      data-shortcuts="local"
    >
      <div className="metrics-lead">
        <div>
          <p className="overline">{ar ? 'الوقت والتكلفة والراحة' : 'Time, cost and comfort'}</p>
          <h3>{ar ? 'مدة إنشاء أقل بـ60%.' : '60% less construction time.'}</h3>
          <p>
            {ar
              ? 'من 100 وحدة زمنية في البناء التقليدي إلى 40 وحدة مع وتد. ناقش البرنامج ونطاق العمل مع فريقنا لتقدير مدة مشروعك.'
              : 'From 100 reference time units for conventional construction to 40 with WATAD. Discuss the programme and scope with our team to estimate your project duration.'}
          </p>
        </div>
        <div
          className="time-donut"
          role="img"
          aria-label={
            ar
              ? `مدة وتد ${100 - saving} وحدة مقارنة بـ 100 وحدة تقليدية، وتوفير ${saving}%`
              : `WATAD programme ${100 - saving} units versus 100 conventional units; ${saving}% saved`
          }
        >
          <svg viewBox="0 0 180 180" aria-hidden="true">
            <circle className="donut-track" cx="90" cy="90" r="69" />
            <circle
              className="donut-saved"
              cx="90"
              cy="90"
              r="69"
              pathLength="100"
              strokeDasharray={`${visible ? saving : 0} 100`}
            />
          </svg>
          <div>
            <strong dir="ltr">{saving}%</strong>
            <span>{ar ? 'مدة أقل' : 'less time'}</span>
          </div>
        </div>
      </div>
      <div
        className="programme-chart"
        role="img"
        aria-label={
          ar
            ? `البرنامج التقليدي 100 وحدة، وتد ${100 - saving} وحدة، ${saving} وحدة موفرة`
            : `Conventional programme 100 units. WATAD ${100 - saving} units, ${saving} units saved.`
        }
      >
        <div>
          <span>{ar ? 'البناء التقليدي' : 'Conventional'}</span>
          <div className="programme-bar conventional">
            <span style={{ width: '100%' }} />
            <b>100</b>
          </div>
        </div>
        <div>
          <span>WATAD {ar ? 'وتد' : ''}</span>
          <div className="programme-bar">
            <span style={{ width: `${100 - saving}%` }} />
            <b>{100 - saving}</b>
            <em>
              {saving}% {ar ? 'موفّر' : 'saved'}
            </em>
          </div>
        </div>
      </div>
      <p className="small-note">
        {ar
          ? 'مؤشر المدة: البناء التقليدي = 100؛ وتد = 40.'
          : 'Programme index: conventional = 100; WATAD = 40.'}
      </p>
      <div className="metric-grid">
        {metrics.map((m) => (
          <article key={m.label.en}>
            <h4>{m.label[locale]}</h4>
            <strong dir="ltr">
              {m.value}
              <small>{m.unit}</small>
            </strong>
            {m.comparison && <p className="insulation-comparison">{m.comparison[locale]}</p>}
            <p>{m.context[locale]}</p>
          </article>
        ))}
      </div>
      <p className="metric-source">
        {ar
          ? `مقارنة الوقت والتكلفة من ${companyName.ar}. تعتمد مدة التنفيذ على برنامج المشروع ونطاقه، والتوفير في التكلفة على المواصفات وحجم المشروع.`
          : 'Time and cost comparison by Al Oula. Duration depends on the project programme and scope; cost savings depend on specifications and project size.'}{' '}
        {performance.insulationSource[locale]}{' '}
        <a href="#insulation-reference">
          {ar ? 'أساس مقارنة العزل ومراجعها' : 'Insulation comparison basis and sources'}
        </a>
      </p>
    </div>
  );
}
