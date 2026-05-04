import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Use motion values for smoother, decoupled animations
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  
  // Spring physics for the ring
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true);
      return;
    }

    const updateMousePosition = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      const computedStyle = window.getComputedStyle(target);
      const isInteractive = 
        computedStyle.cursor === 'pointer' ||
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'input' ||
        target.tagName.toLowerCase() === 'textarea' ||
        target.closest('button') !== null ||
        target.closest('a') !== null;
        
      setIsHovering(Boolean(isInteractive));
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, cursorX, cursorY]);

  if (isTouchDevice) {
    return null; 
  }

  return (
    <>
      <style>{`
        @media (min-width: 640px) {
          *, *:hover {
            cursor: none !important;
          }
          input, textarea, [contenteditable="true"], input:hover, textarea:hover, [contenteditable="true"]:hover {
            cursor: text !important;
          }
        }
      `}</style>
      
      {/* Inner Dot */}
      <motion.div
        className="fixed top-0 left-0 w-2.5 h-2.5 bg-white rounded-full pointer-events-none z-[99999] mix-blend-difference hidden sm:block"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isHovering ? 0 : 1,
          opacity: isVisible ? 1 : 0
        }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
      />
      
      {/* Outer Ring */}
      <motion.div
        className="fixed top-0 left-0 w-10 h-10 border border-white/50 bg-white/5 backdrop-blur-sm rounded-full pointer-events-none z-[99998] hidden sm:block"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          backgroundColor: isHovering ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
          borderColor: isHovering ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
          opacity: isVisible ? 1 : 0
        }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
      />
    </>
  );
}

