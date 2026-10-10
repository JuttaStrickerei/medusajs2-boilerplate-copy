/**
 * Zentrale Bild-Pfade für statische Assets
 * Alle Bilder befinden sich in public/images/
 */
export const IMAGES = {
  home: {
    manufaktur: "/images/home/manufaktur.png",
  },
  about: {
    historie: "/images/about/historie.webp",
  },
} as const

/**
 * Videos liegen in public/videos/ und werden 1 Jahr gecacht (next.config.js) –
 * bei einem neuen Schnitt daher den Dateinamen hochzählen (v3 → v4).
 */
export const VIDEOS = {
  home: {
    // Hero: Drohnenflug über die Manufaktur (S3 „film slow“ v3b ohne Text, 7,8 s, ohne Ton),
    // Master: Produktion/v2_Pipeline/out/drone/web/drone_S3_v3b_web_*.mp4.
    // Standbilder = letztes Frame, für reduzierte Bewegung / Datensparmodus.
    hero: {
      desktop: "/videos/hero/drohne-v3-16x9.mp4",
      mobile: "/videos/hero/drohne-v3-9x16.mp4",
      stillDesktop: "/videos/hero/drohne-v3-16x9-ende.jpg",
      stillMobile: "/videos/hero/drohne-v3-9x16-ende.jpg",
    },
  },
} as const
