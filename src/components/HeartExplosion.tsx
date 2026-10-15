import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

export const HeartExplosion: React.FC = () => {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  useEffect(() => {
    // 1. Fire bursts of confetti with heart-like palette
    const end = Date.now() + 3500;
    const colors = ['#ff1744', '#ff4081', '#f50057', '#ff80ab', '#ffcdd2', '#ffffff'];

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.7 },
        colors,
        shapes: ['circle'],
        scalar: 1.2,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.7 },
        colors,
        shapes: ['circle'],
        scalar: 1.2,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Big central heart burst
    confetti({
      particleCount: 100,
      spread: 120,
      origin: { y: 0.5 },
      colors,
      scalar: 1.5,
    });

    // 2. Generate floating hearts across the screen
    const generated: FloatingHeart[] = [];
    const heartColors = ['#ff2a6d', '#ff5e7e', '#ff758c', '#ff8e53', '#e0245e', '#ff3366'];
    for (let i = 0; i < 45; i++) {
      generated.push({
        id: i,
        x: Math.random() * 95,
        y: Math.random() * 20 + 85, // start near bottom
        size: Math.random() * 32 + 18,
        duration: Math.random() * 3.5 + 2.5,
        delay: Math.random() * 1.5,
        color: heartColors[Math.floor(Math.random() * heartColors.length)],
      });
    }
    setHearts(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Floating Animated Hearts */}
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          initial={{
            opacity: 0,
            y: `${h.y}vh`,
            x: `${h.x}vw`,
            scale: 0.5,
            rotate: Math.random() * 40 - 20,
          }}
          animate={{
            opacity: [0, 0.9, 0.9, 0],
            y: ['90vh', '-10vh'],
            x: [`${h.x}vw`, `${h.x + (Math.random() * 10 - 5)}vw`],
            scale: [0.5, 1.2, 1],
            rotate: [Math.random() * 20 - 10, Math.random() * 40 - 20],
          }}
          transition={{
            duration: h.duration,
            delay: h.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          className="absolute"
        >
          <svg
            width={h.size}
            height={h.size}
            viewBox="0 0 24 24"
            fill={h.color}
            className="filter drop-shadow-[0_4px_8px_rgba(255,50,100,0.4)]"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.div>
      ))}

      {/* Screen tint romantic flash */}
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-gradient-to-t from-pink-300/30 via-rose-200/20 to-transparent"
      />
    </div>
  );
};
