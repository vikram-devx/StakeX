import React, { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { cn } from '@/lib/utils';

interface CoinFlipAnimationProps {
  isFlipping: boolean;
  result?: 'heads' | 'tails' | undefined;
  onAnimationComplete?: () => void;
  className?: string;
}

const getRandomFlips = () => {
  // Random number between 5 and 8 for more natural randomness
  return Math.floor(Math.random() * 4) + 5;
};

export default function CoinFlipAnimation({
  isFlipping,
  result,
  onAnimationComplete,
  className,
}: CoinFlipAnimationProps) {
  const [flips, setFlips] = useState(0);
  const [finalResult, setFinalResult] = useState<'heads' | 'tails' | undefined>(undefined);

  // Reset the animation when isFlipping changes to true
  useEffect(() => {
    if (isFlipping) {
      setFlips(0);
      setFinalResult(undefined);
      
      // Pre-determine the number of flips to ensure it lands on the correct side
      const totalFlips = getRandomFlips();
      
      // Stagger the flips to create a more realistic animation
      const flipInterval = setInterval(() => {
        setFlips(prev => {
          const nextFlip = prev + 1;
          
          // If we've reached the total flips, stop the animation
          if (nextFlip >= totalFlips) {
            clearInterval(flipInterval);
            
            // Set the final result after all flips
            setTimeout(() => {
              setFinalResult(result);
              if (onAnimationComplete) {
                onAnimationComplete();
              }
            }, 500); // Small delay for visual purposes
          }
          
          return nextFlip;
        });
      }, 300); // Time between coin flips
      
      return () => clearInterval(flipInterval);
    }
  }, [isFlipping, result, onAnimationComplete]);

  // Calculate whether the coin should show heads or tails during the animation
  const showHeads = finalResult 
    ? finalResult === 'heads'
    : flips % 2 === 0;

  // Animation spring for the flip
  const { transform, opacity } = useSpring({
    transform: isFlipping 
      ? `perspective(1000px) rotateY(${flips * 180}deg)` 
      : 'perspective(1000px) rotateY(0deg)',
    opacity: 1,
    config: {
      mass: 2,
      tension: 170,
      friction: 20,
    },
  });

  return (
    <div className={cn("relative flex justify-center items-center", className)}>
      <div 
        className="relative w-40 h-40 cursor-pointer"
      >
        {/* Heads side of coin */}
        <animated.div
          style={{
            transform,
            opacity: opacity.to(o => (showHeads ? o : 0)),
            backfaceVisibility: 'hidden',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
          className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex justify-center items-center shadow-xl border-4 border-yellow-700"
        >
          <div className="text-2xl font-bold text-yellow-900">H</div>
        </animated.div>

        {/* Tails side of coin */}
        <animated.div
          style={{
            transform: transform.to(t => `${t} rotateY(180deg)`),
            opacity: opacity.to(o => (showHeads ? 0 : o)),
            backfaceVisibility: 'hidden',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
          className="bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-full flex justify-center items-center shadow-xl border-4 border-yellow-800"
        >
          <div className="text-2xl font-bold text-yellow-100">T</div>
        </animated.div>
      </div>

      {/* Status indicator */}
      {isFlipping && (
        <div className="absolute -bottom-10 text-center font-medium text-gray-700 animate-pulse">
          Flipping...
        </div>
      )}
      
      {finalResult && !isFlipping && (
        <div className="absolute -bottom-10 text-center font-bold text-lg text-primary">
          {finalResult.toUpperCase()}!
        </div>
      )}
    </div>
  );
}