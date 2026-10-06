import { useEffect, useRef, useState } from 'react';
import { bi, type Locale } from './content';
const metrics = [
  {
    value: '2–3',
    unit: bi('أشهر', 'months'),
    label: bi('توفير في مدة المشروع', 'Reported programme saving'),
    context: bi('مقارنة مشروع معسكر عمال', 'Labour-camp project comparison'),
  },
  {
    value: '5.1',
    unit: bi('%', '%'),
    label: bi('تكلفة أولية أقل', 'Lower initial cost'),
    context: bi('مع احتساب أثر توفير وقت الإنشاء', 'Including construction-time savings'),
  },
  {
    value: '20',
    unit: bi('%', '%'),
    label: bi('تكلفة أساسات أقل', 'Lower foundation cost'),
    context: bi('مقارنة الدراسة', 'Study comparison'),
  },
  {
    value: '30.6',
    unit: bi('%', '%'),
    label: bi('تكلفة تشغيل أقل', 'Lower operating cost'),
    context: bi('على مدى 20 عاماً في الدراسة', 'Over 20 years in the study'),
  },
  {
    value: '37.5',
    unit: bi('%', '%'),
    label: bi('تكلفة صيانة أقل', 'Lower maintenance cost'),
    context: bi('على مدى 20 عاماً في الدراسة', 'Over 20 years in the study'),
  },
];
export default function Metrics({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const [saving, setSaving] = useState(30);
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
          <p className="overline">
            {ar ? 'مؤشرات من مقارنة منشورة في العرض' : 'Benchmarks reported in the presentation'}
          </p>
          <h3>
            {ar
              ? 'وقت أقل. فرصة أكبر لتخطيط مشروعك.'
              : 'Less time. More room to plan your project.'}
          </h3>
          <p>
            {ar
              ? 'يعرض المصدر انخفاضاً في مدة الإنشاء بنسبة 30–40%. اختر أحد طرفَي النطاق لترى الفرق على أساس موحّد.'
              : 'The source reports 30–40% shorter construction time. Select either end of the range to see the difference on the same basis.'}
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
        className="metric-range"
        role="group"
        aria-label={ar ? 'طرفا نطاق توفير الوقت' : 'Time-saving range endpoints'}
      >
        <span>{ar ? 'نطاق المصدر' : 'Source range'}</span>
        {[30, 40].map((n) => (
          <button
            className="pill small"
            key={n}
            aria-pressed={saving === n}
            onClick={() => setSaving(n)}
          >
            {n}%
          </button>
        ))}
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
          ? 'الأساس = 100 وحدة زمنية مرجعية؛ ليست أياماً فعلية أو معدل تركيب يومياً.'
          : 'Baseline = 100 reference time units; these are not actual days or a daily assembly rate.'}
      </p>
      <div className="metric-grid">
        {metrics.map((m) => (
          <article key={m.label.en}>
            <strong dir="ltr">
              {m.value}
              <small>{m.unit[locale]}</small>
            </strong>
            <h4>{m.label[locale]}</h4>
            <p>{m.context[locale]}</p>
          </article>
        ))}
      </div>
      <p className="metric-source">
        {ar
          ? 'المصدر: عرض «نظام وتد من الأولى»، 8 أبريل 2026، الذي يحيل إلى مقارنة مشروع معسكر عمال، يناير 2025. الدراسة الأصلية غير مرفقة. هذه أرقام مقارنة لنطاق محدد؛ تُراجع نتائج مشروعك حسب التصميم والكميات والفرق والبرنامج.'
          : 'Source: “WATAD System by Al Oula”, 8 April 2026, citing a labour-camp project comparison from January 2025. The underlying study was not supplied. These are scope-specific comparison figures; your project outcomes depend on design, quantities, crews and programme.'}
      </p>
    </div>
  );
}
