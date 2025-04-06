'use client';

import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
} from 'react';

export interface AudioLinesIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AudioLinesIconProps {
  size?: number;
  className?: string;
}

export const AudioLinesIcon = forwardRef<
  AudioLinesIconHandle,
  AudioLinesIconProps
>(({ size = 24, className = '' }, ref) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lineHeights = useRef([2, 4, 6, 4, 2]);

  useImperativeHandle(ref, () => ({
    startAnimation: () => {
      setIsAnimating(true);

      // Clear any existing animation
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Animate the lines
      intervalRef.current = setInterval(() => {
        lineHeights.current = lineHeights.current.map(
          () => Math.floor(Math.random() * 6) + 2,
        );
        // Force re-render
        setIsAnimating((prev) => !prev);
        setIsAnimating((prev) => !prev);
      }, 150);
    },
    stopAnimation: () => {
      setIsAnimating(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Reset heights
      lineHeights.current = [2, 4, 6, 4, 2];
    },
  }));

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x={6 + i * 2.5}
            y={12 - lineHeights.current[i] / 2}
            width="1.5"
            height={lineHeights.current[i]}
            rx="0.75"
            fill="currentColor"
            className="transition-all duration-150"
          />
        ))}
      </g>
    </svg>
  );
});

AudioLinesIcon.displayName = 'AudioLinesIcon';
