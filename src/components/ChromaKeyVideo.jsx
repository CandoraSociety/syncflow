import { useEffect, useRef } from "react";

/**
 * Plays a video with its solid magenta chroma-key background removed,
 * rendering only the character on a transparent canvas.
 */
export default function ChromaKeyVideo({ src, className, width = 480 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const processFrame = () => {
      if (video && canvas && ctx && video.readyState >= 2 && video.videoWidth) {
        const w = width;
        const h = Math.round((video.videoHeight / video.videoWidth) * w);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        ctx.drawImage(video, 0, 0, w, h);
        const frame = ctx.getImageData(0, 0, w, h);
        const d = frame.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          // Magenta chroma key: high red + blue, low green
          if (r > 120 && b > 120 && g < Math.min(r, b) * 0.55) {
            d[i + 3] = 0;
          }
        }
        ctx.putImageData(frame, 0, 0);
      }
      rafRef.current = requestAnimationFrame(processFrame);
    };

    rafRef.current = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width]);

  return (
    <>
      <video ref={videoRef} src={src} autoPlay loop muted playsInline className="hidden" />
      <canvas ref={canvasRef} className={className} />
    </>
  );
}