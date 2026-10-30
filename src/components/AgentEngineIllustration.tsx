import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Globe, Cpu, CheckCircle2, FileText, Share2, Layers } from 'lucide-react';

/**
 * 3D-perspective, hardware-accelerated animated AI Agent Engine illustration.
 * Uses GPU CSS 3D transforms (translateZ, rotateX, rotateY) and SVG data streams
 * with zero JS canvas overhead, guaranteeing 60fps scrolling on both mobile and desktop.
 */
export const AgentEngineIllustration = memo(function AgentEngineIllustration() {
  return (
    <div className="relative w-full max-w-xl mx-auto my-6 sm:my-8 perspective-[1200px]">
      {/* Outer Glow Halo */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-emerald-400/10 rounded-3xl blur-2xl pointer-events-none transform -translate-y-2" />

      {/* 3D Isometric Card Container */}
      <div 
        className="relative bg-gradient-to-b from-[#111622]/90 to-[#0A0D14]/95 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl overflow-hidden [transform:rotateX(6deg)_rotateY(0deg)] hover:[transform:rotateX(2deg)_rotateY(0deg)] transition-transform duration-500 will-change-transform"
      >
        {/* Subtle Background Circuit Grid */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(rgba(245, 158, 11, 0.8) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Top Process Status Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 font-bold">
              Autonomous Editorial Synthesis
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-400/90 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
            Engine v2.4 Live
          </span>
        </div>

        {/* Main 3-Stage Pipeline Illustration */}
        <div className="py-5 sm:py-6 relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          
          {/* Stage 1: Verified Sources Ingestion */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-white/[0.03] border border-white/5 rounded-2xl relative overflow-hidden group"
          >
            <div className="flex items-center gap-2 text-neutral-400 text-[10px] font-mono uppercase mb-2">
              <Globe size={13} className="text-sky-400" />
              <span>01. Ingestion</span>
            </div>
            <div className="text-xs font-bold text-white mb-1.5 flex items-center justify-between">
              <span>Verified Outlets</span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            </div>
            <div className="space-y-1 text-[10px] text-neutral-400">
              <div className="flex items-center justify-between">
                <span>Punch / Vanguard</span>
                <span className="text-emerald-400">98% Rel.</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Premium Times</span>
                <span className="text-emerald-400">99% Rel.</span>
              </div>
              <div className="flex items-center justify-between">
                <span>TheCable / DailyPost</span>
                <span className="text-emerald-400">97% Rel.</span>
              </div>
            </div>
          </motion.div>

          {/* Stage 2: Central AI Reasoning Core (3D Floating Pulse) */}
          <div className="relative flex flex-col items-center justify-center p-4 bg-gradient-to-b from-amber-500/10 to-amber-500/[0.02] border border-amber-400/30 rounded-2xl shadow-lg shadow-amber-500/10 overflow-hidden">
            {/* Ambient Rotating Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-2 border border-dashed border-amber-400/20 rounded-full pointer-events-none"
            />

            {/* Glowing Core Sphere */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 flex items-center justify-center text-black shadow-lg shadow-amber-500/30 relative z-10 mb-2"
            >
              <Cpu size={24} className="animate-spin [animation-duration:8s]" />
            </motion.div>

            <span className="text-[11px] font-bold text-white tracking-tight">AI Reasoning Agent</span>
            <span className="text-[9px] text-amber-300 font-mono mt-0.5">24-48h Anti-Duplicate</span>
            
            {/* Animated Data Stream Pulses */}
            <div className="flex items-center gap-1 mt-2">
              <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping [animation-duration:1.5s]" />
              <span className="text-[9px] text-neutral-400 font-mono">Synthesizing...</span>
            </div>
          </div>

          {/* Stage 3: Dual Output Formats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-white/[0.03] border border-white/5 rounded-2xl relative overflow-hidden"
          >
            <div className="flex items-center gap-2 text-neutral-400 text-[10px] font-mono uppercase mb-2">
              <Layers size={13} className="text-emerald-400" />
              <span>03. Publication</span>
            </div>
            <div className="text-xs font-bold text-white mb-1.5 flex items-center justify-between">
              <span>Dual Formats</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="space-y-1.5 text-[10px]">
              <div className="p-1.5 bg-black/40 rounded-lg border border-white/5 flex items-center gap-2 text-neutral-300">
                <FileText size={12} className="text-amber-400 shrink-0" />
                <span className="truncate">Editorial Longform Blog</span>
              </div>
              <div className="p-1.5 bg-black/40 rounded-lg border border-white/5 flex items-center gap-2 text-neutral-300">
                <Share2 size={12} className="text-emerald-400 shrink-0" />
                <span className="truncate">WhatsApp &amp; X Thread</span>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Bottom Real-time Telemetry Bar */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Zero Hallucinations · Press Photos Matched</span>
          </div>
          <span className="text-amber-300/80">WAT 12:00 AM Reset</span>
        </div>
      </div>
    </div>
  );
});
