import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, History, ArrowRight, ShieldAlert, CheckCircle2, Award, Play, Sparkles } from 'lucide-react';
import { getTimeUntilNigeriaMidnight, MAX_TRB_ADS_PER_DAY, DAILY_LIMIT } from '../lib/quota';

interface DailyLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewHistory: () => void;
  currentUsage: number;
  maxLimit: number;
  onResetQuota?: () => void;
  onWatchAd?: () => void;
  adsWatchedToday?: number;
  canWatchAd?: boolean;
}

export default function DailyLimitModal({
  isOpen,
  onClose,
  onViewHistory,
  currentUsage,
  maxLimit,
  onResetQuota,
  onWatchAd,
  adsWatchedToday = 0,
  canWatchAd = false
}: DailyLimitModalProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const isExhausted = currentUsage >= maxLimit;
  const isNearLimit = !isExhausted && currentUsage >= Math.floor(maxLimit * 0.7);
  const remainingQuota = Math.max(0, maxLimit - currentUsage);
  const percentageUsed = Math.min(100, Math.round((currentUsage / (maxLimit || 1)) * 100));

  // Calculate live countdown strictly until 12:00 AM Nigeria Time (WAT / Africa:Lagos)
  useEffect(() => {
    const updateCountdown = () => {
      const countdown = getTimeUntilNigeriaMidnight();
      setTimeLeft({
        hours: countdown.hours,
        minutes: countdown.minutes,
        seconds: countdown.seconds
      });

      if (countdown.isPastMidnight && onResetQuota) {
        onResetQuota();
        onClose();
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [onResetQuota, onClose]);

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

  // Dynamic theme colors: Green (<70%), Amber (>=70%), Rose (>=100%)
  const topGradient = isExhausted
    ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600'
    : isNearLimit
    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600'
    : 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600';

  const pulseBg = isExhausted
    ? 'bg-rose-500/20'
    : isNearLimit
    ? 'bg-amber-500/20'
    : 'bg-emerald-500/20';

  const iconCardStyle = isExhausted
    ? 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200/80 text-rose-600'
    : isNearLimit
    ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200/80 text-amber-600'
    : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200/80 text-emerald-600';

  const badgeStyle = isExhausted
    ? 'bg-rose-50 border-rose-200 text-rose-700'
    : isNearLimit
    ? 'bg-amber-50 border-amber-200 text-amber-800'
    : 'bg-emerald-50 border-emerald-200 text-emerald-700';

  const dotColor = isExhausted
    ? 'bg-rose-500 animate-pulse'
    : isNearLimit
    ? 'bg-amber-500 animate-pulse'
    : 'bg-emerald-500';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 will-change-[opacity]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-white rounded-3xl md:rounded-[2rem] shadow-2xl border border-black/10 overflow-hidden z-10 will-change-transform transform-gpu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="limit-modal-title"
          >
            {/* Top decorative gradient bar */}
            <div className={`h-1.5 w-full ${topGradient}`} />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-black/40 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="p-6 md:p-8 space-y-6">
              {/* Dynamic Header Badge and Title */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.65, 0.35] }}
                    transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                    className={`absolute w-20 h-20 rounded-full ${pulseBg}`}
                  />
                  <div className={`relative w-16 h-16 rounded-2xl border flex items-center justify-center shadow-sm ${iconCardStyle}`}>
                    {isExhausted ? (
                      <ShieldAlert size={32} className="stroke-[2.2]" />
                    ) : (
                      <Sparkles size={32} className="stroke-[2.2]" />
                    )}
                  </div>
                </div>

                <div className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-[10px] font-bold uppercase tracking-widest ${badgeStyle}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  {isExhausted 
                    ? `Daily Quota Reached (${currentUsage}/${maxLimit})`
                    : isNearLimit
                    ? `Quota Warning (${currentUsage}/${maxLimit} Used)`
                    : `Quota Available (${currentUsage}/${maxLimit} Used)`
                  }
                </div>

                <div className="space-y-1.5">
                  <h3 id="limit-modal-title" className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
                    {isExhausted 
                      ? 'Daily Limit Reached' 
                      : isNearLimit 
                      ? 'Approaching Daily Limit' 
                      : 'Daily Quota Status'}
                  </h3>
                  <p className="text-xs md:text-sm text-neutral-500 leading-relaxed max-w-sm">
                    {isExhausted ? (
                      <>You have used all <span className="font-semibold text-neutral-900">{maxLimit} generations</span> for today. Content generation is currently locked until reset or rewarded unlock.</>
                    ) : isNearLimit ? (
                      <>You have used 70%+ of your points. Only <span className="font-bold text-amber-600">{remainingQuota} generation{remainingQuota === 1 ? '' : 's'} remaining</span> today.</>
                    ) : (
                      <>You have <span className="font-bold text-emerald-600">{remainingQuota} of {maxLimit} generations</span> remaining today before needing a reset or TRB points.</>
                    )}
                  </p>
                </div>
              </div>

              {/* Dynamic Rewarded Ad Card (Only unlocked if exhausted, otherwise informative) */}
              {onWatchAd && (
                <div 
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isExhausted
                      ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-400/40'
                      : 'bg-neutral-50 border-neutral-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${
                          isExhausted ? 'bg-amber-400 text-black' : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        <Award size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                          <span>TRB Reward Unlocks</span>
                          <span className="px-1.5 py-0.2 bg-amber-400 text-black font-extrabold text-[9px] rounded">
                            +5 QUOTAS
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500">
                          {adsWatchedToday < MAX_TRB_ADS_PER_DAY
                            ? `${MAX_TRB_ADS_PER_DAY - adsWatchedToday} ad rewards available today`
                            : 'Daily 10/10 ad reward limit reached'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isExhausted ? (
                    canWatchAd ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onWatchAd();
                        }}
                        className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play size={14} className="fill-black" />
                        <span>Watch Short Video &amp; Earn +5 TRB</span>
                      </button>
                    ) : (
                      <div className="text-center py-2 text-xs text-neutral-500 bg-black/5 rounded-xl">
                        Daily 10/10 ad unlocks completed. Resets at midnight.
                      </div>
                    )
                  ) : (
                    <div className="p-2.5 rounded-xl bg-white border border-neutral-200/60 text-[11px] text-neutral-500 flex items-center gap-2 leading-relaxed">
                      <span className="text-amber-500 shrink-0 font-bold">ℹ️</span>
                      <span>Watch-to-earn activates automatically once your {DAILY_LIMIT} free daily generations are used.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Countdown & Quota Progress Card */}
              <div className="bg-neutral-50 border border-neutral-200/70 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-neutral-400 text-[10px]">
                    <Clock size={13} className="text-neutral-500" />
                    Daily Quota Resets In
                  </div>
                  <span 
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md flex items-center gap-1 ${
                      isExhausted ? 'text-rose-600 bg-rose-100/60' : 'text-emerald-700 bg-emerald-100/60'
                    }`}
                  >
                    <span 
                      className={`w-1.5 h-1.5 rounded-full ${
                        isExhausted ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                      }`} 
                    />
                    12:00 AM WAT (Nigeria Time)
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
                    <div 
                      className={`text-lg md:text-xl font-bold font-mono ${
                        isExhausted ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Secs</div>
                  </div>
                </div>

                {/* Progress Visual */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-semibold text-neutral-600">
                    <span>Today's Usage</span>
                    <span 
                      className={`font-mono ${
                        isExhausted ? 'text-rose-600 font-bold' : 'text-neutral-900'
                      }`}
                    >
                      {currentUsage}/{maxLimit} ({percentageUsed}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentageUsed}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        isExhausted
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                          : isNearLimit
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                          : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                      }`}
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
                  className="w-full py-3 px-4 bg-black text-white rounded-xl font-bold text-xs shadow-md hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <History size={15} />
                  <span>Review Past Generations</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-transparent hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  {isExhausted ? 'Close & Wait for Midnight Reset' : 'Got It, Continue Generating'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
