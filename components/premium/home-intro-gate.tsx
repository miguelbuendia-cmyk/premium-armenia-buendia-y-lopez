"use client"

import { Play } from "lucide-react"
import {
  startTransition,
  useEffect,
  useRef,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type {
  FacadeSections,
  GallerySections,
  ProjectContent,
} from "@/lib/premium-content"
import type { TowerAExplorerData } from "@/lib/tower-a-types"

import { PropertyShell } from "./property-shell"

type HomeIntroGateProps = {
  content: ProjectContent
  facadeSections: FacadeSections
  gallerySections: GallerySections
  towerAExplorerData: TowerAExplorerData
}

type IntroState = "idle" | "starting" | "playing" | "completed" | "error"

const INTRO_READY_TIMEOUT_MS = 8_000
const INTRO_PLAYBACK_START_TIMEOUT_MS = 12_000

export function HomeIntroGate({
  content,
  facadeSections,
  gallerySections,
  towerAExplorerData,
}: HomeIntroGateProps) {
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null)
  const introVideoRef = useRef<HTMLVideoElement | null>(null)
  const playbackStartTimeoutRef = useRef<number | null>(null)
  const isPlaybackAttemptActiveRef = useRef(false)
  const [introState, setIntroState] = useState<IntroState>("idle")
  const [hasBackgroundVideoError, setHasBackgroundVideoError] = useState(false)
  const [hasViewerInitialFrame, setHasViewerInitialFrame] = useState(false)
  const [hasReadinessTimedOut, setHasReadinessTimedOut] = useState(false)

  const isShellVisible =
    introState === "completed" || introState === "error"
  const isIntroContentVisible =
    (introState === "idle" || introState === "starting") && !isShellVisible
  const isIntroReadyToStart = hasViewerInitialFrame || hasReadinessTimedOut

  useEffect(() => {
    if (hasViewerInitialFrame) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setHasReadinessTimedOut(true)
    }, INTRO_READY_TIMEOUT_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [hasViewerInitialFrame])

  useEffect(() => {
    return () => {
      isPlaybackAttemptActiveRef.current = false
      if (playbackStartTimeoutRef.current !== null) {
        window.clearTimeout(playbackStartTimeoutRef.current)
      }
    }
  }, [])

  const clearPlaybackStartTimeout = () => {
    if (playbackStartTimeoutRef.current === null) {
      return
    }

    window.clearTimeout(playbackStartTimeoutRef.current)
    playbackStartTimeoutRef.current = null
  }

  const completeIntro = () => {
    isPlaybackAttemptActiveRef.current = false
    clearPlaybackStartTimeout()
    backgroundVideoRef.current?.pause()
    startTransition(() => {
      setIntroState("completed")
    })
  }

  const failOpen = () => {
    isPlaybackAttemptActiveRef.current = false
    clearPlaybackStartTimeout()
    backgroundVideoRef.current?.pause()
    introVideoRef.current?.pause()
    startTransition(() => {
      setIntroState("error")
    })
  }

  const handleStart = async () => {
    const video = introVideoRef.current
    if (!video) {
      failOpen()
      return
    }

    if (!isIntroReadyToStart || introState !== "idle") {
      return
    }

    try {
      video.currentTime = 0
      isPlaybackAttemptActiveRef.current = true
      setIntroState("starting")
      playbackStartTimeoutRef.current = window.setTimeout(() => {
        failOpen()
      }, INTRO_PLAYBACK_START_TIMEOUT_MS)

      await video.play()

      if (!isPlaybackAttemptActiveRef.current) {
        return
      }

      clearPlaybackStartTimeout()
      backgroundVideoRef.current?.pause()
      startTransition(() => {
        setIntroState("playing")
      })
    } catch {
      failOpen()
    }
  }

  return (
    <div className="home-intro-shell">
      <div
        className={cn("home-intro-site", isShellVisible && "home-intro-site-ready")}
        aria-hidden={!isShellVisible}
      >
        <PropertyShell
          content={content}
          facadeSections={facadeSections}
          gallerySections={gallerySections}
          towerAExplorerData={towerAExplorerData}
          suppressViewerLoadingOverlay
          onViewerLoadingStateChange={(state) => {
            setHasViewerInitialFrame(state.hasInitialFrame)
          }}
        />
      </div>

      <div
        className={cn(
          "home-intro-overlay",
          isShellVisible && "home-intro-overlay-hidden"
        )}
        aria-hidden={isShellVisible}
      >
        <video
          ref={backgroundVideoRef}
          className={cn(
            "home-intro-video home-intro-background-video",
            (introState === "playing" ||
              isShellVisible ||
              hasBackgroundVideoError) &&
              "home-intro-background-video-hidden"
          )}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() => {
            setHasBackgroundVideoError(true)
          }}
          aria-hidden="true"
        >
          <source src="/Intro%20detras/Introepic.mp4" type="video/mp4" />
        </video>

        <video
          ref={introVideoRef}
          className={cn(
            "home-intro-video home-intro-main-video",
            introState !== "playing" && "home-intro-main-video-hidden"
          )}
          muted
          playsInline
          preload="auto"
          onEnded={completeIntro}
          onError={failOpen}
        >
          <source src="/intro.mp4" type="video/mp4" />
        </video>

        <div className="home-intro-scrim" aria-hidden="true" />

        <div
          className={cn(
            "home-intro-content",
            !isIntroContentVisible && "home-intro-content-hidden"
          )}
        >
          <div className="home-intro-actions">
            <Button
              type="button"
              size="lg"
              className="home-intro-button"
              disabled={!isIntroReadyToStart || introState === "starting"}
              aria-busy={!isIntroReadyToStart || introState === "starting"}
              onClick={handleStart}
            >
              {isIntroReadyToStart && introState === "idle" ? (
                <Play data-icon="inline-start" />
              ) : null}
              {introState === "starting"
                ? "Iniciando…"
                : isIntroReadyToStart
                  ? "Entrar"
                  : "Cargando…"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
