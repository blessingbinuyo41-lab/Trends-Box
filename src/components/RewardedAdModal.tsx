import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Volume2, VolumeX, ShieldAlert, CheckCircle2, Sparkles, X, Loader as Loader2, Award } from 'lucide-react';
import { ADS_CONFIG } from '../lib/adsConfig';

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardGranted: () => void;
  remainingAdsToday: number;
}

export default function RewardedAdModal({
  isOpen,
  onClose,
  onRewardGranted,
  remainingAdsToday
}: RewardedAdModalProps) {
  const [duration, setDuration] = useState<15 | 30 | 60>(15);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isMuted, setIsMuted] = useState(false);
  const [rewardGranted, setRewardGranted] = useState(false);
  const [skipAttempted, setSkipAttempted] = useState(false);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setTimeLeft(duration);
      setRewardGranted(false);
      setSkipAttempted(false);
    }
  }, [isOpen, duration]);

  // Ad countdown loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsPlaying(false);
            setRewardGranted(true);
            onRewardGranted();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, onRewardGranted]);

  const handleStartAd = (selectedDuration: 15 | 30 | 60) => {
    setDuration(selectedDuration);
    setTimeLeft(selectedDuration);
    setIsPlaying(true);
    setRewardGranted(false);
  };

  const handleAttemptClose = () => {
    if (isPlaying && timeLeft > 0) {
      setSkipAttempted(true);
      setTimeout(() => setSkipAttempted(false), 3000);
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleAttemptClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md will-change-[opacity]"
        />

        {/* Modal Player Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-neutral-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto z-10 text-white"
        >
          {/* Top Header Bar */}
          <div className="px-5 py-3.5 border-b border-white/10 bg-neutral-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-bold">
                Sponsored TRB Reward Partner
              </span>
            </div>

            <button
              onClick={handleAttemptClose}
              className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Ad"
            >
              <X size={16} />
            </button>
          </div>

          {/* Ad Canvas / Video Simulation Screen */}
          <div className="relative aspect-video bg-gradient-to-br from-neutral-900 via-black to-neutral-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            {/* Background Pulsing Lights */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.15),transparent_70%)] pointer-events-none" />

            {!isPlaying && !rewardGranted ? (
              /* Pre-roll: Select Duration & Start */
              <div className="space-y-4 max-w-sm relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-black mx-auto flex items-center justify-center shadow-lg shadow-amber-400/20">
                  <Award size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Watch to Earn +5 TRB Points</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Select ad duration. Watch until the end to instantly unlock 5 additional editorial generations today.
                  </p>
                </div>

                {/* Duration Selectors */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {([15, 30, 60] as const).map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleStartAd(sec)}
                      className="p-3 rounded-2xl bg-white/[0.06] hover:bg-amber-400 hover:text-black border border-white/10 hover:border-amber-400 transition-all cursor-pointer group text-center"
                    >
                      <div className="text-sm font-bold">{sec}s</div>
                      <div className="text-[10px] text-neutral-400 group-hover:text-black/80 font-mono">+5 TRB</div>
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-neutral-500 font-mono pt-1">
                  Remaining today: {remainingAdsToday} / {ADS_CONFIG.rewards.maxAdsPerDay}
                </p>
              </div>
            ) : isPlaying ? (
              /* Playing Screen with Countdown Timer & Simulated Ad Creative */
              <div className="space-y-4 relative z-10 w-full">
                {/* Audio and Countdown Controls */}
                <div className="absolute -top-2 left-0 right-0 flex items-center justify-between px-2">
                  <button
                    type="button"
                    onClick={() => setIsMuted(prev => !prev)}
                    className="p-2 rounded-xl bg-black/60 text-white/80 hover:text-white border border-white/10"
                  >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>

                  <div className="px-3 py-1 rounded-full bg-black/80 border border-amber-400/30 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Loader2 size={12} className="animate-spin text-amber-400" />
                    <span>Reward in {timeLeft}s</span>
                  </div>
                </div>

                {/* Animated Creative Visual */}
                <div className="py-6 space-y-3">
                  <motion.div
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center font-black text-2xl mx-auto shadow-xl"
                  >
                    ⚡
                  </motion.div>
                  <h4 className="text-base font-bold text-white tracking-tight">
                    Trends Box Enterprise News API
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                    Automated, fact-verified syndication for digital publishers across Nigeria.
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((duration - timeLeft) / duration) * 100}%` }}
                    transition={{ ease: 'linear', duration: 1 }}
                  />
                </div>
              </div>
            ) : (
              /* Reward Granted Celebration Screen */
              <div className="space-y-3 relative z-10 py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                  className="w-16 h-16 rounded-2xl bg-emerald-400 text-black flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-400/30"
                >
                  🎉
                </motion.div>
                <h3 className="text-lg font-bold text-white">Reward Credited!</h3>
                <p className="text-xs text-emerald-400 font-medium">
                  +5 TRB Points successfully added to your quota balance.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 bg-white text-black font-bold text-xs rounded-xl shadow hover:bg-neutral-200 transition-all cursor-pointer"
                  >
                    Start Generating Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Anti-Skip Warning Notification Banner */}
          {skipAttempted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 text-rose-300 text-xs flex items-center justify-center gap-2"
            >
              <ShieldAlert size={14} />
              <span>Watch the full video to claim your +5 TRB Points!</span>
            </motion.div>
          )}

          {/* Footer Note */}
          <div className="p-4 bg-neutral-900 text-center text-[11px] text-neutral-400 border-t border-white/5 space-y-1">
            <p>
              Rewarded video ads directly support server verification &amp; news scraping infrastructure.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
