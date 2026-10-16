import { useEffect, useRef, useState } from 'react';

interface AutoScrollOptions {
  enabled?: boolean;
  speed?: number; // Pixels per frame (e.g. 0.6 - 1.0)
  bottomPauseMs?: number; // Pause duration at bottom in ms
  topPauseMs?: number; // Pause duration at top in ms
  userInteractionPauseMs?: number; // Pause after user manual scroll in ms
}

export function useAutoScroll({
  enabled = true,
  speed = 0.7,
  bottomPauseMs = 7000,
  topPauseMs = 6000,
  userInteractionPauseMs = 12000,
}: AutoScrollOptions = {}) {
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);

  const stateRef = useRef({
    enabled,
    isActive,
    isInteracting,
    isPaused: false,
    direction: 'down' as 'down' | 'waiting_bottom' | 'waiting_top',
    lastPauseTime: 0,
    resumeTimer: null as ReturnType<typeof setTimeout> | null,
    animationFrameId: null as number | null,
  });

  // Sync refs
  useEffect(() => {
    stateRef.current.enabled = enabled;
  }, [enabled]);

  useEffect(() => {
    stateRef.current.isActive = isActive;
  }, [isActive]);

  useEffect(() => {
    stateRef.current.isInteracting = isInteracting;
  }, [isInteracting]);

  // Handle user manual interaction (scroll, touch, mouse wheel)
  useEffect(() => {
    if (!enabled) return;

    const onUserInteraction = () => {
      setIsInteracting(true);

      if (stateRef.current.resumeTimer) {
        clearTimeout(stateRef.current.resumeTimer);
      }

      stateRef.current.resumeTimer = setTimeout(() => {
        setIsInteracting(false);
      }, userInteractionPauseMs);
    };

    window.addEventListener('wheel', onUserInteraction, { passive: true });
    window.addEventListener('touchstart', onUserInteraction, { passive: true });
    window.addEventListener('pointerdown', onUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('wheel', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
      window.removeEventListener('pointerdown', onUserInteraction);
      if (stateRef.current.resumeTimer) {
        clearTimeout(stateRef.current.resumeTimer);
      }
    };
  }, [enabled, userInteractionPauseMs]);

  // Main animation frame loop
  useEffect(() => {
    if (!enabled) {
      if (stateRef.current.animationFrameId) {
        cancelAnimationFrame(stateRef.current.animationFrameId);
      }
      return;
    }

    let lastTimestamp = performance.now();

    const step = (now: number) => {
      const delta = now - lastTimestamp;
      lastTimestamp = now;

      const state = stateRef.current;

      if (!state.enabled || !state.isActive || state.isInteracting) {
        state.animationFrameId = requestAnimationFrame(step);
        return;
      }

      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const maxScroll = docHeight - windowHeight;

      // Only scroll if there is content to scroll
      if (maxScroll > 10) {
        if (state.direction === 'down') {
          // Check if reached bottom
          if (scrollY >= maxScroll - 4) {
            state.direction = 'waiting_bottom';
            state.lastPauseTime = now;
          } else {
            // Smoothly move down
            const moveBy = Math.max(0.3, speed * (delta / 16.67));
            window.scrollBy({ top: moveBy, behavior: 'auto' });
          }
        } else if (state.direction === 'waiting_bottom') {
          // Wait at bottom to let viewers inspect finance & rejection panels
          if (now - state.lastPauseTime >= bottomPauseMs) {
            // Smooth scroll back to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            state.direction = 'waiting_top';
            state.lastPauseTime = now;
          }
        } else if (state.direction === 'waiting_top') {
          // Wait at top to let viewers inspect global KPIs
          if (scrollY <= 5 && now - state.lastPauseTime >= topPauseMs) {
            state.direction = 'down';
          }
        }
      }

      state.animationFrameId = requestAnimationFrame(step);
    };

    stateRef.current.animationFrameId = requestAnimationFrame(step);

    return () => {
      if (stateRef.current.animationFrameId) {
        cancelAnimationFrame(stateRef.current.animationFrameId);
      }
    };
  }, [enabled, speed, bottomPauseMs, topPauseMs]);

  const toggleAutoScroll = () => {
    setIsActive((prev) => !prev);
  };

  return {
    isActive,
    isInteracting,
    toggleAutoScroll,
    setIsActive,
  };
}
