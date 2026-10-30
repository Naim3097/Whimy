import type { SVGProps } from 'react';

const paths = {
  bag: <path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Zm4 0V6.5a3 3 0 0 1 6 0V8" />,
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  menu: <path d="M4 8h16M4 16h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  arrow: <path d="M4 12h15m-5-5 5 5-5 5" />,
  arrowLeft: <path d="M20 12H5m5-5-5 5 5 5" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  pause: <path d="M9 6v12m6-12v12" />,
  play: <path d="M8.5 5.8v12.4L18.5 12Z" />,
  filter: <path d="M4 7h10m4 0h2M4 17h2m4 0h10M14 4v6M6 14v6" />,
  truck: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />,
  swap: <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4m4 4H7" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="1" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  ruler: <path d="m3 16 13-13 5 5L8 21Zm4-1 2 2m1-5 2 2m1-5 2 2" />,
  sparkle: <path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="M16.8 7.2h.01" />
    </>
  ),
  tiktok: <path d="M14 4v10.5a3.5 3.5 0 1 1-3-3.46M14 4c.4 2.4 2 4 4.5 4.3" />,
  threads: <path d="M15.6 11.2c-.5-2.4-2.2-3.4-4-3.3-2.3.1-3.4 1.8-3.4 4.1 0 2.6 1.6 4.4 4 4.4 2.6 0 3.9-1.7 3.8-3.6-.1-1.8-1.5-2.7-3.4-2.6-1.5.1-2.3 1-2.2 2 .1 1 1 1.6 2.1 1.5M12.2 20c-4.6 0-7.7-3-7.7-8s3.1-8 7.7-8c3.5 0 6 1.7 7 4.8" />,
  whatsapp: <path d="M5 19l1-3.3A7.5 7.5 0 1 1 9 18.6Zm4.6-10.3c-.3 1.3.4 3 1.7 4.3s3 2 4.3 1.7l.6-1.4-1.7-.9-.8.8c-.9-.4-1.7-1.2-2.1-2.1l.8-.8-.9-1.7Z" />,
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1" />
      <path d="m4 6.5 8 6 8-6" />
    </>
  ),
};

export type IconName = keyof typeof paths;

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
