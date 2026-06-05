import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

/**
 * Celebration component - plays confetti animation and clapping/cheering sound
 * Triggered when a barrier is marked as completed
 */
export default function Celebration({ trigger, onComplete }) {
  const audioRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;

    // Play applause sound
    const playSound = async () => {
      try {
        const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-animated-small-group-applause-523.mp3");
        audio.volume = 0.7;
        audioRef.current = audio;
        await audio.play();
        audio.onended = () => {
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

      // Gold and green confetti for celebration
      const colors = ["#FBB800", "#22c55e", "#16a34a", "#f59e0b"];

      const frame = () => {
        if (Date.now() > end) return;

        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: colors,
          scalar: 0.8,
          drift: 0.5,
          ticks: 200,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: colors,
          scalar: 0.8,
          drift: -0.5,
          ticks: 200,
        });

        animationRef.current = requestAnimationFrame(frame);
      };

      frame();

      // Initial burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors,
        scalar: 1.2,
        gravity: 1.2,
        drift: 0,
        ticks: 150,
      });
    };

    playSound();
    fireConfetti();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
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