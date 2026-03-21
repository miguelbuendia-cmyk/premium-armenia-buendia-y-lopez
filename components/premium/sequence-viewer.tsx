"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { ViewerSequenceConfig } from "@/lib/premium-content"

type SequenceViewerProps = {
  config: ViewerSequenceConfig
  focusFrame?: number | null
  onFrameChange?: (frame: number) => void
}

export function SequenceViewer({
  config,
  focusFrame = null,
  onFrameChange,
}: SequenceViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    Array(config.totalFrames).fill(null)
  )
  const currentFrameRef = useRef(config.defaultFrame)
  const loadedCountRef = useRef(0)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartFrameRef = useRef(0)
  const motionRafRef = useRef(0)
  const previousFocusFrameRef = useRef<number | null>(focusFrame)

  const [loadedCount, setLoadedCount] = useState(0)
  const [hasInitialFrame, setHasInitialFrame] = useState(false)
  const [displayFrame, setDisplayFrame] = useState(config.defaultFrame)
  const [showHint, setShowHint] = useState(true)

  const loadingPct = useMemo(() => {
    return Math.round((loadedCount / config.totalFrames) * 100)
  }, [config.totalFrames, loadedCount])

  const clampFrame = useCallback(
    (frame: number) => {
      return (
        ((frame % config.totalFrames) + config.totalFrames) % config.totalFrames
      )
    },
    [config.totalFrames]
  )

  const getFrameUrl = useCallback((index: number) => {
    const padded = String(index).padStart(4, "0")
    const fileName = `360\u00B0.${padded}_resultado.webp`
    return `${config.framesDir}/${encodeURIComponent(fileName)}`
  }, [config.framesDir])

  const stopFrameAnimation = useCallback(() => {
    if (!motionRafRef.current) {
      return
    }

    window.cancelAnimationFrame(motionRafRef.current)
    motionRafRef.current = 0
  }, [])

  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current
    const image = imagesRef.current[frameIndex]
    if (!canvas || !image) {
      return
    }

    const context = canvas.getContext("2d")
    if (!context) {
      return
    }

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const width = Math.max(1, Math.floor(rect.width * dpr))
    const height = Math.max(1, Math.floor(rect.height * dpr))

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    context.clearRect(0, 0, canvas.width, canvas.height)

    const sourceInsetLeft = image.naturalWidth * config.sourceInsetLeft
    const sourceInsetRight = image.naturalWidth * config.sourceInsetRight
    const sourceX = Math.max(0, Math.floor(sourceInsetLeft))
    const sourceWidth = Math.max(
      1,
      Math.floor(image.naturalWidth - sourceInsetLeft - sourceInsetRight)
    )
    const sourceHeight = image.naturalHeight

    const coverScale =
      Math.max(canvas.width / sourceWidth, canvas.height / sourceHeight) *
      config.frameScale

    const drawWidth = sourceWidth * coverScale
    const drawHeight = sourceHeight * coverScale

    const x = (canvas.width - drawWidth) / 2
    const y = (canvas.height - drawHeight) / 2
    context.drawImage(
      image,
      sourceX,
      0,
      sourceWidth,
      sourceHeight,
      x,
      y,
      drawWidth,
      drawHeight
    )
  }, [config.frameScale, config.sourceInsetLeft, config.sourceInsetRight])

  const setFrame = useCallback((nextFrame: number) => {
    const normalized = clampFrame(nextFrame)
    currentFrameRef.current = normalized
    setDisplayFrame(normalized)

    const loadedImage = imagesRef.current[normalized]
    if (loadedImage) {
      drawFrame(normalized)
      return
    }

    for (let offset = 1; offset < config.totalFrames; offset += 1) {
      const fallbackRight = clampFrame(normalized + offset)
      if (imagesRef.current[fallbackRight]) {
        drawFrame(fallbackRight)
        return
      }

      const fallbackLeft = clampFrame(normalized - offset)
      if (imagesRef.current[fallbackLeft]) {
        drawFrame(fallbackLeft)
        return
      }
    }
  }, [clampFrame, config.totalFrames, drawFrame])

  const animateToFrame = useCallback((targetFrame: number, durationMs = 850) => {
    stopFrameAnimation()

    const startFrame = currentFrameRef.current
    const normalizedTarget = clampFrame(targetFrame)
    const forwardDistance =
      (normalizedTarget - startFrame + config.totalFrames) % config.totalFrames
    const backwardDistance = forwardDistance - config.totalFrames
    const shortestDistance =
      Math.abs(forwardDistance) <= Math.abs(backwardDistance)
        ? forwardDistance
        : backwardDistance

    if (shortestDistance === 0) {
      setFrame(normalizedTarget)
      return
    }

    let startTs = 0

    const tick = (timestamp: number) => {
      if (!startTs) {
        startTs = timestamp
      }

      const progress = Math.min(1, (timestamp - startTs) / durationMs)
      const eased = 1 - (1 - progress) ** 3
      const nextFrame = Math.round(startFrame + shortestDistance * eased)

      setFrame(nextFrame)

      if (progress < 1) {
        motionRafRef.current = window.requestAnimationFrame(tick)
      } else {
        motionRafRef.current = 0
      }
    }

    motionRafRef.current = window.requestAnimationFrame(tick)
  }, [clampFrame, config.totalFrames, setFrame, stopFrameAnimation])

  useEffect(() => {
    const hideHintTimer = window.setTimeout(() => {
      setShowHint(false)
    }, 5000)

    return () => {
      window.clearTimeout(hideHintTimer)
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    const loadFrame = (index: number) =>
      new Promise<boolean>((resolve) => {
        const image = new Image()
        image.decoding = "async"
        image.onload = () => {
          if (isCancelled) {
            resolve(false)
            return
          }

          imagesRef.current[index] = image
          loadedCountRef.current += 1
          setLoadedCount(loadedCountRef.current)

          if (index === config.defaultFrame) {
            setHasInitialFrame(true)
            drawFrame(config.defaultFrame)
          }

          resolve(true)
        }

        image.onerror = () => {
          resolve(false)
        }

        image.src = getFrameUrl(index)
      })

    const preloadInBatches = async () => {
      for (
        let start = 0;
        start < config.totalFrames;
        start += config.preloadBatchSize
      ) {
        if (isCancelled) {
          return
        }

        const batch = Array.from(
          {
            length: Math.min(config.preloadBatchSize, config.totalFrames - start),
          },
          (_, batchIndex) => loadFrame(start + batchIndex)
        )

        await Promise.all(batch)

        if (isCancelled) {
          return
        }

        await new Promise((resolve) =>
          window.setTimeout(resolve, config.preloadTickMs)
        )
      }
    }

    void preloadInBatches()

    return () => {
      isCancelled = true
    }
  }, [
    config.defaultFrame,
    config.preloadBatchSize,
    config.preloadTickMs,
    config.totalFrames,
    drawFrame,
    getFrameUrl,
  ])

  useEffect(() => {
    const onResize = () => {
      setFrame(currentFrameRef.current)
    }

    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener("resize", onResize)
    }
  }, [setFrame])

  useEffect(() => {
    if (!hasInitialFrame) {
      return
    }

    let rafId = 0
    let lastTs = 0
    let elapsed = 0
    const durationMs = 3600
    const targetTurn = config.totalFrames * config.autoplayTurns

    const animate = (timestamp: number) => {
      if (!lastTs) {
        lastTs = timestamp
      }

      const delta = timestamp - lastTs
      lastTs = timestamp
      elapsed += delta

      const progress = Math.min(1, elapsed / durationMs)
      const eased = 1 - (1 - progress) ** 3
      const targetFrame = Math.round(targetTurn * eased)

      setFrame(targetFrame)

      if (progress < 1) {
        rafId = window.requestAnimationFrame(animate)
      }
    }

    rafId = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(rafId)
    }
  }, [config.autoplayTurns, config.totalFrames, hasInitialFrame, setFrame])

  useEffect(() => {
    if (!hasInitialFrame) {
      return
    }

    if (focusFrame === previousFocusFrameRef.current) {
      return
    }

    previousFocusFrameRef.current = focusFrame
    const targetFrame = focusFrame ?? config.defaultFrame

    const frameId = window.requestAnimationFrame(() => {
      animateToFrame(targetFrame)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [
    animateToFrame,
    config.defaultFrame,
    focusFrame,
    hasInitialFrame,
  ])

  useEffect(() => {
    onFrameChange?.(displayFrame)
  }, [displayFrame, onFrameChange])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        stopFrameAnimation()
        setFrame(currentFrameRef.current + 1)
      }

      if (event.key === "ArrowLeft") {
        stopFrameAnimation()
        setFrame(currentFrameRef.current - 1)
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [setFrame, stopFrameAnimation])

  useEffect(() => {
    return () => {
      stopFrameAnimation()
    }
  }, [stopFrameAnimation])

  const handlePointerDown = (clientX: number) => {
    stopFrameAnimation()
    isDraggingRef.current = true
    dragStartXRef.current = clientX
    dragStartFrameRef.current = currentFrameRef.current
    setShowHint(false)
  }

  const handlePointerMove = (clientX: number) => {
    if (!isDraggingRef.current) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    const deltaX = clientX - dragStartXRef.current
    const frameDelta = Math.round(
      (deltaX / rect.width) * config.totalFrames * config.dragSensitivity
    )

    setFrame(dragStartFrameRef.current - frameDelta)
  }

  const handlePointerUp = () => {
    isDraggingRef.current = false
  }

  return (
    <div className="viewer-stage">
      <canvas
        ref={canvasRef}
        className="viewer-canvas"
        onMouseDown={(event) => handlePointerDown(event.clientX)}
        onMouseMove={(event) => handlePointerMove(event.clientX)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(event) => {
          if (!event.touches[0]) {
            return
          }

          handlePointerDown(event.touches[0].clientX)
        }}
        onTouchMove={(event) => {
          if (!event.touches[0]) {
            return
          }

          handlePointerMove(event.touches[0].clientX)
        }}
        onTouchEnd={handlePointerUp}
        onTouchCancel={handlePointerUp}
      />

      {!hasInitialFrame ? (
        <div className="viewer-loading-shell">
          <div className="viewer-loading-card">
            <p className="viewer-loading-label">Cargando secuencia</p>
            <div
              className="viewer-loading-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={loadingPct}
            >
              <div
                className="viewer-loading-fill"
                style={{ width: `${loadingPct}%` }}
              />
            </div>
            <p className="viewer-loading-value">{loadingPct}%</p>
          </div>
        </div>
      ) : null}

      {showHint && hasInitialFrame ? (
        <div className="viewer-hint">{config.dragHint}</div>
      ) : null}

      <div className="viewer-frame-counter">
        Frame {String(displayFrame).padStart(4, "0")}
      </div>
    </div>
  )
}
