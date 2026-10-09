export type Locale = 'ar' | 'en';
export const BASE = '/watad-presentation/';
export const ORIGIN = 'https://khalidmahrooqi-design.github.io';
export const SITE = ORIGIN + BASE;
export const asset = (path: string) => BASE + path;
export const bi = (ar: string, en: string) => ({ ar, en });
export const performance = {
  timeSaving: 60,
  costSaving: 25,
  sound: {
    value: '45',
    unit: 'dB',
    label: bi('مؤشر العزل الصوتي', 'Sound insulation index'),
    context: bi(
      'لوح الجدار المفرد PSM90؛ اختبار مذكور في المواصفات بجامعة سانتياغو في تشيلي.',
      'PSM90 single wall panel; test reported in the specifications at the University of Santiago, Chile.',
    ),
  },
  wall: {
    value: '0.169',
    unit: 'W/m²K',
    label: bi('انتقال حراري للجدران يصل إلى', 'Wall U-value as low as'),
    context: bi(
      'PST200 للقواطع والواجهات غير الحاملة؛ سماكة نهائية 25 سم، وقلب EPS بسماكة 20 سم وكثافة 25 كغ/م³. قيمة محسوبة.',
      'PST200 partition / curtain wall; 25 cm finished thickness, 20 cm EPS at 25 kg/m³. Calculated value.',
    ),
  },
  floor: {
    value: '0.159',
    unit: 'W/m²K',
    label: bi('انتقال حراري للأرضيات يصل إلى', 'Floor U-value as low as'),
    context: bi(
      'PSSG240؛ ارتفاع بلوك EPS بمقدار 24 سم وكثافة 15 كغ/م³، مع طبقة EPS سفلية 4 سم وخرسانة 4 سم ولياسة 2 سم. قيمة محسوبة.',
      'PSSG240; 24 cm EPS pot height at 15 kg/m³, with a 4 cm EPS base plate, 4 cm concrete and 2 cm plaster. Calculated value.',
    ),
  },
  insulationSource: bi(
    'المصدر: مواصفات ألواح Emmedue، الإصدار 05، 01/14، الصفحات المطبوعة 8 و9 و13. القيم تخص التركيبات المذكورة؛ انخفاض معامل U يعني انتقالاً أقل للحرارة. تختلف نتيجة المبنى باختلاف الوصلات والفتحات والتنفيذ.',
    'Source: Emmedue Panel Specifications, Rev. 05, 01/14, printed pages 8, 9 and 13. Values apply to the stated assemblies; a lower U-value means less heat transfer. Whole-building results depend on joints, openings and installation.',
  ),
};
export const sections = [
  {
    id: 'hero',
    title: bi('ابنِ لراحة تدوم', 'Build for lasting comfort'),
    short: bi('البداية', 'Welcome'),
    body: bi(
      'تقنية إيطالية، وتصنيع في عُمان. اكتشف نظام وتد: قلب عازل، وشبك فولاذي، وطبقات خرسانية تتكامل مع تصميم مشروعك.',
      'Italian technology. Manufacturing in Oman. Discover WATAD: an insulating core, steel mesh and concrete layers that work with your project design.',
    ),
  },
  {
    id: 'applications',
    title: bi('ما الذي تريد بناءه؟', 'What do you want to build?'),
    short: bi('مشروعك', 'Your project'),
    body: bi(
      'ابدأ بما يهمّك. سنوصلك إلى تفاصيل النظام والتطبيقات والأسئلة التي تساعدك على اتخاذ القرار.',
      'Start with what matters to you. Explore the details, applications and questions that help you make a sound decision.',
    ),
  },
  {
    id: 'partnership',
    title: bi('خبرة إيطالية. تصنيع في عُمان.', 'Italian expertise. Manufacturing in Oman.'),
    short: bi('الشراكة', 'Partnership'),
    body: bi(
      'يقدّم وتد نظام الألواح بتقنية Emmedue الإيطالية، من خلال الأولى للتنمية والاستثمار في عُمان. تواصل مع الفريق لمناقشة التوريد ومتطلبات مشروعك.',
      'WATAD brings the Italian Emmedue panel technology to Oman through Al Oula Development & Investment. Discuss supply and your project requirements with the team.',
    ),
  },
  {
    id: 'system-layers',
    title: bi('قوة النظام تبدأ من طبقاته', 'Performance begins with the layers'),
    short: bi('الطبقات', 'Layers'),
    body: bi(
      'لوح خفيف أثناء التجهيز. جدار مركّب بعد التنفيذ. استكشف كيف يعمل العزل والشبك والروابط والخرسانة معاً.',
      'A lightweight panel during preparation. A composite wall after installation. Explore how the insulation, mesh, connectors and concrete work together.',
    ),
  },
  {
    id: 'elements',
    title: bi('عناصر تتكامل مع تصميمك', 'Elements that work with your design'),
    short: bi('العناصر', 'Elements'),
    body: bi(
      'الجدران والأرضيات والسلالم ضمن عائلة واحدة. يحدّد التصميم الإنشائي العنصر المناسب وتفاصيل التسليح والربط.',
      'Walls, floors and stairs in one system family. Structural design determines the right element, reinforcement and connection details.',
    ),
  },
  {
    id: 'construction-process',
    title: bi('شاهد الفكرة تتحول إلى مبنى', 'See the system become a building'),
    short: bi('التنفيذ', 'Construction'),
    body: bi(
      'تتبّع المراحل في نموذج توضيحي، من التخطيط إلى التشطيب. مخططات المشروع وخطة التنفيذ المعتمدة تحدّدان التسلسل الفعلي.',
      'Follow the stages in an illustrative model, from planning to finishing. Project drawings and the approved method statement determine the actual sequence.',
    ),
  },
  {
    id: 'comfort',
    title: bi('الراحة تُبنى داخل الجدار', 'Comfort is built into the wall'),
    short: bi('الراحة', 'Comfort'),
    body: bi(
      'اختيار الجدار جزء من منظومة الراحة. العزل والتفاصيل والنوافذ والسقف والتكييف تعمل معاً لتشكيل بيئة المبنى.',
      'The wall is part of a complete comfort strategy. Insulation, detailing, windows, the roof and air conditioning work together to shape the indoor environment.',
    ),
  },
  {
    id: 'design-flexibility',
    title: bi('أعطِ فكرتك مساحة للشكل', 'Give your design room to take shape'),
    short: bi('التصميم', 'Design'),
    body: bi(
      'من الخطوط المستقيمة إلى المنحنيات والقباب. ناقش إمكانات التصميم مبكراً لربط فكرتك بالتفاصيل القابلة للتنفيذ.',
      'From straight lines to curves and domes. Discuss design possibilities early so your architectural idea connects with buildable details.',
    ),
  },
  {
    id: 'performance-evidence',
    title: bi('اسأل عن الأداء. واطّلع على الدليل.', 'Ask about performance. See the evidence.'),
    short: bi('الأداء', 'Evidence'),
    body: bi(
      'قرارك يحتاج إلى دليل يخصّ التركيب المستخدم. اطلب التقارير الفنية وشروط الاختبار، وناقش ملاءمتها مع استشاري المشروع.',
      'Your decision needs evidence for the assembly being used. Request technical reports and test conditions, then discuss their relevance with your project consultant.',
    ),
  },
  {
    id: 'project-comparison',
    title: bi('قارن مشروعك على أساس واضح', 'Compare your project on clear terms'),
    short: bi('المقارنة', 'Comparison'),
    body: bi(
      'التكلفة لا تنتهي عند سعر اللوح. قارن نطاق العمل والعمالة والبرنامج والتشطيبات على أساس واحد، ثم قيّم الاختيار مع فريقك.',
      'Cost goes beyond the panel price. Compare scope, labour, programme and finishes on the same basis, then assess the choice with your team.',
    ),
  },
  {
    id: 'oman-cases',
    title: bi('شاهد التطبيق في عُمان', 'See the system in Oman'),
    short: bi('عُمان', 'Oman'),
    body: bi(
      'من تجهيز الموقع إلى المساحات المكتملة. صور من مكتبة التطبيقات العُمانية توضح مراحل مختلفة من استخدام النظام.',
      'From site preparation to completed spaces. Images from the Oman application library show different stages of the system in use.',
    ),
  },
  {
    id: 'international-cases',
    title: bi('استخدامات تتجاوز الحدود', 'Applications across borders'),
    short: bi('حول العالم', 'Worldwide'),
    body: bi(
      'استكشف مراجع دولية من مكتبة النظام: الضيافة والمباني السكنية والتجارية. هذه المراجع تعرض التقنية عالمياً، ولا تعني تنفيذ جميعها بواسطة الأولى.',
      'Explore international system references in hospitality, residential and commercial buildings. These illustrate the technology worldwide; they do not imply delivery of every project by Al Oula.',
    ),
  },
  {
    id: 'sustainability',
    title: bi('صمّم اليوم مع مراعاة الغد', 'Design today with tomorrow in mind'),
    short: bi('الموارد', 'Resources'),
    body: bi(
      'ضع العزل واستخدام المواد وتفاصيل الموقع ضمن قراراتك المبكرة. النتائج البيئية تعتمد على تصميم المبنى وتنفيذه وتشغيله بالكامل.',
      'Consider insulation, material use and site detailing early. Environmental outcomes depend on the design, construction and operation of the whole building.',
    ),
  },
  {
    id: 'start-your-project',
    title: bi('ابدأ بأسئلة مشروعك', 'Start with your project’s questions'),
    short: bi('ابدأ', 'Get started'),
    body: bi(
      'أخبرنا عن الموقع والاستخدام والمخططات المتاحة ونطاق العمل. هذه التفاصيل تفتح نقاشاً عملياً حول احتياجات مشروعك.',
      'Tell us the location, building use, available drawings and scope. These details start a practical discussion about your project needs.',
    ),
  },
  {
    id: 'contact-card',
    title: bi('لنتحدث عن مشروعك', 'Let’s discuss your project'),
    short: bi('تواصل', 'Contact'),
    body: bi(
      'الأولى للتنمية والاستثمار • نظام وتد',
      'Al Oula Development & Investment • WATAD system',
    ),
  },
] as const;
export const ui = {
  explore: bi('اكتشف النظام', 'Explore the system'),
  contact: bi('ناقش مشروعك', 'Discuss your project'),
  language: bi('English', 'العربية'),
  theme: bi('تبديل المظهر', 'Switch theme'),
  pause: bi('إيقاف الحركة', 'Pause motion'),
  resume: bi('تشغيل الحركة', 'Resume motion'),
  previous: bi('القسم السابق', 'Previous section'),
  next: bi('القسم التالي', 'Next section'),
  full: bi('ملء الشاشة', 'Enter fullscreen'),
  exitFull: bi('الخروج من ملء الشاشة', 'Exit fullscreen'),
  present: bi('وضع العرض', 'Presentation mode'),
  exitPresent: bi('إنهاء العرض', 'Exit presentation'),
  hide: bi('إخفاء شريط التحكم (H)', 'Hide controls (H)'),
  show: bi('إظهار شريط التحكم (H)', 'Show controls (H)'),
  guide: bi('مفاتيح التحكم', 'Keyboard shortcuts'),
  guideText: bi(
    'H للشريط • P للعرض • F لملء الشاشة • الأسهم للتنقل • Esc للخروج',
    'H controls • P presentation • F fullscreen • arrows navigate • Esc exit',
  ),
  menu: bi('أقسام الموقع', 'Website sections'),
  close: bi('إغلاق', 'Close'),
  section: bi('القسم', 'Section'),
  illustration: bi('تصوّر توضيحي؛ ليس مخططاً تنفيذياً', 'Illustration; not a construction drawing'),
  rotate: bi('اسحب لتدوير النموذج', 'Drag to rotate the model'),
  load3d: bi('استكشف ثلاثي الأبعاد', 'Explore in 3D'),
  reset: bi('إعادة ضبط العرض', 'Reset view'),
  explode: bi('فصل الطبقات', 'Separate layers'),
  roof: bi('رفع السقف', 'Lift the roof'),
  stage: bi('مرحلة التنفيذ', 'Construction stage'),
  viewCase: bi('شاهد المرجع', 'View reference'),
  all: bi('الكل', 'All'),
  international: bi('مرجع دولي للتقنية', 'International technology reference'),
  local: bi('من مكتبة التطبيقات العُمانية', 'From the Oman application library'),
  back: bi('العودة إلى العرض', 'Back to presentation'),
  mail: bi('اكتب إلى الفريق', 'Email the team'),
  website: bi('الموقع الرسمي للأولى', 'Al Oula official website'),
  qr: bi('امسح لفتح العرض', 'Scan to open the presentation'),
  copied: bi('تم نسخ الرابط', 'Link copied'),
  copy: bi('نسخ رابط العرض', 'Copy presentation link'),
  unavailable: bi(
    'ملء الشاشة غير متاح في هذا المتصفح. يمكنك استخدام وضع العرض.',
    'Fullscreen is unavailable in this browser. You can use presentation mode.',
  ),
  loading: bi('تحميل النموذج…', 'Loading model…'),
  error: bi(
    'تعذّر تحميل النموذج. الصورة والتفاصيل متاحة أدناه.',
    'The model could not load. The image and details remain available.',
  ),
  retry: bi('إعادة المحاولة', 'Try again'),
  skip: bi('انتقل إلى المحتوى', 'Skip to content'),
  technical: bi('اطلب المعلومات الفنية', 'Request technical information'),
};
export const audiences = [
  {
    icon: 'home',
    title: bi('بيت العائلة', 'Your family home'),
    body: bi(
      'الراحة والتصميم ووضوح نطاق التنفيذ.',
      'Comfort, design and a clear construction scope.',
    ),
    target: 'comfort',
  },
  {
    icon: 'building',
    title: bi('التطوير والضيافة', 'Development & hospitality'),
    body: bi(
      'تنظيم التنفيذ وتكرار الوحدات ومقارنة المشروع.',
      'Delivery planning, repeated units and project comparison.',
    ),
    target: 'project-comparison',
  },
  {
    icon: 'compass',
    title: bi('المعماري والاستشاري', 'Architects & consultants'),
    body: bi(
      'العناصر والتفاصيل والأدلة الفنية المتاحة.',
      'Elements, details and available technical evidence.',
    ),
    target: 'elements',
  },
  {
    icon: 'tool',
    title: bi('المقاول وفريق الموقع', 'Contractors & site teams'),
    body: bi(
      'فهم مراحل التركيب والربط والتنسيق.',
      'Understand assembly, connections and coordination.',
    ),
    target: 'construction-process',
  },
] as const;
export const layers = [
  {
    title: bi('قلب عازل من EPS', 'EPS insulating core'),
    body: bi(
      'البوليسترين الممدّد داخل اللوح؛ يحدّد التصميم سماكته وخصائصه.',
      'Expanded polystyrene within the panel; its thickness and properties follow the design.',
    ),
  },
  {
    title: bi('شبك فولاذي مجلفن', 'Galvanised steel mesh'),
    body: bi(
      'شبك على وجهي اللوح يندمج مع الطبقات الخرسانية بعد التنفيذ.',
      'Mesh on both faces integrates with the concrete layers after application.',
    ),
  },
  {
    title: bi('روابط بين الوجهين', 'Through-panel connectors'),
    body: bi(
      'أسلاك تصل الشبك عبر القلب، وفق تفاصيل العنصر المعتمدة.',
      'Wires connect the mesh through the core, following the specified element details.',
    ),
  },
  {
    title: bi('طبقات خرسانية وتشطيب', 'Concrete layers & finish'),
    body: bi(
      'تُنفّذ في الموقع. التسليح والسماكات والمعالجة والتشطيب مرتبطة بالمشروع.',
      'Applied on site. Reinforcement, thickness, curing and finish depend on the project.',
    ),
  },
];
export const elements = [
  {
    id: 'single',
    title: bi('لوح الجدار المفرد', 'Single wall panel'),
    body: bi(
      'قلب عازل وشبك على الوجهين؛ يُستخدم وفق التصميم الإنشائي.',
      'An insulating core and mesh on both faces, used to the structural design.',
    ),
  },
  {
    id: 'double',
    title: bi('لوح الجدار المزدوج', 'Double wall panel'),
    body: bi(
      'تركيب مزدوج يتيح تجويفاً خرسانياً وفق متطلبات التصميم.',
      'A double assembly providing a concrete cavity where the design requires it.',
    ),
  },
  {
    id: 'curved',
    title: bi('لوح الجدار المنحني', 'Curved wall panel'),
    body: bi(
      'للتشكيلات المنحنية، مع مراجعة الهندسة والتسليح والتفاصيل.',
      'For curved forms, with geometry, reinforcement and detailing review.',
    ),
  },
  {
    id: 'slab',
    title: bi('لوح الأرضية والسقف', 'Floor & slab panel'),
    body: bi(
      'عناصر أفقية تستلزم تصميم البحور والتسليح والدعم المؤقت.',
      'Horizontal elements requiring span, reinforcement and temporary support design.',
    ),
  },
  {
    id: 'landing',
    title: bi('لوح بسطة السلم', 'Stair landing panel'),
    body: bi(
      'عنصر البسطة، ضمن تفاصيل السلم والربط والدعم المعتمدة.',
      'A landing element within the approved stair, connection and support details.',
    ),
  },
  {
    id: 'stairs',
    title: bi('عنصر السلالم', 'Stair element'),
    body: bi(
      'تشكيل درجات السلم مع التسليح والخرسانة والتشطيب حسب المخططات.',
      'A stair profile with reinforcement, concrete and finish to the drawings.',
    ),
  },
];
export const stages = [
  bi('التخطيط والمخططات', 'Design & drawings'),
  bi('الألواح والتركيب', 'Panels & placement'),
  bi('الربط والدعم', 'Connections & bracing'),
  bi('تنسيق الخدمات', 'Service coordination'),
  bi('الخرسانة والمعالجة', 'Concrete & curing'),
  bi('السقف والتشطيب', 'Roof & finishes'),
];
export const stageBodies = [
  bi(
    'مراجعة الموقع والأحمال والتفاصيل والموافقات المطلوبة.',
    'Review site conditions, loads, details and required approvals.',
  ),
  bi(
    'تصنيع الألواح وتوريدها وترتيبها وفق مخططات المشروع.',
    'Manufacture, deliver and position panels to the project drawings.',
  ),
  bi(
    'تجهيز الوصلات والتسليح والدعم المؤقت وفق خطة التنفيذ.',
    'Prepare connections, reinforcement and temporary support to the method statement.',
  ),
  bi(
    'تنسيق مسارات الكهرباء والسباكة والتفاصيل قبل إغلاقها.',
    'Coordinate electrical, plumbing and detail routes before enclosure.',
  ),
  bi(
    'تنفيذ الخرسانة والمعالجة والفحوصات وفق المواصفات.',
    'Apply concrete, cure and inspect to the specifications.',
  ),
  bi(
    'استكمال السقف والتشطيبات والفحص النهائي حسب نطاق المشروع.',
    'Complete the roof, finishes and final inspection to the project scope.',
  ),
];
export const cases = [
  {
    id: 'oman-interior',
    country: bi('عُمان', 'Oman'),
    region: 'oman',
    name: bi('مساحة سكنية في الأنصب', 'Residential interior in Al Ansab'),
    image: 'oman-interior',
    width: 2056,
    height: 1536,
    caption: bi(
      'صورة مساحة داخلية من مجموعة «فيلا في الأنصب» في مكتبة التطبيقات. لا تحدد الصورة وحدها تفاصيل الجدار أو تاريخ التنفيذ.',
      'Interior image from the “Villa in Al Ansab” application collection. The image alone does not establish the wall details or construction date.',
    ),
    use: bi('سكني', 'Residential'),
  },
  {
    id: 'oman-installation',
    country: bi('عُمان', 'Oman'),
    region: 'oman',
    name: bi('الألواح في مرحلة التركيب', 'Panels during installation'),
    image: 'oman-installation',
    width: 4032,
    height: 3024,
    caption: bi(
      'رفع وتجهيز ألواح في الموقع، من مكتبة التطبيقات العُمانية. تُظهر الصورة مرحلة عمل ولا تمثل تعليمات تنفيذ.',
      'Lifting and positioning panels on site, from the Oman application library. This shows a work stage and is not an installation instruction.',
    ),
    use: bi('مرحلة موقع', 'Site stage'),
  },
  {
    id: 'saudi-chalet',
    country: bi('السعودية', 'Saudi Arabia'),
    region: 'international',
    name: bi('منحنيات في مشروع ضيافة', 'Curved forms in hospitality'),
    image: 'saudi-chalet',
    width: 1448,
    height: 1086,
    caption: bi(
      'مرجع من مجموعة Alian chalet في مكتبة النظام، يوضح إمكانات الأشكال المعمارية. مرجع دولي؛ لم تُنسب أعماله إلى الأولى.',
      'Reference from the Alian chalet system collection, illustrating architectural forms. An international reference; delivery is not attributed to Al Oula.',
    ),
    use: bi('ضيافة', 'Hospitality'),
  },
  {
    id: 'philippines-restaurant',
    country: bi('الفلبين', 'Philippines'),
    region: 'international',
    name: bi('تطبيق تجاري في لاغونا', 'Commercial application in Laguna'),
    image: 'philippines-restaurant',
    width: 2048,
    height: 1365,
    caption: bi(
      'مرجع من مجموعة Meisters Uncorked Restaurant في مكتبة النظام. اعرض تفاصيل الدور الإنشائي مع الفريق عند تقييم تطبيق مماثل.',
      'Reference from the Meisters Uncorked Restaurant system collection. Discuss the structural role with the team when assessing a similar application.',
    ),
    use: bi('تجاري', 'Commercial'),
  },
  {
    id: 'panama-resort',
    country: bi('بنما', 'Panama'),
    region: 'international',
    name: bi('مرجع ضيافة في بنما', 'Hospitality reference in Panama'),
    image: 'panama-resort',
    width: 1200,
    height: 800,
    caption: bi(
      'صورة من مجموعة Dreams Resort Playa Bonita في مكتبة المراجع الدولية للنظام. لا تعني مشاركة الأولى في تنفيذ المشروع.',
      'Image from the Dreams Resort Playa Bonita international system collection. This does not imply Al Oula’s involvement in project delivery.',
    ),
    use: bi('ضيافة', 'Hospitality'),
  },
  {
    id: 'qatar-gardens',
    country: bi('قطر', 'Qatar'),
    region: 'international',
    name: bi('مرحلة تنفيذ في أم صلال', 'Construction stage in Umm Salal'),
    image: 'qatar-gardens',
    width: 2592,
    height: 1944,
    caption: bi(
      'مرجع من مجموعة Al Mohanna Gardens في مكتبة النظام، يُظهر مرحلة تنفيذ في الموقع. مرجع دولي للتقنية، ولا يُنسب تنفيذه إلى الأولى.',
      'Reference from the Al Mohanna Gardens system collection, showing a site construction stage. An international technology reference; delivery is not attributed to Al Oula.',
    ),
    use: bi('مرحلة موقع', 'Site stage'),
  },
] as const;
export type CaseRecord = (typeof cases)[number];
export const faqs = [
  {
    q: bi('هل يناسب النظام مشروعي؟', 'Will the system suit my project?'),
    a: bi(
      'تبدأ الإجابة بالموقع والاستخدام والمخططات والأحمال والمتطلبات المحلية. يراجع الفريق والاستشاري نطاق الاستخدام والتفاصيل المطلوبة.',
      'Start with the location, use, drawings, loads and local requirements. The team and consultant review the intended application and required details.',
    ),
  },
  {
    q: bi('هل يمكن تغيير شكل التصميم؟', 'Can I vary the architectural form?'),
    a: bi(
      'توجد عناصر للجدران المنحنية والأرضيات والسلالم. تُراجع الفكرة مع التفاصيل الإنشائية والفتحات والوصلات قبل التنفيذ.',
      'The family includes curved walls, floors and stairs. Review the concept alongside structural details, openings and connections before construction.',
    ),
  },
  {
    q: bi('ما الذي تتضمنه المقارنة المالية؟', 'What should a cost comparison include?'),
    a: bi(
      'حدّد التوريد والنقل والتركيب والخرسانة والتسليح والخدمات والتشطيبات والدعم والمدة. ينبغي مقارنة نطاقات متساوية، لا أسعار مواد منفردة.',
      'Define supply, transport, assembly, concrete, reinforcement, services, finishes, support and programme. Compare equivalent scopes rather than individual material prices.',
    ),
  },
  {
    q: bi(
      'كيف أقيّم الأداء الحراري أو الصوتي؟',
      'How do I assess thermal or acoustic performance?',
    ),
    a: bi(
      'اطلب تقرير الاختبار والتركيب الذي يغطيه، ثم راجع ملاءمته لمشروعك. النوافذ والسقف والتفاصيل والتنفيذ تؤثر في النتيجة الكلية.',
      'Request the test report and the assembly it covers, then review its relevance to your project. Windows, the roof, details and workmanship affect the whole-building result.',
    ),
  },
  {
    q: bi('ما المعلومات التي أرسلها للبدء؟', 'What information should I send first?'),
    a: bi(
      'الموقع، واستخدام المبنى، والمخططات المتاحة، ونطاق العمل المطلوب، والبرنامج المقترح. أرسل ملخصك إلى البريد الرسمي للفريق.',
      'Send the location, building use, available drawings, required scope and proposed programme to the team’s official email.',
    ),
  },
];
