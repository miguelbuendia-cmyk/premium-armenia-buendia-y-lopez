"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { ViewerSequenceConfig } from "@/lib/premium-content"

export type SequenceViewportGeometry = {
  x: number
  y: number
  width: number
  height: number
}

type SequenceViewerProps = {
  config: ViewerSequenceConfig
  focusFrame?: number | null
  onFrameChange?: (frame: number) => void
  onViewportGeometryChange?: (geometry: SequenceViewportGeometry | null) => void
}

export function SequenceViewer({
  config,
  focusFrame = null,
  onFrameChange,
  onViewportGeometryChange,
}: SequenceViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    Array(config.totalFrames).fill(null)
  )
  const currentFrameRef = useRef(config.defaultFrame)
  const virtualFrameRef = useRef(config.defaultFrame)
  const loadedCountRef = useRef(0)
  const failedCountRef = useRef(0)
  const loadedFramesRef = useRef<Set<number>>(new Set())
  const failedFramesRef = useRef<Set<number>>(new Set())
  const loadingFramesRef = useRef<Map<number, Promise<boolean>>>(new Map())
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartVirtualFrameRef = useRef(config.defaultFrame)
  const motionRafRef = useRef(0)
  const renderRafRef = useRef(0)
  const pendingVirtualFrameRef = useRef<number | null>(null)
  const previousFocusFrameRef = useRef<number | null>(null)
  const hasPlayedIntroRef = useRef(false)
  const introReadyCountRef = useRef(0)
  const loadFrameRef = useRef<(index: number) => Promise<boolean>>(async () => false)
  const geometrySignatureRef = useRef<string | null>(null)

  const [completedCount, setCompletedCount] = useState(0)
  const [hasInitialFrame, setHasInitialFrame] = useState(false)
  const [displayFrame, setDisplayFrame] = useState(config.defaultFrame)
  const [showHint, setShowHint] = useState(true)
  const [isIntroReady, setIsIntroReady] = useState(false)
  const [shouldSkipIntro, setShouldSkipIntro] = useState(false)

  const configSignature = useMemo(() => {
    return [
      config.framesDir,
      config.totalFrames,
      config.filePrefix,
      config.fileSuffix,
      config.padLength,
      config.defaultFrame,
    ].join("|")
  }, [
    config.defaultFrame,
    config.filePrefix,
    config.fileSuffix,
    config.framesDir,
    config.padLength,
    config.totalFrames,
  ])

  const loadingPct = useMemo(() => {
    return Math.round((completedCount / config.totalFrames) * 100)
  }, [completedCount, config.totalFrames])

  const introTargetFrame = useMemo(() => {
    return Math.max(0, Math.round(config.totalFrames * config.autoplayTurns))
  }, [config.autoplayTurns, config.totalFrames])

  const introFrames = useMemo(() => {
    const minReadyFrames = Math.max(1, config.autoplayMinReadyFrames)
    const lastIntroFrame = Math.min(
      config.totalFrames - 1,
      Math.max(introTargetFrame, minReadyFrames - 1)
    )

    return Array.from({ length: lastIntroFrame + 1 }, (_, index) => index)
  }, [config.autoplayMinReadyFrames, config.totalFrames, introTargetFrame])

  const introFrameSet = useMemo(() => {
    return new Set(introFrames)
  }, [introFrames])

  const normalizeVirtualFrame = useCallback(
    (frame: number) => {
      return (
        ((frame % config.totalFrames) + config.totalFrames) % config.totalFrames
      )
    },
    [config.totalFrames]
  )

  const clampFrame = useCallback(
    (frame: number) => {
      return normalizeVirtualFrame(Math.round(frame))
    },
    [normalizeVirtualFrame]
  )

  const getFrameUrl = useCallback(
    (index: number) => {
      const padded = String(index).padStart(config.padLength, "0")
      const normalizedPrefix = config.filePrefix.replace("Â°", "°")
      const fileName = `${normalizedPrefix}${padded}${config.fileSuffix}`
      return `${config.framesDir}/${encodeURIComponent(fileName)}`
    },
    [config.filePrefix, config.fileSuffix, config.framesDir, config.padLength]
  )

  const reportViewportGeometry = useCallback(
    (geometry: SequenceViewportGeometry | null) => {
      const nextSignature = geometry
        ? [geometry.x, geometry.y, geometry.width, geometry.height]
            .map((value) => value.toFixed(3))
            .join("|")
        : "null"

      if (geometrySignatureRef.current === nextSignature) {
        return
      }

      geometrySignatureRef.current = nextSignature
      onViewportGeometryChange?.(geometry)
    },
    [onViewportGeometryChange]
  )

  const stopFrameAnimation = useCallback(() => {
    if (!motionRafRef.current) {
      return
    }

    window.cancelAnimationFrame(motionRafRef.current)
    motionRafRef.current = 0
  }, [])

  const stopScheduledFrameCommit = useCallback(() => {
    if (renderRafRef.current) {
      window.cancelAnimationFrame(renderRafRef.current)
      renderRafRef.current = 0
    }
  }, [])

  const drawFrame = useCallback(
    (frameIndex: number) => {
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
      const cssWidth = Math.max(1, rect.width)
      const cssHeight = Math.max(1, rect.height)
      const width = Math.max(1, Math.floor(cssWidth * dpr))
      const height = Math.max(1, Math.floor(cssHeight * dpr))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, cssWidth, cssHeight)

      const sourceInsetLeft = image.naturalWidth * config.sourceInsetLeft
      const sourceInsetRight = image.naturalWidth * config.sourceInsetRight
      const sourceX = Math.max(0, sourceInsetLeft)
      const sourceWidth = Math.max(
        1,
        image.naturalWidth - sourceInsetLeft - sourceInsetRight
      )
      const sourceHeight = image.naturalHeight

      const coverScale =
        Math.max(cssWidth / sourceWidth, cssHeight / sourceHeight) *
        config.frameScale

      const drawWidth = sourceWidth * coverScale
      const drawHeight = sourceHeight * coverScale

      const x = (cssWidth - drawWidth) / 2
      const y = (cssHeight - drawHeight) / 2
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

      reportViewportGeometry({
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      })
    },
    [
      config.frameScale,
      config.sourceInsetLeft,
      config.sourceInsetRight,
      reportViewportGeometry,
    ]
  )

  const drawNearestLoadedFrame = useCallback(
    (frameIndex: number) => {
      const normalized = clampFrame(frameIndex)

      if (imagesRef.current[normalized]) {
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
    },
    [clampFrame, config.totalFrames, drawFrame]
  )

  const commitFramePosition = useCallback(
    (nextVirtualFrame: number) => {
      const normalizedVirtualFrame = normalizeVirtualFrame(nextVirtualFrame)
      const nextFrame = clampFrame(normalizedVirtualFrame)

      virtualFrameRef.current = normalizedVirtualFrame
      currentFrameRef.current = nextFrame
      setDisplayFrame((previousFrame) =>
        previousFrame === nextFrame ? previousFrame : nextFrame
      )
      drawNearestLoadedFrame(nextFrame)
    },
    [clampFrame, drawNearestLoadedFrame, normalizeVirtualFrame]
  )

  const scheduleFramePosition = useCallback(
    (nextVirtualFrame: number) => {
      pendingVirtualFrameRef.current = nextVirtualFrame

      if (renderRafRef.current) {
        return
      }

      renderRafRef.current = window.requestAnimationFrame(() => {
        renderRafRef.current = 0
        const pendingFrame = pendingVirtualFrameRef.current
        pendingVirtualFrameRef.current = null

        if (pendingFrame === null) {
          return
        }

        commitFramePosition(pendingFrame)
      })
    },
    [commitFramePosition]
  )

  const flushPendingFramePosition = useCallback(() => {
    const pendingFrame = pendingVirtualFrameRef.current
    pendingVirtualFrameRef.current = null
    stopScheduledFrameCommit()

    if (pendingFrame === null) {
      return
    }

    commitFramePosition(pendingFrame)
  }, [commitFramePosition, stopScheduledFrameCommit])

  const prioritizeFramesAround = useCallback(
    (centerFrame: number) => {
      const loadFrame = loadFrameRef.current
      if (!loadFrame) {
        return
      }

      const centerIndex = clampFrame(centerFrame)
      const preloadTargets = new Set<number>([centerIndex])

      for (let offset = 1; offset <= 3; offset += 1) {
        preloadTargets.add(clampFrame(centerIndex + offset))
        preloadTargets.add(clampFrame(centerIndex - offset))
      }

      for (const frameIndex of preloadTargets) {
        void loadFrame(frameIndex)
      }
    },
    [clampFrame]
  )

  const animateToFrame = useCallback(
    (targetFrame: number, durationMs = 850) => {
      stopFrameAnimation()
      stopScheduledFrameCommit()

      const startFrame = virtualFrameRef.current
      const normalizedTarget = clampFrame(targetFrame)
      const forwardDistance =
        (normalizedTarget - startFrame + config.totalFrames) % config.totalFrames
      const backwardDistance = forwardDistance - config.totalFrames
      const shortestDistance =
        Math.abs(forwardDistance) <= Math.abs(backwardDistance)
          ? forwardDistance
          : backwardDistance

      if (shortestDistance === 0) {
        commitFramePosition(normalizedTarget)
        return
      }

      prioritizeFramesAround(normalizedTarget)

      let startTs = 0

      const tick = (timestamp: number) => {
        if (!startTs) {
          startTs = timestamp
        }

        const progress = Math.min(1, (timestamp - startTs) / durationMs)
        const eased = 1 - (1 - progress) ** 3
        const nextFrame = startFrame + shortestDistance * eased

        commitFramePosition(nextFrame)
        prioritizeFramesAround(nextFrame)

        if (progress < 1) {
          motionRafRef.current = window.requestAnimationFrame(tick)
        } else {
          motionRafRef.current = 0
        }
      }

      motionRafRef.current = window.requestAnimationFrame(tick)
    },
    [
      clampFrame,
      commitFramePosition,
      config.totalFrames,
      prioritizeFramesAround,
      stopFrameAnimation,
      stopScheduledFrameCommit,
    ]
  )

  useEffect(() => {
    stopFrameAnimation()
    stopScheduledFrameCommit()

    imagesRef.current = Array(config.totalFrames).fill(null)
    currentFrameRef.current = config.defaultFrame
    virtualFrameRef.current = config.defaultFrame
    loadedCountRef.current = 0
    failedCountRef.current = 0
    loadedFramesRef.current = new Set()
    failedFramesRef.current = new Set()
    loadingFramesRef.current = new Map()
    isDraggingRef.current = false
    dragStartXRef.current = 0
    dragStartVirtualFrameRef.current = config.defaultFrame
    pendingVirtualFrameRef.current = null
    previousFocusFrameRef.current = null
    hasPlayedIntroRef.current = false
    introReadyCountRef.current = 0
    loadFrameRef.current = async () => false
    geometrySignatureRef.current = null

    const resetStateRaf = window.requestAnimationFrame(() => {
      setCompletedCount(0)
      setHasInitialFrame(false)
      setDisplayFrame(config.defaultFrame)
      setShowHint(true)
      setIsIntroReady(false)
      setShouldSkipIntro(false)
      reportViewportGeometry(null)
    })

    return () => {
      window.cancelAnimationFrame(resetStateRaf)
    }
  }, [
    config.defaultFrame,
    config.totalFrames,
    configSignature,
    stopFrameAnimation,
    stopScheduledFrameCommit,
    reportViewportGeometry,
  ])

  useEffect(() => {
    if (!showHint) {
      return
    }

    const hideHintTimer = window.setTimeout(() => {
      setShowHint(false)
    }, 5000)

    return () => {
      window.clearTimeout(hideHintTimer)
    }
  }, [showHint])

  useEffect(() => {
    let isCancelled = false

    const bumpCompletedCount = () => {
      const nextCount = loadedCountRef.current + failedCountRef.current
      setCompletedCount(nextCount)
    }

    const loadFrame = (index: number) => {
      const normalizedIndex = clampFrame(index)

      if (imagesRef.current[normalizedIndex]) {
        return Promise.resolve(true)
      }

      if (failedFramesRef.current.has(normalizedIndex)) {
        return Promise.resolve(false)
      }

      const pendingLoad = loadingFramesRef.current.get(normalizedIndex)
      if (pendingLoad) {
        return pendingLoad
      }

      const image = new Image()
      image.decoding = "async"

      const loadPromise = new Promise<boolean>((resolve) => {
        const finalize = (result: boolean) => {
          loadingFramesRef.current.delete(normalizedIndex)
          resolve(result)
        }

        image.onload = () => {
          if (isCancelled) {
            finalize(false)
            return
          }

          if (!imagesRef.current[normalizedIndex]) {
            imagesRef.current[normalizedIndex] = image
            loadedCountRef.current += 1
            loadedFramesRef.current.add(normalizedIndex)
            bumpCompletedCount()

            if (introFrameSet.has(normalizedIndex)) {
              introReadyCountRef.current += 1

              if (introReadyCountRef.current >= introFrames.length) {
                setIsIntroReady(true)
              }
            }
          }

          if (normalizedIndex === config.defaultFrame) {
            setHasInitialFrame(true)
            commitFramePosition(virtualFrameRef.current)
          } else if (normalizedIndex === currentFrameRef.current) {
            drawNearestLoadedFrame(normalizedIndex)
          }

          finalize(true)
        }

        image.onerror = () => {
          if (
            !isCancelled &&
            !failedFramesRef.current.has(normalizedIndex) &&
            !imagesRef.current[normalizedIndex]
          ) {
            failedCountRef.current += 1
            failedFramesRef.current.add(normalizedIndex)
            bumpCompletedCount()

            if (introFrameSet.has(normalizedIndex)) {
              setShouldSkipIntro(true)
            }
          }

          finalize(false)
        }

        image.src = getFrameUrl(normalizedIndex)
      })

      loadingFramesRef.current.set(normalizedIndex, loadPromise)
      return loadPromise
    }

    loadFrameRef.current = loadFrame
    prioritizeFramesAround(config.defaultFrame)

    const remainingFrames = Array.from(
      new Set(
        Array.from({ length: config.totalFrames }, (_, offset) => {
          if (offset === 0) {
            return config.defaultFrame
          }

          const direction = offset % 2 === 1 ? 1 : -1
          const distance = Math.ceil(offset / 2)
          return clampFrame(config.defaultFrame + direction * distance)
        })
      )
    ).filter((frameIndex) => !introFrameSet.has(frameIndex))

    const preloadOrder = [...introFrames, ...remainingFrames]

    const preloadInBatches = async () => {
      for (
        let start = 0;
        start < preloadOrder.length;
        start += config.preloadBatchSize
      ) {
        if (isCancelled) {
          return
        }

        const batch = preloadOrder
          .slice(start, start + config.preloadBatchSize)
          .map((frameIndex) => loadFrame(frameIndex))

        await Promise.all(batch)

        if (isCancelled) {
          return
        }

        prioritizeFramesAround(virtualFrameRef.current)

        await new Promise((resolve) =>
          window.setTimeout(resolve, config.preloadTickMs)
        )
      }
    }

    void preloadInBatches()

    return () => {
      isCancelled = true
      loadFrameRef.current = async () => false
    }
  }, [
    clampFrame,
    commitFramePosition,
    config.defaultFrame,
    config.preloadBatchSize,
    config.preloadTickMs,
    config.totalFrames,
    drawNearestLoadedFrame,
    getFrameUrl,
    introFrameSet,
    introFrames,
    prioritizeFramesAround,
  ])

  useEffect(() => {
    const onResize = () => {
      commitFramePosition(virtualFrameRef.current)
    }

    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener("resize", onResize)
    }
  }, [commitFramePosition])

  useEffect(() => {
    if (!hasInitialFrame || hasPlayedIntroRef.current) {
      return
    }

    if (config.autoplayTurns <= 0) {
      return
    }

    if (focusFrame !== null || isDraggingRef.current) {
      return
    }

    if (!isIntroReady) {
      if (shouldSkipIntro) {
        hasPlayedIntroRef.current = true
      }
      return
    }

    hasPlayedIntroRef.current = true
    let rafId = 0
    let lastTs = 0
    let elapsed = 0
    const durationMs = 2600

    const animate = (timestamp: number) => {
      if (!lastTs) {
        lastTs = timestamp
      }

      const delta = timestamp - lastTs
      lastTs = timestamp
      elapsed += delta

      const progress = Math.min(1, elapsed / durationMs)
      const eased = 1 - (1 - progress) ** 3
      const targetFrame = introTargetFrame * eased

      commitFramePosition(targetFrame)
      prioritizeFramesAround(targetFrame)

      if (progress < 1) {
        rafId = window.requestAnimationFrame(animate)
      }
    }

    rafId = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(rafId)
    }
  }, [
    commitFramePosition,
    config.autoplayTurns,
    focusFrame,
    hasInitialFrame,
    introTargetFrame,
    isIntroReady,
    prioritizeFramesAround,
    shouldSkipIntro,
  ])

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
  }, [animateToFrame, config.defaultFrame, focusFrame, hasInitialFrame])

  useEffect(() => {
    onFrameChange?.(displayFrame)
  }, [displayFrame, onFrameChange])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        stopFrameAnimation()
        flushPendingFramePosition()
        commitFramePosition(virtualFrameRef.current + 1)
        prioritizeFramesAround(virtualFrameRef.current)
      }

      if (event.key === "ArrowLeft") {
        stopFrameAnimation()
        flushPendingFramePosition()
        commitFramePosition(virtualFrameRef.current - 1)
        prioritizeFramesAround(virtualFrameRef.current)
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [
    commitFramePosition,
    flushPendingFramePosition,
    prioritizeFramesAround,
    stopFrameAnimation,
  ])

  useEffect(() => {
    return () => {
      stopFrameAnimation()
      stopScheduledFrameCommit()
      reportViewportGeometry(null)
    }
  }, [reportViewportGeometry, stopFrameAnimation, stopScheduledFrameCommit])

  const handlePointerDown = (clientX: number) => {
    stopFrameAnimation()
    flushPendingFramePosition()
    isDraggingRef.current = true
    dragStartXRef.current = clientX
    dragStartVirtualFrameRef.current = virtualFrameRef.current
    setShowHint(false)
    prioritizeFramesAround(virtualFrameRef.current)
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
    const frameDelta =
      (deltaX / Math.max(rect.width, 1)) *
      config.totalFrames *
      config.dragSensitivity

    const nextVirtualFrame = dragStartVirtualFrameRef.current - frameDelta
    prioritizeFramesAround(nextVirtualFrame)
    scheduleFramePosition(nextVirtualFrame)
  }

  const handlePointerUp = () => {
    if (!isDraggingRef.current) {
      return
    }

    isDraggingRef.current = false
    flushPendingFramePosition()
    prioritizeFramesAround(virtualFrameRef.current)
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
    </div>
  )
}
