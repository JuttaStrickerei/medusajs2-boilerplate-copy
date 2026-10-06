"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { Pause, Play, RotateCcw } from "@components/icons"
import { VIDEOS } from "@lib/constants/images"

// loading: Quelle noch nicht gesetzt / puffert · playing/paused: läuft bzw. angehalten
// ended: bleibt auf dem letzten Bild (Manufaktur) stehen · still: Standbild statt Video
type Status = "loading" | "playing" | "paused" | "ended" | "still"

// Läuft das Video bis dahin nicht, bleibt das Standbild (Abspielen per Button)
const AUTOPLAY_START_MS = 4000

// Gleicher Breakpoint wie Tailwind "small"
const pickSource = () =>
  window.matchMedia("(min-width: 1024px)").matches
    ? VIDEOS.home.hero.desktop
    : VIDEOS.home.hero.mobile

const HeroVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [src, setSrc] = useState<string>()
  const [status, setStatus] = useState<Status>("loading")
  // Nur das automatische Abspielen fällt bei langsamer Leitung aufs Standbild
  // zurück; wer selbst auf Play drückt, wartet bewusst aufs Puffern
  const isAutoplayRef = useRef(true)
  const hasStartedRef = useRef(false)

  // Lieber ein ruhiges Bild als ein schwarzer Kasten oder ein ruckelnder Flug
  const stopAutoplay = useCallback(() => {
    if (!isAutoplayRef.current) return
    isAutoplayRef.current = false
    videoRef.current?.pause()
    setStatus("still")
  }, [])

  useEffect(() => {
    // Bei "Bewegung reduzieren", Datensparmodus oder 2G kein Autoplay und kein
    // Download – nur das Standbild; Abspielen bleibt per Button möglich.
    // Videos: 4,6 MB (Desktop) bzw. 2,7 MB (Mobil), 7,8 s.
    // Bewusst nicht nach „3g“ oder downlink filtern: Chrome schätzt grob und
    // meldet an Handy-Hotspots oft „3g“ bzw. unter 2,5 Mbit/s, obwohl das
    // Video in wenigen Sekunden da ist – das Video lief dann nie von selbst.
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    // navigator.connection gibt es nur in Chromium-Browsern
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string }
      }
    ).connection
    const slowConnection =
      connection?.saveData === true ||
      ["slow-2g", "2g"].includes(connection?.effectiveType ?? "")

    if (reducedMotion || slowConnection) {
      setStatus("still")
      return
    }
    setSrc(pickSource())
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!src || !video) return

    // Ohne muted blockieren die Browser (v. a. iOS) das automatische Abspielen
    video.muted = true
    video.play().catch(() => setStatus("still"))

    const timer = window.setTimeout(() => {
      if (!hasStartedRef.current) stopAutoplay()
    }, AUTOPLAY_START_MS)
    return () => window.clearTimeout(timer)
  }, [src, stopAutoplay])

  const toggle = () => {
    const video = videoRef.current
    if (!video) return
    isAutoplayRef.current = false

    if (status === "playing") {
      video.pause()
      return
    }
    if (!src) {
      // Standbild-Modus: Quelle erst jetzt laden, der Effekt oben startet das Video
      setSrc(pickSource())
      return
    }
    if (status === "ended" || status === "still") {
      video.currentTime = 0
    }
    video.play().catch(() => setStatus("still"))
  }

  const control = {
    playing: { label: "Video pausieren", icon: <Pause size={16} /> },
    paused: { label: "Video abspielen", icon: <Play size={16} /> },
    ended: { label: "Video erneut abspielen", icon: <RotateCcw size={16} /> },
    still: { label: "Video abspielen", icon: <Play size={16} /> },
  } as const

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        onPlaying={() => {
          hasStartedRef.current = true
          setStatus("playing")
        }}
        // Puffer leer, nachdem der Flug schon lief: Leitung zu langsam
        onWaiting={() => hasStartedRef.current && stopAutoplay()}
        onPause={(e) => {
          if (e.currentTarget.ended) return
          // Das Pausieren beim Rückfall aufs Standbild nicht überschreiben
          setStatus((current) => (current === "still" ? current : "paused"))
        }}
        onEnded={() => setStatus("ended")}
        onError={() => setStatus("still")}
      />

      {/* Letztes Frame des Videos als Standbild */}
      {status === "still" && (
        <div className="absolute inset-0 animate-fade-in">
          <Image
            src={VIDEOS.home.hero.stillDesktop}
            alt=""
            fill
            sizes="100vw"
            className="hidden object-cover small:block"
          />
          <Image
            src={VIDEOS.home.hero.stillMobile}
            alt=""
            fill
            sizes="100vw"
            className="object-cover small:hidden"
          />
        </div>
      )}

      {/* Verlauf für lesbare Schrift im unteren Drittel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/5"
      />

      {status !== "loading" && (
        <button
          type="button"
          onClick={toggle}
          aria-label={control[status].label}
          title={control[status].label}
          className="absolute bottom-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white small:bottom-8 medium:right-8"
        >
          {control[status].icon}
        </button>
      )}
    </>
  )
}

export default HeroVideo
