import { useEffect, useRef, useState } from 'react';
import { asset, type Locale } from './content';
import { Icon } from './icons';
import collectionData from './gallery-data.json';
export type Collection = {
  id: string;
  countryCode: string;
  country: Record<Locale, string>;
  name: Record<Locale, string>;
  region: string;
  count: number;
  cover: string;
};
type ImageRecord = {
  id: string;
  src: string;
  thumb: string;
  width: number;
  height: number;
  srcSet: { src: string; width: number }[];
};
export const collections: Collection[] = collectionData;
const cache = new Map<string, ImageRecord[]>();
export const galleryForCase = (caseId: string) => {
  const names: Record<string, string> = {
    'oman-interior': 'Villa in Al Ansab',
    'oman-installation': 'Oman site collection',
    'saudi-chalet': 'Alian chalet complex',
    'philippines-restaurant': 'Meisters Uncorked, Laguna',
    'panama-resort': 'Dreams Resort Playa Bonita',
    'qatar-gardens': 'Al Mohanna Gardens, Umm Salal',
  };
  return collections.find((c) => c.name.en === names[caseId]) || collections[0];
};
export function Gallery({ collection, locale }: { collection: Collection; locale: Locale }) {
  const [images, setImages] = useState<ImageRecord[]>(cache.get(collection.id) || []);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const ar = locale === 'ar';
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const saved = cache.get(collection.id);
    setImages(saved || []);
    setIndex(0);
    setError(false);
    if (!near || saved) return;
    const controller = new AbortController();
    fetch(asset(`galleries/${collection.id}.json`), { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Gallery unavailable');
        return r.json();
      })
      .then((data: { id: string; images: ImageRecord[] }) => {
        if (controller.signal.aborted) return;
        if (data.id !== collection.id || data.images.length !== collection.count)
          throw new Error('Gallery mismatch');
        cache.set(collection.id, data.images);
        setLoaded(false);
        setImageError(false);
        setImages(data.images);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(true);
      });
    return () => controller.abort();
  }, [collection.id, collection.count, near, attempt]);
  const photo = images[index];
  const imageUrl = (src: string) => asset(src) + (imageAttempt ? `?retry=${imageAttempt}` : '');
  useEffect(() => {
    const image = root.current?.querySelector<HTMLImageElement>('.gallery-main');
    setLoaded(Boolean(image?.complete && image.naturalWidth));
  }, [photo?.id]);
  const select = (next: number) => {
    const normalized = (next + images.length) % images.length;
    if (normalized === index) return;
    // Reset before mounting the new image. A post-mount effect can erase a fast load error.
    setLoaded(false);
    setImageError(false);
    setImageAttempt(0);
    setIndex(normalized);
  };
  const start = Math.max(0, Math.min(index - 2, images.length - 5));
  const label = ar ? 'معرض الصور' : 'Photo gallery';
  return (
    <div
      ref={root}
      className="gallery"
      role="region"
      aria-label={`${label}: ${collection.name[locale]}`}
      data-shortcuts="local"
      data-collection={collection.id}
      onKeyDown={(e) => {
        if (
          !images.length ||
          e.altKey ||
          e.ctrlKey ||
          e.metaKey ||
          (e.target as HTMLElement).closest('select,input')
        )
          return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          select(index + (e.key === 'ArrowRight' ? (ar ? -1 : 1) : ar ? 1 : -1));
        }
        if (e.key === 'Home' || e.key === 'End') {
          e.preventDefault();
          select(e.key === 'Home' ? 0 : images.length - 1);
        }
      }}
    >
      <div className="gallery-title">
        <div>
          <p className="overline">{collection.country[locale]}</p>
          <h3>{collection.name[locale]}</h3>
        </div>
        <span>
          {collection.count} {ar ? 'صورة' : 'photos'}
        </span>
      </div>
      <div className="gallery-frame" aria-busy={!loaded && !imageError && !error}>
        {photo ? (
          <img
            key={`${photo.id}-${imageAttempt}`}
            className={loaded ? 'gallery-main loaded' : 'gallery-main'}
            src={imageUrl(photo.src)}
            srcSet={photo.srcSet.map((s) => `${imageUrl(s.src)} ${s.width}w`).join(', ')}
            sizes="(max-width:760px) 92vw, 85vw"
            width={photo.width}
            height={photo.height}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setImageError(true)}
            alt={`${collection.name[locale]} · ${collection.country[locale]} · ${ar ? 'صورة' : 'Photo'} ${index + 1}`}
          />
        ) : (
          <img
            className="gallery-cover"
            src={asset(collection.cover)}
            alt=""
            width="240"
            height="150"
            loading="lazy"
          />
        )}
        {(error || imageError) && (
          <div className="gallery-status" role="status">
            {ar ? 'تعذّر تحميل الصورة. حاول مرة أخرى.' : 'The image could not load. Try again.'}
            <button
              className="pill"
              onClick={() =>
                imageError
                  ? (setImageError(false), setLoaded(false), setImageAttempt((x) => x + 1))
                  : setAttempt((x) => x + 1)
              }
            >
              {ar ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}
        {!loaded && !error && !imageError && (
          <span className="gallery-loading" role="status">
            {ar ? 'تحميل الصور…' : 'Loading photos…'}
          </span>
        )}
        <div className="gallery-controls">
          <button
            className="icon-button"
            disabled={images.length < 2}
            onClick={() => select(index - 1)}
            aria-label={ar ? 'الصورة السابقة' : 'Previous photo'}
          >
            <Icon name="previous" className="flow-arrow" />
          </button>
          <span aria-live="polite" aria-atomic="true">
            {images.length ? index + 1 : '—'} / {collection.count}
          </span>
          <button
            className="icon-button"
            disabled={images.length < 2}
            onClick={() => select(index + 1)}
            aria-label={ar ? 'الصورة التالية' : 'Next photo'}
          >
            <Icon name="arrow" className="flow-arrow" />
          </button>
        </div>
      </div>
      <div
        className="gallery-preview"
        role="group"
        aria-label={ar ? 'معاينات الصور' : 'Photo previews'}
      >
        {images.slice(start, start + 5).map((image, offset) => (
          <button
            key={image.id}
            aria-pressed={index === start + offset}
            aria-label={`${ar ? 'عرض الصورة' : 'Show photo'} ${start + offset + 1}`}
            onClick={() => select(start + offset)}
          >
            <img src={asset(image.thumb)} alt="" width="240" height="150" loading="lazy" />
            <span>{start + offset + 1}</span>
          </button>
        ))}
      </div>
      <div className="gallery-progress" aria-hidden="true">
        <span style={{ width: `${images.length ? ((index + 1) / images.length) * 100 : 0}%` }} />
      </div>
    </div>
  );
}
export function GalleryBrowser({
  locale,
  region,
}: {
  locale: Locale;
  region: 'oman' | 'international';
}) {
  const list = collections.filter((c) => c.region === region);
  const [country, setCountry] = useState('all');
  const [selected, setSelected] = useState(
    (
      list.find(
        (c) => c.name.en === (region === 'oman' ? 'Villa in Al Ansab' : 'Alian chalet complex'),
      ) || list[0]
    ).id,
  );
  const filtered = list.filter((c) => country === 'all' || c.countryCode === country);
  const current = filtered.find((c) => c.id === selected) || filtered[0];
  const countries = [...new Map(list.map((c) => [c.countryCode, c.country])).entries()];
  return (
    <div className="gallery-browser" data-shortcuts="local">
      <div className="gallery-selectors">
        {region === 'international' && (
          <label>
            <span>{locale === 'ar' ? 'الدولة' : 'Country'}</span>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
              }}
              aria-label={locale === 'ar' ? 'اختر الدولة' : 'Choose country'}
            >
              <option value="all">
                {locale === 'ar' ? 'كل الدول والمراجع' : 'All countries & references'}
              </option>
              {countries.map(([code, name]) => (
                <option key={code} value={code}>
                  {name[locale]}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          <span>{locale === 'ar' ? 'مجموعة الصور' : 'Photo collection'}</span>
          <select
            value={current.id}
            onChange={(e) => setSelected(e.target.value)}
            aria-label={locale === 'ar' ? 'اختر مجموعة الصور' : 'Choose photo collection'}
          >
            {filtered.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name[locale]} · {c.country[locale]} · {c.count}
              </option>
            ))}
          </select>
        </label>
        <p>
          {list.reduce((n, c) => n + c.count, 0)}{' '}
          {locale === 'ar' ? 'صورة في المكتبة' : 'library photos'} · {list.length}{' '}
          {locale === 'ar' ? 'مجموعة' : 'collections'}
        </p>
      </div>
      <Gallery key={current.id} collection={current} locale={locale} />
      <noscript>
        <p>
          {locale === 'ar'
            ? 'فعّل JavaScript للتنقل بين جميع صور المكتبة.'
            : 'Enable JavaScript to browse every library image.'}
        </p>
      </noscript>
    </div>
  );
}
