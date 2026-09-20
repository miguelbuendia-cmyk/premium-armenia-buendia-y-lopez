"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ApartmentTour, TourSpace } from "@/lib/tours"

type PanoTourProps = {
  tour: ApartmentTour
}

const DEG = Math.PI / 180
const DEFAULT_FOV = 75
const MIN_FOV = 35
const MAX_FOV = 95

const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vNdc;
void main() {
  vNdc = aPosition;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;
varying vec2 vNdc;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uMix;
uniform vec3 uForwardA;
uniform vec3 uRightA;
uniform vec3 uUpA;
uniform vec2 uTanA;
uniform vec3 uForwardB;
uniform vec3 uRightB;
uniform vec3 uUpB;
uniform vec2 uTanB;

const float PI = 3.14159265358979;

vec4 samplePano(sampler2D tex, vec3 forward, vec3 right, vec3 up, vec2 tanFov) {
  vec3 dir = normalize(forward + vNdc.x * tanFov.x * right + vNdc.y * tanFov.y * up);
  float lon = atan(dir.x, -dir.z);
  float lat = asin(clamp(dir.y, -1.0, 1.0));
  vec2 uv = vec2(0.5 + lon / (2.0 * PI), 0.5 - lat / PI);
  return texture2D(tex, uv);
}

void main() {
  vec4 colorA = samplePano(uTexA, uForwardA, uRightA, uUpA, uTanA);
  if (uMix <= 0.001) {
    gl_FragColor = colorA;
    return;
  }
  vec4 colorB = samplePano(uTexB, uForwardB, uRightB, uUpB, uTanB);
  gl_FragColor = mix(colorA, colorB, uMix);
}
`

type Camera = {
  yaw: number
  pitch: number
  fov: number
}

type FullTexture = {
  texture: WebGLTexture
  lastUsed: number
}

function dirFromAngles(yawDeg: number, pitchDeg: number) {
  const yaw = yawDeg * DEG
  const pitch = pitchDeg * DEG
  const cosPitch = Math.cos(pitch)
  return [
    Math.sin(yaw) * cosPitch,
    Math.sin(pitch),
    -Math.cos(yaw) * cosPitch,
  ] as const
}

function cameraBasis(camera: Camera, aspect: number) {
  const forward = dirFromAngles(camera.yaw, camera.pitch)
  const yaw = camera.yaw * DEG
  const right = [Math.cos(yaw), 0, Math.sin(yaw)] as const
  const up = [
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0],
  ] as const
  const tanV = Math.tan((camera.fov / 2) * DEG)
  const tanH = tanV * aspect
  return { forward, right, up, tanH, tanV }
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function shortestYawDelta(from: number, to: number) {
  let delta = (to - from) % 360
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return delta
}

export function PanoTour({ tour }: PanoTourProps) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const hotspotRefs = useRef(new Map<string, HTMLButtonElement>())

  const [spaceId, setSpaceId] = useState(tour.start)
  const [ready, setReady] = useState(false)
  const [interacted, setInteracted] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  const currentSpace =
    tour.spaces.find((space) => space.id === spaceId) ?? tour.spaces[0]

  const viewerRef = useRef<{
    goTo: (target: string) => void
  } | null>(null)

  const spaceIdRef = useRef(spaceId)
  spaceIdRef.current = spaceId

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage) return

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
    })
    if (!gl) return

    let disposed = false

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) throw new Error("No se pudo crear el shader")
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) ?? "Error de shader")
      }
      return shader
    }

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER))
    gl.linkProgram(program)
    gl.useProgram(program)

    const quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    )
    const aPosition = gl.getAttribLocation(program, "aPosition")
    gl.enableVertexAttribArray(aPosition)
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

    const uniforms = {
      texA: gl.getUniformLocation(program, "uTexA"),
      texB: gl.getUniformLocation(program, "uTexB"),
      mix: gl.getUniformLocation(program, "uMix"),
      forwardA: gl.getUniformLocation(program, "uForwardA"),
      rightA: gl.getUniformLocation(program, "uRightA"),
      upA: gl.getUniformLocation(program, "uUpA"),
      tanA: gl.getUniformLocation(program, "uTanA"),
      forwardB: gl.getUniformLocation(program, "uForwardB"),
      rightB: gl.getUniformLocation(program, "uRightB"),
      upB: gl.getUniformLocation(program, "uUpB"),
      tanB: gl.getUniformLocation(program, "uTanB"),
    }
    gl.uniform1i(uniforms.texA, 0)
    gl.uniform1i(uniforms.texB, 1)

    // 8K textures only make sense on large screens and need a GPU that
    // accepts 8192px textures; everything else gets the 4K variant.
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
    const isDesktop =
      window.matchMedia("(min-width: 900px)").matches &&
      !window.matchMedia("(pointer: coarse)").matches
    const useHiRes = maxTextureSize >= 8192 && isDesktop
    const fullSrc = (space: TourSpace) =>
      useHiRes ? space.image : space.image4k
    const MAX_FULL_TEXTURES = useHiRes ? 3 : 4

    const previews = new Map<string, WebGLTexture>()
    const fulls = new Map<string, FullTexture>()
    const pendingFull = new Map<string, Promise<WebGLTexture | null>>()
    const pendingPreview = new Map<string, Promise<WebGLTexture | null>>()

    const isPowerOfTwo = (value: number) => (value & (value - 1)) === 0

    const uploadTexture = (image: HTMLImageElement) => {
      const texture = gl.createTexture()
      if (!texture) throw new Error("No se pudo crear la textura")
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      if (isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D)
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          gl.LINEAR_MIPMAP_LINEAR
        )
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      }
      return texture
    }

    const loadImage = async (src: string) => {
      const image = new Image()
      const loaded = new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
      })
      image.src = src
      try {
        // Off-main-thread decode when the browser supports it for this size.
        await image.decode()
      } catch {
        await loaded
      }
      return image
    }

    const ensurePreview = (space: TourSpace) => {
      const cached = previews.get(space.id)
      if (cached) return Promise.resolve(cached)
      const pending = pendingPreview.get(space.id)
      if (pending) return pending
      const promise = loadImage(space.preview)
        .then((image) => {
          if (disposed) return null
          const texture = uploadTexture(image)
          previews.set(space.id, texture)
          return texture
        })
        .catch(() => null)
        .finally(() => pendingPreview.delete(space.id))
      pendingPreview.set(space.id, promise)
      return promise
    }

    const evictFullTextures = (keep: string[]) => {
      while (fulls.size > MAX_FULL_TEXTURES) {
        let victim: string | null = null
        let oldest = Infinity
        fulls.forEach((entry, id) => {
          if (keep.includes(id)) return
          if (entry.lastUsed < oldest) {
            oldest = entry.lastUsed
            victim = id
          }
        })
        if (!victim) break
        const entry = fulls.get(victim)
        if (entry) gl.deleteTexture(entry.texture)
        fulls.delete(victim)
      }
    }

    const ensureFull = (space: TourSpace) => {
      const cached = fulls.get(space.id)
      if (cached) {
        cached.lastUsed = performance.now()
        return Promise.resolve(cached.texture)
      }
      const pending = pendingFull.get(space.id)
      if (pending) return pending
      const promise = loadImage(fullSrc(space))
        .then((image) => {
          if (disposed) return null
          const texture = uploadTexture(image)
          fulls.set(space.id, { texture, lastUsed: performance.now() })
          evictFullTextures([
            spaceIdRef.current,
            state.transition?.targetSpace.id ?? "",
          ])
          return texture
        })
        .catch(() => null)
        .finally(() => pendingFull.delete(space.id))
      pendingFull.set(space.id, promise)
      return promise
    }

    // Warm the browser cache with the other spaces so later navigations
    // decode straight from disk instead of the network.
    const prefetchFull = async (spaces: TourSpace[]) => {
      for (const space of spaces) {
        if (disposed) return
        try {
          const response = await fetch(fullSrc(space))
          await response.arrayBuffer()
        } catch {
          // best effort only
        }
      }
    }

    const bestTexture = (id: string) =>
      fulls.get(id)?.texture ?? previews.get(id) ?? null

    // Deep links: /tour/tipo-6?espacio=bano&yaw=90&pitch=-20
    const params = new URLSearchParams(window.location.search)
    const requestedSpace = tour.spaces.find(
      (space) => space.id === params.get("espacio")
    )
    if (requestedSpace && requestedSpace.id !== spaceIdRef.current) {
      spaceIdRef.current = requestedSpace.id
      setSpaceId(requestedSpace.id)
    }
    const paramYaw = Number(params.get("yaw"))
    const paramPitch = Number(params.get("pitch"))

    const camera: Camera = {
      yaw: params.has("yaw")
        ? paramYaw
        : (tour.spaces.find((space) => space.id === spaceIdRef.current)
            ?.initialYaw ?? 0),
      pitch: params.has("pitch") ? Math.max(-85, Math.min(85, paramPitch)) : 0,
      fov: DEFAULT_FOV,
    }

    const state = {
      dragging: false,
      pointerId: -1,
      lastX: 0,
      lastY: 0,
      velocityYaw: 0,
      velocityPitch: 0,
      autoPan: !params.has("yaw"),
      transition: null as null | {
        start: number
        zoomDuration: number
        fadeDuration: number
        fromYaw: number
        fromPitch: number
        fromFov: number
        aimYaw: number
        aimPitch: number
        targetSpace: TourSpace
        phase: "zoom" | "wait" | "fade"
        cameraB: Camera
        texB: WebGLTexture | null
      },
      pinchDistance: 0,
      pointers: new Map<number, { x: number; y: number }>(),
    }

    let raf = 0
    let width = 1
    let height = 1
    let aspect = 1

    const resize = () => {
      const rect = stage.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, Math.round(rect.width * dpr))
      height = Math.max(1, Math.round(rect.height * dpr))
      canvas.width = width
      canvas.height = height
      aspect = rect.width / Math.max(rect.height, 1)
      gl.viewport(0, 0, width, height)
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(stage)

    const setBasisUniforms = (cam: Camera, slot: "A" | "B") => {
      const basis = cameraBasis(cam, aspect)
      if (slot === "A") {
        gl.uniform3fv(uniforms.forwardA, basis.forward as unknown as Float32Array)
        gl.uniform3fv(uniforms.rightA, basis.right as unknown as Float32Array)
        gl.uniform3fv(uniforms.upA, basis.up as unknown as Float32Array)
        gl.uniform2f(uniforms.tanA, basis.tanH, basis.tanV)
      } else {
        gl.uniform3fv(uniforms.forwardB, basis.forward as unknown as Float32Array)
        gl.uniform3fv(uniforms.rightB, basis.right as unknown as Float32Array)
        gl.uniform3fv(uniforms.upB, basis.up as unknown as Float32Array)
        gl.uniform2f(uniforms.tanB, basis.tanH, basis.tanV)
      }
    }

    const updateHotspots = () => {
      const rect = stage.getBoundingClientRect()
      const basis = cameraBasis(camera, aspect)
      hotspotRefs.current.forEach((element) => {
        const yaw = Number(element.dataset.yaw)
        const pitch = Number(element.dataset.pitch)
        const world = dirFromAngles(yaw, pitch)
        const z =
          world[0] * basis.forward[0] +
          world[1] * basis.forward[1] +
          world[2] * basis.forward[2]
        if (z <= 0.1) {
          element.style.opacity = "0"
          element.style.pointerEvents = "none"
          return
        }
        const x =
          (world[0] * basis.right[0] +
            world[1] * basis.right[1] +
            world[2] * basis.right[2]) /
          (z * basis.tanH)
        const y =
          (world[0] * basis.up[0] +
            world[1] * basis.up[1] +
            world[2] * basis.up[2]) /
          (z * basis.tanV)
        if (Math.abs(x) > 1.2 || Math.abs(y) > 1.2) {
          element.style.opacity = "0"
          element.style.pointerEvents = "none"
          return
        }
        const screenX = (0.5 + x / 2) * rect.width
        const screenY = (0.5 - y / 2) * rect.height
        element.style.opacity = "1"
        element.style.pointerEvents = "auto"
        element.style.transform = `translate(-50%, -50%) translate(${screenX}px, ${screenY}px)`
      })
    }

    let mixValue = 0

    const render = (time: number) => {
      raf = requestAnimationFrame(render)

      const transition = state.transition
      if (transition) {
        const elapsed = time - transition.start
        if (transition.phase === "zoom") {
          const t = Math.min(elapsed / transition.zoomDuration, 1)
          const eased = easeInOut(t)
          camera.yaw =
            transition.fromYaw +
            shortestYawDelta(transition.fromYaw, transition.aimYaw) * eased
          camera.pitch =
            transition.fromPitch +
            (transition.aimPitch - transition.fromPitch) * eased
          camera.fov =
            transition.fromFov +
            (transition.fromFov * 0.62 - transition.fromFov) * eased
          if (t >= 1) {
            transition.phase = "wait"
          }
        }
        if (transition.phase === "wait") {
          const texture = bestTexture(transition.targetSpace.id)
          if (texture) {
            transition.texB = texture
            transition.phase = "fade"
            transition.start = time
          }
        } else if (transition.phase === "fade") {
          const t = Math.min(elapsed / transition.fadeDuration, 1)
          mixValue = easeInOut(t)
          const settle = easeOut(t)
          transition.cameraB.fov = 64 + (DEFAULT_FOV - 64) * settle
          if (t >= 1) {
            camera.yaw = transition.cameraB.yaw
            camera.pitch = transition.cameraB.pitch
            camera.fov = transition.cameraB.fov
            mixValue = 0
            state.transition = null
            setTransitioning(false)
            setSpaceId(transition.targetSpace.id)
            spaceIdRef.current = transition.targetSpace.id
            evictFullTextures([transition.targetSpace.id])
          }
        }
      } else {
        if (state.autoPan && !state.dragging) {
          camera.yaw += 0.018
        }
        if (!state.dragging) {
          camera.yaw += state.velocityYaw
          camera.pitch += state.velocityPitch
          camera.pitch = Math.max(-85, Math.min(85, camera.pitch))
          state.velocityYaw *= 0.94
          state.velocityPitch *= 0.94
        }
      }

      const currentTexture = bestTexture(spaceIdRef.current)
      if (!currentTexture) return
      const fadeTexture =
        state.transition?.phase === "fade" ? state.transition.texB : null

      setBasisUniforms(camera, "A")
      if (state.transition?.phase === "fade") {
        setBasisUniforms(state.transition.cameraB, "B")
      }
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, fadeTexture ?? currentTexture)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, currentTexture)
      gl.uniform1f(uniforms.mix, mixValue)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      updateHotspots()
    }

    const degPerPixel = () => camera.fov / stage.getBoundingClientRect().height

    const onPointerDown = (event: PointerEvent) => {
      if (state.transition) return
      if ((event.target as Element | null)?.closest("button")) return
      state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (state.pointers.size === 2) {
        const [p1, p2] = [...state.pointers.values()]
        state.pinchDistance = Math.hypot(p1.x - p2.x, p1.y - p2.y)
        state.dragging = false
        return
      }
      state.dragging = true
      state.pointerId = event.pointerId
      state.lastX = event.clientX
      state.lastY = event.clientY
      state.velocityYaw = 0
      state.velocityPitch = 0
      state.autoPan = false
      setInteracted(true)
      try {
        stage.setPointerCapture(event.pointerId)
      } catch {
        // pointer id no longer active (e.g. synthetic events)
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      const pointer = state.pointers.get(event.pointerId)
      if (pointer) {
        pointer.x = event.clientX
        pointer.y = event.clientY
      }
      if (state.pointers.size === 2) {
        const [p1, p2] = [...state.pointers.values()]
        const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y)
        if (state.pinchDistance > 0) {
          const scale = state.pinchDistance / Math.max(distance, 1)
          camera.fov = Math.max(MIN_FOV, Math.min(MAX_FOV, camera.fov * scale))
        }
        state.pinchDistance = distance
        return
      }
      if (!state.dragging || event.pointerId !== state.pointerId) return
      const factor = degPerPixel()
      const deltaX = event.clientX - state.lastX
      const deltaY = event.clientY - state.lastY
      camera.yaw -= deltaX * factor
      camera.pitch += deltaY * factor
      camera.pitch = Math.max(-85, Math.min(85, camera.pitch))
      state.velocityYaw = -deltaX * factor * 0.55
      state.velocityPitch = deltaY * factor * 0.55
      state.lastX = event.clientX
      state.lastY = event.clientY
    }

    const onPointerUp = (event: PointerEvent) => {
      state.pointers.delete(event.pointerId)
      if (state.pointers.size < 2) state.pinchDistance = 0
      if (event.pointerId === state.pointerId) {
        state.dragging = false
        state.pointerId = -1
      }
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      state.autoPan = false
      setInteracted(true)
      camera.fov = Math.max(
        MIN_FOV,
        Math.min(MAX_FOV, camera.fov + event.deltaY * 0.045)
      )
    }

    stage.addEventListener("pointerdown", onPointerDown)
    stage.addEventListener("pointermove", onPointerMove)
    stage.addEventListener("pointerup", onPointerUp)
    stage.addEventListener("pointercancel", onPointerUp)
    stage.addEventListener("wheel", onWheel, { passive: false })

    const startSpace =
      tour.spaces.find((space) => space.id === spaceIdRef.current) ??
      tour.spaces[0]
    const otherSpaces = tour.spaces.filter((space) => space.id !== startSpace.id)

    ensurePreview(startSpace).then((texture) => {
      if (disposed || !texture) return
      setReady(true)
      raf = requestAnimationFrame(render)
      ensureFull(startSpace).then(() => {
        if (disposed) return
        Promise.all(otherSpaces.map(ensurePreview)).then(() =>
          prefetchFull(otherSpaces)
        )
      })
    })

    viewerRef.current = {
      goTo: (targetId: string) => {
        if (state.transition) return
        const activeSpace =
          tour.spaces.find((space) => space.id === spaceIdRef.current) ??
          tour.spaces[0]
        if (targetId === activeSpace.id) return
        const targetSpace = tour.spaces.find((space) => space.id === targetId)
        if (!targetSpace) return
        const hotspot = activeSpace.hotspots.find(
          (item) => item.target === targetId
        )
        state.autoPan = false
        state.velocityYaw = 0
        state.velocityPitch = 0
        setInteracted(true)
        setTransitioning(true)
        ensurePreview(targetSpace)
        ensureFull(targetSpace).then((texture) => {
          // Sharpen in place if the fade already ran on the preview.
          if (disposed || !texture) return
          const active = state.transition
          if (active?.targetSpace.id === targetSpace.id && active.phase === "fade") {
            active.texB = texture
          }
        })
        state.transition = {
          start: performance.now(),
          zoomDuration: hotspot ? 460 : 120,
          fadeDuration: 480,
          fromYaw: camera.yaw,
          fromPitch: camera.pitch,
          fromFov: camera.fov,
          aimYaw: hotspot ? hotspot.yaw : camera.yaw,
          aimPitch: hotspot ? hotspot.pitch * 0.5 : camera.pitch,
          targetSpace,
          phase: "zoom",
          cameraB: {
            yaw: targetSpace.initialYaw,
            pitch: 0,
            fov: 64,
          },
          texB: null,
        }
      },
    }

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      stage.removeEventListener("pointerdown", onPointerDown)
      stage.removeEventListener("pointermove", onPointerMove)
      stage.removeEventListener("pointerup", onPointerUp)
      stage.removeEventListener("pointercancel", onPointerUp)
      stage.removeEventListener("wheel", onWheel)
      previews.forEach((texture) => gl.deleteTexture(texture))
      fulls.forEach((entry) => gl.deleteTexture(entry.texture))
      viewerRef.current = null
    }
  }, [tour])

  const goTo = useCallback((targetId: string) => {
    viewerRef.current?.goTo(targetId)
  }, [])

  // "Volver" siempre regresa al explorador de plantas, con el piso y la
  // unidad desde donde se abrió el tour cuando vienen en la URL.
  const handleBack = useCallback(() => {
    const params = new URLSearchParams(window.location.search)
    const target = new URLSearchParams()
    target.set("plantas", params.get("piso") ?? "")
    const unitCode = params.get("unidad")
    if (unitCode) target.set("unidad", unitCode)
    router.push(`/?${target.toString()}`)
  }, [router])

  const registerHotspot = useCallback(
    (key: string) => (element: HTMLButtonElement | null) => {
      if (element) {
        hotspotRefs.current.set(key, element)
      } else {
        hotspotRefs.current.delete(key)
      }
    },
    []
  )

  return (
    <div className="pano-tour" ref={stageRef}>
      <canvas ref={canvasRef} className="pano-tour-canvas" />

      {!ready && (
        <div className="pano-tour-loading">
          <span className="pano-tour-loading-ring" />
          <span>Cargando recorrido…</span>
        </div>
      )}

      <div className="pano-tour-topbar">
        <button
          type="button"
          className="pano-tour-back"
          onClick={handleBack}
          aria-label="Volver"
        >
          <ArrowLeft />
          <span>Volver</span>
        </button>
        <div className="pano-tour-title">
          <span className="pano-tour-title-kicker">Tour virtual 360°</span>
          <strong>{tour.title}</strong>
        </div>
      </div>

      {currentSpace.hotspots.map((hotspot) => {
        const target = tour.spaces.find((space) => space.id === hotspot.target)
        if (!target) return null
        return (
          <button
            key={`${currentSpace.id}-${hotspot.target}`}
            ref={registerHotspot(`${currentSpace.id}-${hotspot.target}`)}
            type="button"
            className="pano-tour-hotspot"
            data-yaw={hotspot.yaw}
            data-pitch={hotspot.pitch}
            onClick={() => goTo(hotspot.target)}
            disabled={transitioning}
          >
            <span className="pano-tour-hotspot-floor">
              <span className="pano-tour-hotspot-circle" />
            </span>
            <span className="pano-tour-hotspot-label">{target.name}</span>
          </button>
        )
      })}

      {ready && !interacted && (
        <p className="pano-tour-hint">Arrastra para mirar alrededor</p>
      )}

      <nav className="pano-tour-spaces" aria-label="Espacios del recorrido">
        {tour.spaces.map((space) => (
          <button
            key={space.id}
            type="button"
            className={cn(
              "pano-tour-space-chip",
              space.id === currentSpace.id && "pano-tour-space-chip-active"
            )}
            onClick={() => goTo(space.id)}
            disabled={transitioning}
          >
            {space.name}
          </button>
        ))}
      </nav>
    </div>
  )
}
