"use client";

import * as React from "react";
import {
  Compass,
  Loader2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface PanoramaScene {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
}

interface PanoramaViewerProps {
  scenes?: PanoramaScene[];
  propertyName: string;
}

const DEFAULT_PANORAMA_SCENES: PanoramaScene[] = [
  {
    id: "living",
    name: "Living & Dining Sky Lounge",
    category: "LIVING",
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80",
    description:
      "Floor-to-ceiling panoramic glass facade with natural sunlight and city skyline exposure.",
  },
  {
    id: "master",
    name: "Master Penthouse Suite",
    category: "BEDROOM",
    imageUrl:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2000&q=80",
    description:
      "King bedroom suite with acoustic glazing, warm recessed cove illumination, and en-suite bath.",
  },
  {
    id: "balcony",
    name: "Lanai Balcony & Sky Deck",
    category: "OUTDOOR",
    imageUrl:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=80",
    description:
      "Private outdoor viewing terrace with tempered glass balustrade and panoramic horizon breeze.",
  },
];

export function PanoramaViewer({
  scenes = DEFAULT_PANORAMA_SCENES,
  propertyName,
}: PanoramaViewerProps) {
  const [activeSceneIndex, setActiveSceneIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAutoRotating, setIsAutoRotating] = React.useState(true);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const activeScene = scenes[activeSceneIndex] ?? scenes[0]!;

  // Camera angles in radians
  const yawRef = React.useRef<number>(0);
  const pitchRef = React.useRef<number>(0);
  const fovRef = React.useRef<number>(Math.PI / 3); // 60 degrees

  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const startYRef = React.useRef(0);
  const startYawRef = React.useRef(0);
  const startPitchRef = React.useRef(0);
  const animationFrameIdRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl", { preserveDrawingBuffer: true }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      console.warn("WebGL not supported; falling back to static render.");
      setIsLoading(false);
      return;
    }

    // Shaders
    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_yaw;
      uniform float u_pitch;
      uniform float u_fov;

      const float PI = 3.141592653589793;

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
        float f = 1.0 / tan(u_fov * 0.5);
        vec3 ray = normalize(vec3(uv.x, uv.y, f));

        // Pitch rotation (X axis)
        float cp = cos(u_pitch);
        float sp = sin(u_pitch);
        vec3 r1 = vec3(ray.x, ray.y * cp - ray.z * sp, ray.y * sp + ray.z * cp);

        // Yaw rotation (Y axis)
        float cy = cos(u_yaw);
        float sy = sin(u_yaw);
        vec3 r2 = vec3(r1.x * cy + r1.z * sy, r1.y, -r1.x * sy + r1.z * cy);

        float lon = atan(r2.x, r2.z);
        float lat = asin(clamp(r2.y, -1.0, 1.0));

        vec2 texCoord = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);
        gl_FragColor = texture2D(u_texture, texCoord);
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, src: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, src);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error("Shader compile error:", glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Fullscreen quad buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uYaw = gl.getUniformLocation(program, "u_yaw");
    const uPitch = gl.getUniformLocation(program, "u_pitch");
    const uFov = gl.getUniformLocation(program, "u_fov");
    const uTexture = gl.getUniformLocation(program, "u_texture");

    // Texture setup
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Load Image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (isCancelled) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      setIsLoading(false);
    };
    img.onerror = () => {
      console.warn("Failed to load 360 panorama image:", activeScene.imageUrl);
      setIsLoading(false);
    };
    img.src = activeScene.imageUrl;

    // Render loop
    const render = () => {
      if (isCancelled) return;

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      if (isAutoRotating && !isDraggingRef.current) {
        yawRef.current += 0.0025; // Gentle smooth auto-pan
      }

      gl.useProgram(program);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uYaw, yawRef.current);
      gl.uniform1f(uPitch, pitchRef.current);
      gl.uniform1f(uFov, fovRef.current);
      gl.uniform1i(uTexture, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isCancelled = true;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [activeScene, isAutoRotating]);

  // Pointer Interaction Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    startXRef.current = clientX;
    startYRef.current = clientY;
    startYawRef.current = yawRef.current;
    startPitchRef.current = pitchRef.current;
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const deltaX = clientX - startXRef.current;
    const deltaY = clientY - startYRef.current;

    const sensitivity = 0.004;
    yawRef.current = startYawRef.current - deltaX * sensitivity;

    // Limit pitch to avoid flipping over pole (-80deg to +80deg)
    const maxPitch = (80 * Math.PI) / 180;
    pitchRef.current = Math.max(
      -maxPitch,
      Math.min(maxPitch, startPitchRef.current - deltaY * sensitivity)
    );
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleZoom = (inOrOut: "IN" | "OUT") => {
    const step = 0.1;
    const minFov = Math.PI / 6; // 30 deg
    const maxFov = Math.PI / 2.2; // 81 deg
    if (inOrOut === "IN") {
      fovRef.current = Math.max(minFov, fovRef.current - step);
    } else {
      fovRef.current = Math.min(maxFov, fovRef.current + step);
    }
  };

  const handleResetView = () => {
    yawRef.current = 0;
    pitchRef.current = 0;
    fovRef.current = Math.PI / 3;
  };

  return (
    <div className="space-y-3">
      {/* 360 Header & Room Scene Pills */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Badge variant="won" className="text-[10px] gap-1 px-2 py-0.5">
            <Compass className="h-3 w-3" /> 360° Virtual Photosphere
          </Badge>
          <span className="text-xs font-semibold text-foreground">
            {activeScene.name}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {scenes.map((scene, idx) => (
            <Button
              key={scene.id}
              type="button"
              size="sm"
              variant={activeSceneIndex === idx ? "default" : "outline"}
              className="h-7 text-xs px-2.5 gap-1"
              onClick={() => setActiveSceneIndex(idx)}
            >
              <span>{scene.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Interactive 360 Canvas Viewport */}
      <div
        className="relative h-80 sm:h-[420px] w-full overflow-hidden rounded-xl border border-slate-800 bg-[#070b14] select-none cursor-grab active:cursor-grabbing shadow-inner"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          if (touch) handlePointerDown(touch.clientX, touch.clientY);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          if (touch) handlePointerMove(touch.clientX, touch.clientY);
        }}
        onTouchEnd={handlePointerUp}
      >
        <canvas ref={canvasRef} className="h-full w-full block" />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs font-medium">Loading 360° Photosphere...</span>
          </div>
        )}

        {/* Top Floating Instruction Pill */}
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md shadow">
            <Compass className="h-3 w-3 text-sky-400" />
            Click &amp; drag mouse or swipe to look 360° around
          </span>
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/75 p-1.5 backdrop-blur-md shadow-lg border border-white/10">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-white hover:bg-white/20"
            title={isAutoRotating ? "Pause Auto-Rotate" : "Play Auto-Rotate"}
            onClick={() => setIsAutoRotating(!isAutoRotating)}
          >
            {isAutoRotating ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-white hover:bg-white/20"
            title="Zoom In"
            onClick={() => handleZoom("IN")}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-white hover:bg-white/20"
            title="Zoom Out"
            onClick={() => handleZoom("OUT")}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-white hover:bg-white/20"
            title="Reset Direction"
            onClick={handleResetView}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Scene Description Overlay */}
        <div className="absolute bottom-3 left-3 max-w-sm pointer-events-none hidden sm:block">
          <div className="rounded-lg bg-black/75 p-2.5 backdrop-blur-md text-white border border-white/10 space-y-0.5">
            <span className="text-[10px] font-bold text-primary block uppercase tracking-wider">
              {propertyName}
            </span>
            <p className="text-[11px] text-white/90 leading-tight">
              {activeScene.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
