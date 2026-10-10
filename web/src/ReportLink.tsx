import manifest from '../public/reports/manifest.json';
import { asset, type Locale } from './content';
import { Icon } from './icons';

export type ReportId =
  'acoustic' | 'fire' | 'wind' | 'rain' | 'seismic' | 'static' | 'cyclic' | 'durability';

export default function ReportLink({ id, locale }: { id: ReportId; locale: Locale }) {
  const report = manifest.find((entry) => entry.id === id)!;
  return (
    <a className="report-link" href={asset(report.file)} target="_blank" rel="noopener noreferrer">
      <Icon name="link" />
      <span>
        {report.title[locale]}{' '}
        <small dir="ltr">PDF · {(report.bytes / 1_000_000).toFixed(2)} MB</small>
      </span>
    </a>
  );
}
