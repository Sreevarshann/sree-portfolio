/**
 * Every photograph and video on the site, in one typed manifest. Components
 * read from here; no media path is hard-coded anywhere else.
 *
 * All files are derivatives of the originals Sree supplied: re-encoded for
 * the web (WebP, H.264), auto-oriented, and stripped of all metadata
 * (including GPS). Nothing is generated or retouched; the only edits are
 * pixelated QR codes and a third party's name on the Google event badge and
 * in the Charlie demo photo, for privacy.
 */

export type AchievementSlug = "sauvc" | "google-mlops-expo";

export type MediaImage = {
  id: string;
  kind: "image";
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  /** object-position for cropped thumbnails, e.g. "50% 30%" (the lightbox always shows the full frame). */
  focus?: string;
};

export type MediaVideo = {
  id: string;
  kind: "video";
  /** Ordered renditions; the player picks by viewport width and Save-Data. */
  sources: { src: string; type: string; width: number; height: number; bytes: number }[];
  poster: string;
  width: number;
  height: number;
  /** Seconds. */
  duration: number;
  label: string;
  caption: string;
};

export type Media = MediaImage | MediaVideo;

/** Hero portrait pair: the Spider-Man mask photo is shown first; the real photo is revealed. */
export const portrait = {
  masked: {
    id: "portrait-masked",
    kind: "image",
    src: "/media/portrait/spiderman-mask.webp",
    width: 1206,
    height: 1533,
    alt: "Sreevarshan Sathiyamurthy in a Spider-Man mask by the ocean",
    caption: "Spider-Man portrait",
  },
  real: {
    id: "portrait-real",
    kind: "image",
    src: "/media/portrait/sree-real.webp",
    width: 1206,
    height: 1534,
    alt: "Photograph of Sreevarshan Sathiyamurthy by the ocean",
    caption: "Sreevarshan Sathiyamurthy",
  },
  /** Crop focus for the 4:5 frame (both photos share pose and framing). */
  focus: { x: 50, y: 30 },
} as const satisfies { masked: MediaImage; real: MediaImage; focus: { x: number; y: number } };

/** Achievement media, in display order: the first item is featured. */
export const achievementMedia: Record<AchievementSlug, Media[]> = {
  sauvc: [
    {
      id: "sauvc-task-pass",
      kind: "video",
      sources: [
        { src: "/media/achievements/sauvc/task-pass-720.mp4", type: "video/mp4", width: 720, height: 1280, bytes: 5_033_174 },
        { src: "/media/achievements/sauvc/task-pass-1080.mp4", type: "video/mp4", width: 1080, height: 1920, bytes: 11_905_457 },
      ],
      poster: "/media/achievements/sauvc/task-pass-poster.webp",
      width: 1080,
      height: 1920,
      duration: 14.77,
      label: "Task-pass run of the team's autonomous underwater vehicle in the competition pool",
      caption: "Task-pass run in the competition pool",
    },
    {
      id: "sauvc-team",
      kind: "image",
      src: "/media/achievements/sauvc/team.webp",
      width: 2000,
      height: 1500,
      alt: "Team Varuna crouching beside the yellow autonomous underwater vehicle at the edge of the competition pool",
      caption: "Team Varuna with the underwater vehicle",
      focus: "50% 60%",
    },
    {
      id: "sauvc-auv",
      kind: "image",
      src: "/media/achievements/sauvc/auv.webp",
      width: 2000,
      height: 1752,
      alt: "Close-up of the autonomous underwater vehicle: an orange frame with a camera dome and four thrusters",
      caption: "Autonomous underwater vehicle",
      focus: "50% 55%",
    },
    {
      id: "sauvc-opening",
      kind: "image",
      src: "/media/achievements/sauvc/opening.webp",
      width: 2000,
      height: 1125,
      alt: "Auditorium during the competition opening session, with a speaker on stage",
      caption: "Competition opening session",
      focus: "60% 60%",
    },
  ],
  "google-mlops-expo": [
    {
      id: "google-charlie-demo",
      kind: "image",
      src: "/media/achievements/google/charlie-demo.webp",
      width: 2000,
      height: 1500,
      alt: "Sree demonstrating Charlie, the MBTA real-time chatbot, on laptops and a tablet at a table labelled Charlie",
      caption: "Demonstrating Charlie, the MBTA real-time chatbot",
      focus: "50% 55%",
    },
    {
      id: "google-team",
      kind: "image",
      src: "/media/achievements/google/team.webp",
      width: 2000,
      height: 1671,
      alt: "Group of event participants in front of a screen showing the Northeastern University seal and the Google logo",
      caption: "Event participants at the Google MLOps Expo",
      focus: "50% 70%",
    },
    {
      id: "google-opening",
      kind: "image",
      src: "/media/achievements/google/event-opening.webp",
      width: 2000,
      height: 1303,
      alt: "Opening session on stage, with the Northeastern University seal and the Google logo on the presentation screen",
      caption: "Google MLOps Expo opening session",
      focus: "40% 50%",
    },
    {
      id: "google-badge",
      kind: "image",
      src: "/media/achievements/google/event-badge.webp",
      width: 1351,
      height: 1800,
      alt: "Google guest badge reading Sreevarshan Sathiyamurthy, held on a Google lanyard",
      caption: "Google event guest badge (QR code and host name obscured)",
      focus: "50% 62%",
    },
  ],
};

/** Every file the manifest references (used by tests to prove each one exists). */
export const allMediaFiles = (): string[] => [
  portrait.masked.src,
  portrait.real.src,
  ...Object.values(achievementMedia).flatMap((items) => items.flatMap((m) => (m.kind === "image" ? [m.src] : [...m.sources.map((s) => s.src), m.poster]))),
];
