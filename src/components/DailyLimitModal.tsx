import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, History, AlertTriangle, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';

interface DailyLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewHistory: () => void;
  currentUsage: number;
  maxLimit: number;
}

export default function DailyLimitModal({
  isOpen,
  onClose,
  onViewHistory,
  currentUsage,
  maxLimit
}: DailyLimitModalProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Calculate live countdown until midnight (local time)
  useEffect(() => {
    const calculateTimeUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeUntilMidnight());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 360 }}
            className="relative w-full max-w-md bg-white rounded-3xl md:rounded-[2rem] shadow-2xl border border-black/10 overflow-hidden z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="limit-modal-title"
          >
            {/* Top decorative gradient bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-black/40 hover:text-black hover:bg-black/5 transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="p-6 md:p-8 space-y-6">
              {/* Animated Icon Badge */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.65, 0.35] }}
                    transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                    className="absolute w-20 h-20 rounded-full bg-rose-500/20"
                  />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200/80 flex items-center justify-center text-rose-600 shadow-sm">
                    <ShieldAlert size={32} className="stroke-[2.2]" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Daily Cap Reached ({currentUsage}/{maxLimit})
                </div>

                <div className="space-y-1.5">
                  <h3 id="limit-modal-title" className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
                    Daily Generation Limit
                  </h3>
                  <p className="text-xs md:text-sm text-neutral-500 leading-relaxed max-w-sm">
                    You have reached your daily quota of <span className="font-semibold text-neutral-900">{maxLimit} generations</span> for today. Content generation is currently locked until your quota resets.
                  </p>
                </div>
              </div>

              {/* Countdown & Quota Card */}
              <div className="bg-neutral-50 border border-neutral-200/70 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-neutral-400 text-[10px]">
                    <Clock size={13} className="text-neutral-500" />
                    Automatic Reset In
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-md">
                    Midnight 00:00
                  </span>
                </div>

                {/* Clock Display */}
                <div className="grid grid-cols-3 gap-2 text-center py-1">
                  <div className="bg-white rounded-xl p-2 border border-neutral-200/60 shadow-xs">
                    <div className="text-lg md:text-xl font-bold font-mono text-neutral-900">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Hours</div>
                  </div>
                  <div className="bg-white rounded-xl p-2 border border-neutral-200/60 shadow-xs">
                    <div className="text-lg md:text-xl font-bold font-mono text-neutral-900">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Mins</div>
                  </div>
                  <div className="bg-white rounded-xl p-2 border border-neutral-200/60 shadow-xs">
                    <div className="text-lg md:text-xl font-bold font-mono text-rose-600">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Secs</div>
                  </div>
                </div>

                {/* Progress Visual */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-semibold text-neutral-600">
                    <span>Usage Progress</span>
                    <span className="font-mono text-rose-600">{currentUsage}/{maxLimit} (100%)</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onViewHistory();
                  }}
                  className="w-full py-3.5 px-4 bg-black text-white rounded-xl font-bold text-sm shadow-md hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <History size={16} />
                  <span>Review Past Generations</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-transparent hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  Understood, Got It
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
