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

type IntroState = "idle" | "playing" | "completed" | "error"

export function HomeIntroGate({
  content,
  facadeSections,
  gallerySections,
  towerAExplorerData,
}: HomeIntroGateProps) {
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null)
  const introVideoRef = useRef<HTMLVideoElement | null>(null)
  const [introState, setIntroState] = useState<IntroState>("idle")
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [hasBackgroundVideoError, setHasBackgroundVideoError] = useState(false)
  const [viewerCompletedCount, setViewerCompletedCount] = useState(0)
  const [hasViewerInitialFrame, setHasViewerInitialFrame] = useState(false)

  const isShellVisible =
    introState === "completed" || introState === "error"
  const isIntroContentVisible = introState === "idle" && !isShellVisible
  const minReadyFrames = Math.min(
    content.mainViewer.totalFrames,
    Math.max(12, content.mainViewer.autoplayMinReadyFrames)
  )
  const isIntroReadyToStart =
    isVideoReady &&
    hasViewerInitialFrame &&
    viewerCompletedCount >= minReadyFrames

  useEffect(() => {
    const video = introVideoRef.current
    if (!video) {
      return
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVideoReady(true)
    }
  }, [])

  const completeIntro = () => {
    startTransition(() => {
      setIntroState("completed")
    })
  }

  const failOpen = () => {
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

    if (!isIntroReadyToStart) {
      return
    }

    try {
      backgroundVideoRef.current?.pause()
      video.currentTime = 0
      startTransition(() => {
        setIntroState("playing")
      })
      await video.play()
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
            setViewerCompletedCount(state.completedCount)
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
            (introState !== "idle" || hasBackgroundVideoError) &&
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
          onLoadedData={() => {
            setIsVideoReady(true)
          }}
          onCanPlay={() => {
            setIsVideoReady(true)
          }}
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
          <div className="home-intro-copy">
            <h1 className="home-intro-title">HC PREMIUM</h1>
          </div>

          <div className="home-intro-actions">
            <Button
              type="button"
              size="lg"
              className="home-intro-button"
              disabled={!isIntroReadyToStart}
              aria-busy={!isIntroReadyToStart}
              onClick={handleStart}
            >
              {isIntroReadyToStart ? (
                <Play data-icon="inline-start" />
              ) : null}
              {isIntroReadyToStart ? "Entrar" : "Cargando…"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
