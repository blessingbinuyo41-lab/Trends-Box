import React, { useState, useEffect, useRef } from 'react';
import { motion, PanInfo } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface BugAntMascotProps {
  onOpenReport: () => void;
}

export default function BugAntMascot({ onOpenReport }: BugAntMascotProps) {
  // Edge side: 'left' or 'right'
  const [side, setSide] = useState<'left' | 'right'>('right');
  const [yOffset, setYOffset] = useState<number>(320);
  const [isHovered, setIsHovered] = useState(false);
  const [isWaving, setIsWaving] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isHalfHidden, setIsHalfHidden] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved position and hint preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('trendsbox_bug_mascot_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.side === 'left' || parsed.side === 'right') setSide(parsed.side);
        if (typeof parsed.y === 'number') {
          setYOffset(Math.max(100, Math.min(window.innerHeight - 150, parsed.y)));
        }
      } else {
        // Default to right side middle
        setYOffset(Math.max(160, Math.floor(window.innerHeight * 0.45)));
      }
    } catch {
      // Fallback
    }
  }, []);

  // Periodic waving burst without showing any intrusive popups
  useEffect(() => {
    const waveInterval = setInterval(() => {
      setIsWaving(prev => !prev);
      setTimeout(() => setIsWaving(true), 2500);
    }, 12000);
    return () => clearInterval(waveInterval);
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, []);

  const dismissHintPermanently = () => {
    setShowHint(false);
    try {
      localStorage.setItem('trendsbox_bug_hint_dismissed', 'true');
    } catch {
      // Ignore
    }
  };

  const handleMouseEnter = () => {
    if (isDragging) return;
    setIsHovered(true);

    // Only show hint if user hasn't dismissed it or seen it multiple times
    try {
      const isDismissed = localStorage.getItem('trendsbox_bug_hint_dismissed');
      const hintCount = parseInt(localStorage.getItem('trendsbox_bug_hint_count') || '0', 10);
      
      if (isDismissed !== 'true' && hintCount < 2) {
        // Require deliberate hovering for 600ms before displaying hint
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => {
          setShowHint(true);
          try {
            localStorage.setItem('trendsbox_bug_hint_count', String(hintCount + 1));
          } catch {}

          // Auto-hide hint after 3.5 seconds so it doesn't linger
          if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
          autoHideTimerRef.current = setTimeout(() => {
            setShowHint(false);
          }, 3500);
        }, 600);
      }
    } catch {
      // Fallback
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setShowHint(false);
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const screenWidth = window.innerWidth;
    const finalX = info.point.x;
    const newSide: 'left' | 'right' = finalX < screenWidth / 2 ? 'left' : 'right';
    const newY = Math.max(90, Math.min(window.innerHeight - 130, info.point.y));

    setSide(newSide);
    setYOffset(newY);

    try {
      localStorage.setItem('trendsbox_bug_mascot_pos', JSON.stringify({ side: newSide, y: newY }));
    } catch {
      // Ignore storage errors
    }
  };

  const toggleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHalfHidden(prev => !prev);
  };

  const isLeft = side === 'left';

  // Peek calculation:
  // When half-hidden, the bug ant slides halfway behind the bezel/edge of the screen,
  // with its smiling face, waving hand, and antennae peeking into view.
  // When hovered, it creeps smoothly out onto the screen.
  const peekTranslation = isHovered
    ? 'translate-x-0'
    : isHalfHidden
    ? isLeft
      ? '-translate-x-[48%]'
      : 'translate-x-[48%]'
    : 'translate-x-0';

  return (
    <div
      style={{
        position: 'fixed',
        top: `${yOffset}px`,
        [isLeft ? 'left' : 'right']: 0,
        zIndex: 45,
      }}
      className="select-none touch-none"
    >
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.06}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative flex items-center group cursor-grab active:cursor-grabbing"
      >
        {/* Limited Speech Bubble - only on deliberate hover, capped frequency, auto-dismissing */}
        {showHint && !isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: isLeft ? -8 : 8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className={`absolute top-1/2 -translate-y-1/2 ${
              isLeft ? 'left-[72px]' : 'right-[72px]'
            } whitespace-nowrap bg-neutral-900/95 text-white backdrop-blur-md pl-3 pr-2 py-2 rounded-2xl shadow-2xl border border-amber-400/30 text-xs font-semibold flex items-center gap-2.5 z-50`}
          >
            <div className="w-5 h-5 rounded-md bg-amber-400 text-black flex items-center justify-center text-xs shadow-xs shrink-0 font-bold">
              🪲
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[11px] font-bold text-amber-300">Spot a Glitch?</span>
              <span className="text-[9px] text-neutral-300">Tap me to report &amp; attach screenshots</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissHintPermanently();
              }}
              className="ml-1 p-0.5 rounded-full hover:bg-white/20 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Don't show again"
            >
              <X size={12} />
            </button>
            {/* Arrow pointer */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-neutral-900 rotate-45 border-neutral-700 ${
                isLeft ? '-left-1.5 border-l border-b' : '-right-1.5 border-r border-t'
              }`}
            />
          </motion.div>
        )}

        {/* Mascot Wrapper with smooth edge translation & transparent background */}
        <div
          onClick={() => {
            if (!isDragging) {
              dismissHintPermanently();
              onOpenReport();
            }
          }}
          className={`transition-transform duration-300 ease-out flex items-center ${peekTranslation} relative`}
          title="Bug Ant Hunter: Tap to report a bug or drag to move"
        >
          {/* Quick Hide/Seek Peek Toggle Button (Subtle Glass Pill on Hover) */}
          <button
            type="button"
            onClick={toggleHide}
            className={`absolute -top-1.5 ${
              isLeft ? 'right-0' : 'left-0'
            } w-5 h-5 rounded-full bg-neutral-950/80 hover:bg-black text-amber-300 border border-white/20 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-50 cursor-pointer shadow-md backdrop-blur-xs`}
            title={isHalfHidden ? 'Peek out Bug Ant' : 'Half-hide into edge'}
          >
            {isLeft ? (
              isHalfHidden ? <ChevronRight size={11} /> : <ChevronLeft size={11} />
            ) : (
              isHalfHidden ? <ChevronLeft size={11} /> : <ChevronRight size={11} />
            )}
          </button>

          {/* Completely Transparent Bug Ant Container with Soft Dark Drop Shadow */}
          <div
            className={`relative flex items-center justify-center bg-transparent cursor-pointer transition-transform duration-200 group-hover:scale-110 active:scale-95 ${
              isLeft ? 'pr-2' : 'pl-2'
            }`}
            style={{
              width: '68px',
              height: '68px',
              // Realistic soft dark drop-shadow directly onto the screen background
              filter: 'drop-shadow(0 12px 14px rgba(0, 0, 0, 0.42)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.32)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
            }}
          >
            {/* Lifelike Colorful Bug Ant SVG */}
            <svg
              viewBox="0 0 100 100"
              className={`w-16 h-16 transition-transform duration-300 overflow-visible ${
                isLeft ? 'scale-x-[-1]' : 'scale-x-1'
              }`}
            >
              {/* Soft Ground Contact Shadow Under the Insect's Feet */}
              <ellipse cx="50" cy="85" rx="26" ry="6" fill="#000000" opacity="0.32" />

              {/* Six Insect Legs Resting on the Glass Screen */}
              {/* Left Side Legs */}
              <g stroke="#78350f" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
                {/* Front Leg */}
                <path d="M 40 50 Q 24 46 16 54 L 12 60" />
                {/* Mid Leg */}
                <path d="M 38 60 Q 22 62 14 74 L 10 82" />
                {/* Rear Leg */}
                <path d="M 42 70 Q 26 78 18 88 L 16 91" />

                {/* Right Side Rear Legs */}
                <path d="M 62 62 Q 78 64 86 74 L 90 82" />
                <path d="M 58 70 Q 74 78 82 88 L 84 91" />
              </g>

              {/* Little glossy foot claws */}
              <circle cx="12" cy="60" r="1.4" fill="#451a03" />
              <circle cx="10" cy="82" r="1.4" fill="#451a03" />
              <circle cx="16" cy="91" r="1.4" fill="#451a03" />
              <circle cx="90" cy="82" r="1.4" fill="#451a03" />
              <circle cx="84" cy="91" r="1.4" fill="#451a03" />

              {/* Antennae */}
              <g className="origin-bottom">
                {/* Left Antenna */}
                <motion.path
                  d="M 45 28 Q 36 12 26 7"
                  stroke="#78350f"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                  animate={isWaving ? { rotate: [-5, 6, -5], y: [0, -1, 0] } : { rotate: 0 }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <circle cx="25" cy="6" r="3.4" fill="#10b981" stroke="#064e3b" strokeWidth="0.9" />

                {/* Right Antenna (Active Waving Antenna) */}
                <motion.path
                  d="M 55 28 Q 65 10 74 5"
                  stroke="#78350f"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                  animate={isWaving ? { rotate: [6, -8, 6], y: [0, -2, 0] } : { rotate: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <circle cx="75" cy="4" r="3.4" fill="#10b981" stroke="#064e3b" strokeWidth="0.9" />
              </g>

              {/* Bug Ant Abdomen (Posterior Segment) */}
              <ellipse cx="50" cy="74" rx="16" ry="14" fill="#d97706" stroke="#78350f" strokeWidth="2.4" />
              {/* Abdomen natural glossy 3D highlight */}
              <ellipse cx="44" cy="68" rx="7" ry="4" fill="#fbbf24" opacity="0.6" />
              {/* Abdomen dark stripes */}
              <path d="M 38 71 Q 50 76 62 71" stroke="#78350f" strokeWidth="2.4" fill="none" />
              <path d="M 40 78 Q 50 83 60 78" stroke="#78350f" strokeWidth="2.4" fill="none" />

              {/* Bug Ant Thorax (Middle Segment) */}
              <ellipse cx="50" cy="56" rx="13" ry="10" fill="#f59e0b" stroke="#78350f" strokeWidth="2.4" />
              <ellipse cx="45" cy="52" rx="4" ry="2.5" fill="#fef3c7" opacity="0.5" />

              {/* Detective / Inspector Emerald Tie */}
              <polygon points="50,49 44,58 56,58" fill="#059669" stroke="#064e3b" strokeWidth="0.9" />
              <circle cx="50" cy="49" r="2" fill="#fef08a" />

              {/* Bug Ant Head (Rounded Warm Honey Amber) */}
              <ellipse cx="50" cy="37" rx="17" ry="14" fill="#fbbf24" stroke="#78350f" strokeWidth="2.6" />
              {/* Head Specular Highlight */}
              <ellipse cx="44" cy="27" rx="5" ry="2.5" fill="#ffffff" opacity="0.7" />

              {/* Large Glossy Cartoon Eyes */}
              {/* Left Eye */}
              <ellipse cx="43" cy="35" rx="5.2" ry="6.2" fill="#ffffff" stroke="#78350f" strokeWidth="1.2" />
              <circle cx="43" cy="35" r="3" fill="#1c1917" />
              <circle cx="41.5" cy="33" r="1.4" fill="#ffffff" />
              <circle cx="44.5" cy="37" r="0.7" fill="#ffffff" />

              {/* Right Eye */}
              <ellipse cx="57" cy="35" rx="5.2" ry="6.2" fill="#ffffff" stroke="#78350f" strokeWidth="1.2" />
              <circle cx="57" cy="35" r="3" fill="#1c1917" />
              <circle cx="55.5" cy="33" r="1.4" fill="#ffffff" />
              <circle cx="58.5" cy="37" r="0.7" fill="#ffffff" />

              {/* Cute Rosy Cheeks */}
              <circle cx="36" cy="41" r="2.6" fill="#f43f5e" opacity="0.75" />
              <circle cx="64" cy="41" r="2.6" fill="#f43f5e" opacity="0.75" />

              {/* Friendly Smiling Mouth */}
              <path
                d="M 44 42 Q 50 48 56 42"
                stroke="#78350f"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />

              {/* Waving Front Right Hand with White Cartoon Glove */}
              <motion.g
                animate={
                  isWaving
                    ? {
                        rotate: [0, -30, 20, -25, 0],
                        transformOrigin: '58px 52px',
                      }
                    : { rotate: 0 }
                }
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <path
                  d="M 58 52 Q 74 44 79 32"
                  stroke="#78350f"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* White Glove with fingers */}
                <circle cx="80" cy="30" r="4.5" fill="#ffffff" stroke="#78350f" strokeWidth="1.4" />
                <circle cx="77" cy="26" r="2" fill="#ffffff" stroke="#78350f" strokeWidth="0.9" />
                <circle cx="82.5" cy="26.5" r="2" fill="#ffffff" stroke="#78350f" strokeWidth="0.9" />
              </motion.g>
            </svg>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
