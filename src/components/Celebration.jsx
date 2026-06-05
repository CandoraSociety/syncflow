import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

/**
 * Celebration component - plays confetti animation and applause sound
 * Triggered when a roadmap item is marked as completed
 */
const APPLAUSE_URL = "https://archive.org/download/Red_Library_Crowds_Applause/R07-29-Loud%20Applause%20and%20Cheering.mp3";

// Preload audio at module level so it's ready immediately on trigger
const preloadedAudio = new Audio(APPLAUSE_URL);
preloadedAudio.preload = "auto";
preloadedAudio.volume = 0.7;

export default function Celebration({ trigger, onComplete }) {
  const audioRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;

    const playSound = async () => {
      try {
        // Reuse preloaded audio; reset if it was already played
        preloadedAudio.currentTime = 0;
        audioRef.current = preloadedAudio;
        await preloadedAudio.play();
        preloadedAudio.onended = () => {
          if (onComplete) onComplete();
        };
      } catch (error) {
        console.log("Audio play failed:", error);
        if (onComplete) setTimeout(onComplete, 3000);
      }
    };

    // Fire confetti
    const fireConfetti = () => {
      const duration = 3000;
      const end = Date.now() + duration;
      const colors = ["#FBB800", "#22c55e", "#16a34a", "#f59e0b"];

      const frame = () => {
        if (Date.now() > end) return;
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors, scalar: 0.8, drift: 0.5, ticks: 200 });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors, scalar: 0.8, drift: -0.5, ticks: 200 });
        animationRef.current = requestAnimationFrame(frame);
      };

      frame();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors, scalar: 1.2, gravity: 1.2, drift: 0, ticks: 150 });
    };

    playSound();
    fireConfetti();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, [trigger, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-t from-green-50/30 to-transparent animate-pulse" />
      <div className="text-center pointer-events-auto">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <div className="text-4xl font-bold text-green-600 drop-shadow-lg animate-pulse">
          Milestone Completed!
        </div>
        <div className="text-xl text-green-500 mt-2 font-semibold">
          Amazing progress! Keep it up! 🌟
        </div>
      </div>
    </div>
  );
}