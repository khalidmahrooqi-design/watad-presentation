export type IconName =
  | 'next'
  | 'previous'
  | 'sun'
  | 'moon'
  | 'fullscreen'
  | 'collapse'
  | 'present'
  | 'close'
  | 'hide'
  | 'show'
  | 'pause'
  | 'play'
  | 'mail'
  | 'link'
  | 'layers'
  | 'home'
  | 'building'
  | 'tool'
  | 'compass'
  | 'check'
  | 'arrow'
  | 'rotate'
  | 'download'
  | 'leaf'
  | 'volume'
  | 'heat'
  | 'menu'
  | 'plus'
  | 'help';
const paths: Record<IconName, string> = {
  help: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM9 9a3 3 0 1 1 4 2.8c-1 .5-1 1-1 2.2M12 17h.01',
  next: 'm9 5 7 7-7 7',
  previous: 'm15 5-7 7 7 7',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4',
  moon: 'M20.5 13.6A8.5 8.5 0 0 1 10.4 3.5 8.5 8.5 0 1 0 20.5 13.6Z',
  fullscreen: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  collapse: 'M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5',
  present: 'M3 3h18M4 3v13h16V3M12 16v5m-4 0 4-3 4 3m-6-12 5 3-5 3Z',
  close: 'm6 6 12 12M6 18 18 6',
  hide: 'M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6Zm6-3 6 6m0-6-6 6',
  show: 'M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  pause: 'M8 5v14M16 5v14',
  play: 'm8 4 12 8-12 8Z',
  mail: 'M3 5h18v14H3ZM3 6l9 7 9-7',
  link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2m3 6a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2',
  layers: 'm12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5',
  home: 'm3 10 9-7 9 7M5 9v12h14V9m-10 12v-7h6v7',
  building: 'M4 21V3h10v18m0-12h6v12M8 7h2M8 11h2M8 15h2M2 21h20',
  tool: 'M14 6a5 5 0 0 0-6 6l-5 5a2.8 2.8 0 0 0 4 4l5-5a5 5 0 0 0 6-6l-3 3-4-4Z',
  compass: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4 6-3 5-5 3 3-5Z',
  check: 'm5 12 4 4L19 6',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  rotate: 'M20 8a8 8 0 1 0 0 8M20 3v5h-5',
  download: 'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',
  leaf: 'M20 3c-12 0-16 6-13 12 6 3 13-1 13-12ZM4 21l11-11',
  volume: 'M3 9v6h4l5 4V5L7 9Zm13-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  heat: 'M5 20c-6-7 6-9 0-16m7 16c-6-7 6-9 0-16m7 16c-6-7 6-9 0-16',
  menu: 'M4 6h16M4 12h16M4 18h16',
  plus: 'M12 5v14M5 12h14',
};
export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
