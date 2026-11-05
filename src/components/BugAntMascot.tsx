import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface BugAntMascotProps {
  onOpenReport: () => void;
}

export default function BugAntMascot({ onOpenReport }: BugAntMascotProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="fixed bottom-6 right-5 z-[9999] select-none"
      style={{
        pointerEvents: 'auto',
      }}
    >
      {/* Speech Prompt Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            className="absolute bottom-full right-0 mb-3 whitespace-nowrap bg-neutral-900/95 text-white backdrop-blur-md px-3 py-2 rounded-2xl shadow-2xl border border-amber-400/40 text-xs font-semibold flex items-center gap-2"
          >
            <div className="w-5 h-5 rounded-md bg-amber-400 text-black flex items-center justify-center text-xs font-bold shrink-0">
              🪲
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[11px] font-bold text-amber-300">Spot a Glitch?</span>
              <span className="text-[9px] text-neutral-300">Tap to submit report</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="ml-1 p-0.5 rounded-full hover:bg-white/20 text-neutral-400 hover:text-white"
            >
              <X size={12} />
            </button>
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-neutral-900 rotate-45 border-b border-r border-amber-400/30" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Mascot Button */}
      <button
        type="button"
        onClick={onOpenReport}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Report a bug or suggestion"
        className="relative group p-0 bg-transparent border-none outline-none cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200 block"
      >
        {/* Stand-alone Bug Ant with Transparent Background */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-transparent flex items-center justify-center overflow-visible">
          {/* Fully Visible Colorful Bug Ant Illustration */}
          <svg
            viewBox="0 0 100 100"
            className="w-14 h-14 sm:w-16 sm:h-16 overflow-visible drop-shadow-sm group-hover:drop-shadow-md transition-all duration-200"
          >
            {/* Soft Shadow */}
            <ellipse cx="50" cy="85" rx="24" ry="5" fill="#000000" opacity="0.25" />

            {/* Insect Legs */}
            <g stroke="#78350f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 40 52 Q 22 48 14 56 L 10 62" />
              <path d="M 38 62 Q 20 66 12 76 L 8 84" />
              <path d="M 42 72 Q 24 80 16 90 L 14 93" />
              <path d="M 62 62 Q 80 66 88 76 L 92 84" />
              <path d="M 58 72 Q 76 80 84 90 L 86 93" />
            </g>

            {/* Left Antenna */}
            <path
              d="M 45 28 Q 34 12 24 7"
              stroke="#78350f"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="23" cy="6" r="3.5" fill="#10b981" stroke="#064e3b" strokeWidth="1" />

            {/* Right Antenna */}
            <path
              d="M 55 28 Q 66 10 76 5"
              stroke="#78350f"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="77" cy="4" r="3.5" fill="#10b981" stroke="#064e3b" strokeWidth="1" />

            {/* Abdomen (Posterior Segment) */}
            <ellipse cx="50" cy="74" rx="16" ry="14" fill="#d97706" stroke="#78350f" strokeWidth="2.5" />
            <ellipse cx="44" cy="68" rx="7" ry="4" fill="#fbbf24" opacity="0.6" />
            <path d="M 38 71 Q 50 76 62 71" stroke="#78350f" strokeWidth="2.4" fill="none" />
            <path d="M 40 78 Q 50 83 60 78" stroke="#78350f" strokeWidth="2.4" fill="none" />

            {/* Thorax (Middle Segment) */}
            <ellipse cx="50" cy="56" rx="13" ry="10" fill="#f59e0b" stroke="#78350f" strokeWidth="2.4" />
            <ellipse cx="45" cy="52" rx="4" ry="2.5" fill="#fef3c7" opacity="0.5" />

            {/* Emerald Inspector Tie */}
            <polygon points="50,49 44,58 56,58" fill="#059669" stroke="#064e3b" strokeWidth="1" />
            <circle cx="50" cy="49" r="2" fill="#fef08a" />

            {/* Head (Honey Amber) */}
            <ellipse cx="50" cy="37" rx="17" ry="14" fill="#fbbf24" stroke="#78350f" strokeWidth="2.6" />
            <ellipse cx="44" cy="27" rx="5" ry="2.5" fill="#ffffff" opacity="0.7" />

            {/* Left Eye */}
            <ellipse cx="43" cy="35" rx="5.2" ry="6.2" fill="#ffffff" stroke="#78350f" strokeWidth="1.2" />
            <circle cx="43" cy="35" r="3" fill="#1c1917" />
            <circle cx="41.5" cy="33" r="1.4" fill="#ffffff" />

            {/* Right Eye */}
            <ellipse cx="57" cy="35" rx="5.2" ry="6.2" fill="#ffffff" stroke="#78350f" strokeWidth="1.2" />
            <circle cx="57" cy="35" r="3" fill="#1c1917" />
            <circle cx="55.5" cy="33" r="1.4" fill="#ffffff" />

            {/* Rosy Cheeks */}
            <circle cx="36" cy="41" r="2.6" fill="#f43f5e" opacity="0.75" />
            <circle cx="64" cy="41" r="2.6" fill="#f43f5e" opacity="0.75" />

            {/* Smile */}
            <path
              d="M 44 42 Q 50 48 56 42"
              stroke="#78350f"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />

            {/* Waving Arm with Glove */}
            <motion.g
              animate={{ rotate: [0, -25, 15, -20, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              style={{ transformOrigin: "58px 52px" }}
            >
              <path
                d="M 58 52 Q 74 44 79 32"
                stroke="#78350f"
                strokeWidth="3.4"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="80" cy="30" r="4.5" fill="#ffffff" stroke="#78350f" strokeWidth="1.4" />
              <circle cx="77" cy="26" r="2" fill="#ffffff" stroke="#78350f" strokeWidth="0.9" />
              <circle cx="82.5" cy="26.5" r="2" fill="#ffffff" stroke="#78350f" strokeWidth="0.9" />
            </motion.g>
          </svg>
        </div>
      </button>
    </div>
  );
}
