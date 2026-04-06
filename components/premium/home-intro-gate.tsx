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

import { PropertyShell } from "./property-shell"

type HomeIntroGateProps = {
  content: ProjectContent
  facadeSections: FacadeSections
  gallerySections: GallerySections
}

type IntroState = "idle" | "playing" | "completed" | "error"

export function HomeIntroGate({
  content,
  facadeSections,
  gallerySections,
}: HomeIntroGateProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [introState, setIntroState] = useState<IntroState>("idle")
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [viewerCompletedCount, setViewerCompletedCount] = useState(0)
  const [hasViewerInitialFrame, setHasViewerInitialFrame] = useState(false)

  const isShellVisible =
    introState === "completed" || introState === "error"
  const isPlaying = introState === "playing"
  const minReadyFrames = Math.min(
    content.mainViewer.totalFrames,
    Math.max(12, content.mainViewer.autoplayMinReadyFrames)
  )
  const viewerReadinessPct = Math.round(
    Math.min(viewerCompletedCount, minReadyFrames) / minReadyFrames * 100
  )
  const introReadinessProgress = Math.round(
    viewerReadinessPct * 0.9 + (isVideoReady ? 10 : 0)
  )
  const isIntroReadyToStart =
    isVideoReady &&
    hasViewerInitialFrame &&
    viewerCompletedCount >= minReadyFrames

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
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
    const video = videoRef.current
    if (!video) {
      failOpen()
      return
    }

    if (!isIntroReadyToStart) {
      return
    }

    try {
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
          ref={videoRef}
          className="home-intro-video"
          muted
          playsInline
          preload="auto"
          onEnded={completeIntro}
          onError={failOpen}
          onLoadedMetadata={() => {
            setIsVideoReady(true)
          }}
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
            isPlaying && "home-intro-content-hidden"
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
              onClick={handleStart}
            >
              <Play data-icon="inline-start" />
              Iniciar
            </Button>
          </div>
        </div>

        {!isIntroReadyToStart ? (
          <div className="home-intro-loading-veil" aria-live="polite">
            <div className="home-intro-loading-card">
              <p className="home-intro-loading-label">
                Cargando intro y secuencia
              </p>
              <div
                className="home-intro-loading-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={introReadinessProgress}
              >
                <div
                  className="home-intro-loading-fill"
                  style={{ width: `${introReadinessProgress}%` }}
                />
              </div>
              <p className="home-intro-loading-value">
                {introReadinessProgress}%
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
