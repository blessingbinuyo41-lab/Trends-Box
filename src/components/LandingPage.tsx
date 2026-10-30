import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Clock, 
  Layers, 
  CheckCircle2, 
  Flame, 
  ChevronRight,
  TrendingUp,
  FileText,
  Share2,
  Bug,
  Newspaper,
  Radio,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { PrivacyPolicyModal, TermsModal } from './LegalModals';
import { AgentEngineIllustration } from './AgentEngineIllustration';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

interface PipelineSample {
  id: string;
  category: string;
  categoryColor: string;
  sources: string;
  readTime: string;
  image: string;
  editorial: {
    title: string;
    lead: string;
    body: string;
    verification: string;
  };
  social: {
    hook: string;
    bullets: string[];
    hashtags: string;
  };
}

const PIPELINE_SAMPLES: PipelineSample[] = [
  {
    id: 'infra',
    category: 'Politics',
    categoryColor: 'bg-rose-500 text-white',
    sources: 'Punch · Vanguard · TheCable',
    readTime: '3 min read',
    image: '/trends_box_dashboard_card copy.png',
    editorial: {
      title: 'FG Unveils National Infrastructure Stabilization Framework Across 36 States',
      lead: 'ABUJA — In an executive briefing in the federal capital today, the Federal Government confirmed the mobilization of key implementation mechanisms for inter-state road networks.',
      body: 'The announcement, corroborated by financial disclosures from the Ministry of Works, sets a benchmark for contractor performance guarantees and milestone inspections across geo-political zones.',
      verification: 'Verified with The Punch & Vanguard newsroom archives'
    },
    social: {
      hook: '⚡ BREAKING: FG Discloses Key Framework For Nationwide Highway Modernization',
      bullets: [
        '₦4.2 Trillion capital expenditure targeted for key inter-state corridors',
        'Independent engineering audit boards activated in all 36 states',
        'Transparent digital milestone tracking for ongoing federal contracts'
      ],
      hashtags: '#Nigeria #Infrastructure #Lagos #Abuja #TrendsBox'
    }
  },
  {
    id: 'tech',
    category: 'Technology',
    categoryColor: 'bg-cyan-500 text-black',
    sources: 'BusinessDay · Premium Times · TechCabal',
    readTime: '2 min read',
    image: '/Trends_Box_Icon_20260302_211907_0000.png',
    editorial: {
      title: 'Nigeria Digital Economy Hub Surpasses $1.8B Foreign Direct Investment Milestone',
      lead: 'LAGOS — Financial disclosures from the National Information Technology Development Agency (NITDA) confirm a major surge in African tech venture capital allocations this quarter.',
      body: 'Propelled by fintech compliance reforms and cloud infrastructure expansions in Yaba and Victoria Island, local startups registered a 34% increase in foreign institutional backing.',
      verification: 'Verified with BusinessDay & Premium Times technology desk'
    },
    social: {
      hook: '🚀 TECH BOOM: Nigerian Tech Ecosystem Attracts $1.8B In Landmark Capital Inflows',
      bullets: [
        'Fintech and digital banking infrastructure capture 62% of incoming capital',
        'Over 14,000 high-skilled technical engineering jobs created year-to-date',
        'NITDA and Central Bank policy harmonizations cited as primary catalysts'
      ],
      hashtags: '#NigeriaTech #Lagos #Fintech #VentureCapital #TrendsBox'
    }
  },
  {
    id: 'sports',
    category: 'Sports',
    categoryColor: 'bg-emerald-500 text-black',
    sources: 'The Guardian NG · Daily Post · Punch',
    readTime: '2 min read',
    image: '/trends_box_dashboard_card copy.png',
    editorial: {
      title: 'NFF Secures World-Class European Pre-Tournament Training Camp for Super Eagles',
      lead: 'CAIRO / ABUJA — The Nigeria Football Federation has finalized terms for a state-of-the-art training camp ahead of continental qualifiers.',
      body: 'Following consultations with the technical committee, the squad will assemble in Madrid for biometric conditioning and closed-door friendlies before flying into Lagos.',
      verification: 'Verified with Daily Post & The Guardian sports correspondents'
    },
    social: {
      hook: '🦅 SUPER EAGLES: NFF Finalizes High-Performance European Base Camp',
      bullets: [
        '10-day intensive conditioning camp confirmed in Madrid, Spain',
        'Key European-based stars scheduled for early arrival & fitness drills',
        'Two international warm-up friendlies scheduled before home qualifiers'
      ],
      hashtags: '#SuperEagles #SoarSuperEagles #Nigeria #AFCON #TrendsBox'
    }
  }
];

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [activeTab, setActiveTab] = useState<'editorial' | 'social'>('editorial');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);

  const currentSample = PIPELINE_SAMPLES[selectedSampleIndex];

  return (
    <div className="min-h-screen bg-[#07090E] text-[#F3F4F6] selection:bg-amber-400 selection:text-black overflow-x-hidden relative font-sans">
      {/* Background Ambient Lighting & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(245,158,11,0.18),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.06),transparent_50%)] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Fixed Navigation Bar (Pinned to viewport top) */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#07090E]/95 border-b border-white/10 shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-black rounded-xl sm:rounded-2xl p-1.5 flex items-center justify-center shadow-md border border-white/10 shrink-0">
              <img 
                src="/Trends_Box_Icon_20260302_211907_0000.png" 
                alt="Trends Box Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-lg tracking-tight text-white whitespace-nowrap">
                  Trends Box
                </span>
                <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-amber-400 text-black shrink-0">
                  NG
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-neutral-400 font-medium tracking-wide truncate max-w-[160px] sm:max-w-none">
                Verified Editorial Intelligence
              </p>
            </div>
          </div>

          {/* Action Buttons - Compact, perfectly proportioned, no word-wrapping */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onSignIn}
              className="text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white px-2.5 sm:px-3.5 py-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Get Started</span>
              <ArrowRight size={13} className="shrink-0" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section (With offset to account for pinned header) */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Live Pulse Tag */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-medium text-neutral-300 mb-6 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Coverage Across All States &amp; Verified Global Desks</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15]"
        >
          Transform Nigerian Breaking News into{' '}
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
            Publish-Ready Editorial Stories
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-sm sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed"
        >
          Stop writing from rumors. Trends Box verifies breaking reports directly from Punch, Vanguard, Premium Times &amp; TheCable, crafting comprehensive blogs, viral social summaries, and contextual covers in seconds.
        </motion.p>

        {/* 3D Loop Animated AI Agent Engine Illustration (Performance Optimized) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 sm:mt-8 w-full"
        >
          <AgentEngineIllustration />
        </motion.div>

        {/* Key Guarantee Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-8 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto text-left"
        >
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">100% Verified</div>
            <div className="text-xs text-neutral-400 mt-1">Direct links to original articles</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-400">Zero Duplicates</div>
            <div className="text-xs text-neutral-400 mt-1">24–48h newsroom recency radar</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">24Hrs Quota Reset</div>
            <div className="text-xs text-neutral-400 mt-1">Automated midnight Nigeria reset</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">Dual Output</div>
            <div className="text-xs text-neutral-400 mt-1">Full Blog &amp; Social Card format</div>
          </div>
        </motion.div>
      </section>

      {/* Futuristic Interactive Preview Bento */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Intelligent Newsroom Pipeline
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Designed for Nigerian Publishers, Creators &amp; Journalists
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto">
            Experience how Trends Box searches, extracts authentic photo assets, verifies sources, and generates twin output formats.
          </p>
        </div>

        {/* Interactive Device Viewport */}
        <div className="rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 p-3 sm:p-6 shadow-2xl backdrop-blur-2xl">
          {/* Top Mock Window Controls */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-neutral-400 hidden sm:inline">
                trendsbox.ng/preview
              </span>
            </div>

            {/* Topic Sample Selector Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-neutral-400 mr-1 shrink-0">
                 Demo:
              </span>
              {PIPELINE_SAMPLES.map((sample, idx) => (
                <button
                  key={sample.id}
                  onClick={() => setSelectedSampleIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    selectedSampleIndex === idx
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-rose-400' : idx === 1 ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                  <span>{sample.category}</span>
                </button>
              ))}
            </div>

            {/* Smooth Sliding Format Toggle Pill */}
            <div className="relative flex items-center p-1 bg-black/70 rounded-xl border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('editorial')}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 z-10 ${
                  activeTab === 'editorial' ? 'text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <FileText size={13} className="shrink-0" />
                <span>Editorial Blog</span>
                {activeTab === 'editorial' && (
                  <motion.div
                    layoutId="activePipelineTabPill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg shadow-md -z-10"
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('social')}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 z-10 ${
                  activeTab === 'social' ? 'text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Share2 size={13} className="shrink-0" />
                <span>Social Share</span>
                {activeTab === 'social' && (
                  <motion.div
                    layoutId="activePipelineTabPill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg shadow-md -z-10"
                  />
                )}
              </button>
            </div>
          </div>

          {/* Interactive Preview Content Card with Smooth Animation Transitions */}
          <div className="bg-[#0D1117] rounded-2xl border border-white/10 overflow-hidden text-left shadow-xl relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentSample.id}-${activeTab}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                {/* Cover Banner with Editorial Kicker */}
                <div className="relative aspect-video sm:aspect-[21/9] bg-neutral-900 overflow-hidden">
                  <motion.img 
                    key={currentSample.image}
                    initial={{ scale: 1.05, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 0.85 }}
                    transition={{ duration: 0.5 }}
                    src={currentSample.image} 
                    alt={currentSample.editorial.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/50 to-transparent" />
                  
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${currentSample.categoryColor}`}>
                        {currentSample.category}
                      </span>
                      <span className="text-xs text-neutral-300 font-medium">
                        {currentSample.sources} · {currentSample.readTime}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-2xl font-bold text-white tracking-tight leading-snug drop-shadow-sm">
                      {activeTab === 'editorial' ? currentSample.editorial.title : currentSample.social.hook}
                    </h3>
                  </div>
                </div>

                {/* Animated Body: Editorial Longform vs. Social Share Thread */}
                <div className="p-4 sm:p-7 space-y-4">
                  {activeTab === 'editorial' ? (
                    <motion.div 
                      key="editorial-view"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.22 }}
                      className="space-y-3.5 text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans"
                    >
                      <p className="font-semibold text-white text-sm sm:text-base leading-snug border-l-2 border-amber-400 pl-3">
                        {currentSample.editorial.lead}
                      </p>
                      <p className="text-neutral-400 leading-relaxed">
                        {currentSample.editorial.body}
                      </p>
                      <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 size={15} className="shrink-0" />
                        <span>{currentSample.editorial.verification}</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="social-view"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.22 }}
                      className="space-y-3 text-xs sm:text-sm text-neutral-300"
                    >
                      <div className="p-4 bg-white/[0.04] rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <span className="text-[11px] font-mono text-amber-300 font-bold uppercase tracking-wider">
                            Ready for WhatsApp &amp; X Broadcast
                          </span>
                          <span className="text-[10px] text-neutral-400">⚡ 1-Tap Copyable</span>
                        </div>
                        <p className="font-bold text-white text-xs sm:text-sm leading-snug">
                          {currentSample.social.hook}
                        </p>
                        <ul className="text-xs text-neutral-300 space-y-1.5 pl-1">
                          {currentSample.social.bullets.map((bullet, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-[11px] font-mono text-amber-300 font-semibold pt-1">
                          {currentSample.social.hashtags}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Engineered for Precision
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Six Technological Breakthroughs in Trends Box
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-amber-400/30 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
              <Globe size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Direct Verified Outlets</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Strictly routes to authentic article URLs from The Punch, Vanguard, Premium Times, Daily Post, and TheCable, completely bypassing homepages and ad-walls.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-amber-400/30 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Duplicate Topic Radar</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Cross-references recent 24–48h coverage. Alerts you if a story is already written so you can view existing coverage with 0 quota deducted.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-amber-400/30 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-400/10 text-sky-400 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Midnight WAT Reset</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Anchored strictly to 12:00 AM West Africa Time (Africa/Lagos). Daily generation quotas roll over automatically without requiring unlock requests.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-amber-400/30 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-400/10 text-purple-400 flex items-center justify-center">
              <Newspaper size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Contextual Cover Photos</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Extracts genuine press photographs directly from newsroom sources or crafts respectful editorial graphics, eliminating mismatched faces and hallucinations.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-amber-400/30 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-400/10 text-rose-400 flex items-center justify-center">
              <Bug size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Bug Hunter Desk</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Draggable, interactive bug mascot with instant hide-and-seek mechanics. Users can attach evidence screenshots delivered directly to our engineering email.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-amber-400/30 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
              <Layers size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">1-Click Social Conversion</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Transform multi-paragraph investigative reports into punchy bullet summaries with trending hashtags, ready for WhatsApp channels, X, and LinkedIn.
            </p>
          </div>
        </div>
      </section>

      {/* Conversion Banner */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="p-8 sm:p-14 rounded-[2.5rem] bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-black text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
            Ready to Supercharge Your Editorial Workflow?
          </h2>
          <p className="text-sm sm:text-base font-medium max-w-xl mx-auto text-black/80 leading-relaxed">
            Create your account in 30 seconds. Get 10 verified daily generations with zero setup required.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-black hover:bg-neutral-900 text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Get Started Now</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={onSignIn}
              className="px-6 py-4 bg-black/70 hover:bg-red/20 text-grey font-bold text-sm rounded-2xl transition-all cursor-pointer"
            >
              Existing Member? Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5 text-center space-y-4">
        <div className="flex items-center justify-center gap-4 text-xs text-neutral-400 font-medium">
          <button 
            onClick={() => setShowTerms(true)}
            className="hover:text-white transition-colors underline cursor-pointer"
          >
            Terms &amp; Conditions
          </button>
          <span>·</span>
          <button 
            onClick={() => setShowPrivacy(true)}
            className="hover:text-white transition-colors underline cursor-pointer"
          >
            Privacy Policy
          </button>
        </div>
        <p className="text-xs text-neutral-400 font-medium">
          With ❤️ from <span className="font-bold text-white">Binuyo Legacy Hub</span>
        </p>
        <p className="text-[11px] text-neutral-600">
          © {new Date().getFullYear()} Trends Box Nigeria. All rights reserved.
        </p>
      </footer>

      {/* Legal Modals */}
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}
