const PATHS: Record<string, string> = {
  home: "M3 11.5 12 4l9 7.5M5 10v9h5v-5h4v5h5v-9",
  alert: "M12 4 3 20h18L12 4Zm0 6v4m0 3h.01",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2",
  radio: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM7.5 7.5a6.5 6.5 0 0 0 0 9M16.5 7.5a6.5 6.5 0 0 1 0 9M4.5 4.5a11 11 0 0 0 0 15M19.5 4.5a11 11 0 0 1 0 15",
  box: "M21 8 12 3 3 8m18 0-9 5m9-5v9l-9 5M3 8l9 5m-9-5v9l9 5m0-9v9",
  layers: "M12 3 3 8l9 5 9-5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
  split: "M6 3v6c0 3 3 3 6 3s6 0 6-3V3M12 12v9M8 21h8",
  mail: "M3 6h18v12H3V6Zm0 0 9 7 9-7",
  book: "M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5V4.5Z M4 19a2.5 2.5 0 0 1 2.5-2.5H20",
  truck: "M3 7h11v9H3V7Zm11 3h4l3 3v3h-7v-6ZM6.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  check: "M4 12.5 9 17.5 20 6.5",
  user: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9c1-4.5 4.5-7 8-7s7 2.5 8 7",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-5.5-5.5",
  sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-6.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
  moon: "M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z",
  menu: "M3 6h18M3 12h18M3 18h18",
  reset: "M4 4v6h6M20 20v-6h-6M5.5 9A7 7 0 0 1 19 8m-.5 7A7 7 0 0 1 5 16",
  download: "M12 3v13m0 0-4-4m4 4 4-4M4 21h16",
  upload: "M12 21V8m0 0-4 4m4-4 4 4M4 3h16",
  refresh: "M4 4v6h6M20 20v-6h-6M5.5 9A7 7 0 0 1 19 8m-.5 7A7 7 0 0 1 5 16",
  robot: "M9 8V6a3 3 0 0 1 6 0v2m-9 0h12v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8Zm2 4h.01M15 12h.01",
  send: "M4 20 21 12 4 4l3 8-3 8Zm3-8h11",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.2-1.7l2-1.6-2-3.4-2.4 1a8 8 0 0 0-2.9-1.7L14 2h-4l-.5 2.6a8 8 0 0 0-2.9 1.7l-2.4-1-2 3.4 2 1.6A8 8 0 0 0 4 12a8 8 0 0 0 .2 1.7l-2 1.6 2 3.4 2.4-1a8 8 0 0 0 2.9 1.7L10 22h4l.5-2.6a8 8 0 0 0 2.9-1.7l2.4 1 2-3.4-2-1.6c.13-.55.2-1.12.2-1.7Z",
  chevron: "m9 6 6 6-6 6",
  trash: "M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13",
  plus: "M12 5v14M5 12h14",
  pencil: "M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z",
  clipboard: "M9 4h6a2 2 0 0 1 2 2v1H7V6a2 2 0 0 1 2-2Zm-4 3h14v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Zm4 6 3 3 5-6",
};

export function Icon({ name, className = "w-4 h-4" }: { name: string; className?: string }) {
  const d = PATHS[name] || PATHS.home;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}
