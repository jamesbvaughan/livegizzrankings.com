"use client";

import { useEffect, useRef } from "react";

const numSides = 9;
const lineThickness = 2;
const spinSpeed = 15;

const minShadowBlur = 5;
const maxShadowBlur = 40;

const padding = 12;

function drawNonagon(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  vertices: Array<{ x: number; y: number }>,
  centerX: number,
  centerY: number,
  radius: number,
  rotation: number,
  shadowBlur: number,
) {
  ctx.strokeStyle = "red";
  ctx.lineWidth = lineThickness;
  ctx.shadowColor = "red";
  ctx.shadowBlur = shadowBlur;

  for (let i = 0; i < numSides; i++) {
    const angle = ((2 * Math.PI) / numSides) * i - Math.PI / 2 + rotation;
    vertices[i].x = centerX + radius * Math.cos(angle);
    vertices[i].y = centerY + radius * Math.sin(angle);
  }

  ctx.beginPath();
  for (let i = 0; i < numSides - 1; i++) {
    for (let j = i + 1; j < numSides; j++) {
      ctx.moveTo(vertices[i].x, vertices[i].y);
      ctx.lineTo(vertices[j].x, vertices[j].y);
    }
  }
  ctx.closePath();
  ctx.stroke();
}

export default function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<OffscreenCanvas>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!offscreenCanvasRef.current) {
      try {
        offscreenCanvasRef.current = canvas.transferControlToOffscreen();
      } catch (error) {
        reportError(error);
        // Return a no-op cleanup so all code paths consistently return one
        return () => {};
      }
    }
    const offscreenCanvas = offscreenCanvasRef.current;
    const ctx = offscreenCanvas.getContext("2d")!;

    const vertices: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < numSides; i++) {
      vertices[i] = { x: 0, y: 0 };
    }

    let cssWidth: number;
    let cssHeight: number;
    let dpr: number;
    function resizeCanvas() {
      dpr = window.devicePixelRatio || 1;

      cssWidth = window.innerWidth;
      cssHeight = window.innerHeight;

      offscreenCanvas.width = cssWidth * dpr;
      offscreenCanvas.height = cssHeight * dpr;

      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      ctx.scale(dpr, dpr);
    }

    function animate(timestamp: number) {
      ctx.clearRect(
        0,
        0,
        offscreenCanvas.width / dpr,
        offscreenCanvas.height / dpr,
      );

      const centerX = offscreenCanvas.width / dpr / 2;
      const centerY = offscreenCanvas.height / dpr / 2;

      const size = Math.min(cssWidth, cssHeight) / 2 - padding * 2;
      const rotation = (spinSpeed * timestamp) / 1000000;
      const scale = (Math.sin(timestamp / 5000) + 1) / 2;
      const shadowBlur =
        Math.floor(scale * (maxShadowBlur - minShadowBlur)) + minShadowBlur;
      drawNonagon(ctx, vertices, centerX, centerY, size, rotation, shadowBlur);

      requestAnimationFrame(animate);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    const frame = requestAnimationFrame((timestamp) => {
      animate(timestamp);
      canvas.classList.add("opacity-15");
      canvas.classList.remove("opacity-0");
    });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      className="fixed z-[-1] opacity-0 transition-opacity duration-[5s] ease-in-out"
      ref={canvasRef}
    />
  );
}
