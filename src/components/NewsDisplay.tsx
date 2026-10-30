import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  FileText, 
  MessageSquare, 
  ExternalLink, 
  Bookmark, 
  Send, 
  Hash, 
  Flame, 
  CheckCircle2, 
  BookmarkCheck,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { GenerationRecord, NewsSource } from '../types';
import { generateEditorialCover, convertBlogToSocial } from '../lib/editorialCover';
import { getDirectArticleLink, detectPlatform } from '../lib/sourceHelper';

export function extractSocialData(item: GenerationRecord): {
  headline: string;
  summary: string;
  bulletPoints: string[];
  hashtags: string[];
  fullShareText: string;
} {
  const converted = convertBlogToSocial(item);
  const headline = converted.socialTitle;
  const summary = converted.socialExcerpt;
  const bulletPoints = converted.keyPoints;
  const hashtags = converted.hashtags;
  const bulletSection = bulletPoints.length > 0 ? bulletPoints.map(b => `• ${b}`).join('\n') : '';
  const fullShareText = `${headline}\n\n${summary}${bulletSection ? `\n\n${bulletSection}` : ''}\n\n${hashtags.join(' ')}`;

  return {
    headline,
    summary,
    bulletPoints,
    hashtags,
    fullShareText
  };
}

interface NewsDisplayProps {
  item: GenerationRecord;
  onSaveAsSocial?: (newRecord: GenerationRecord) => void;
  isSavingSocial?: boolean;
}

export const NewsDisplay = memo(function NewsDisplay({ 
  item, 
  onSaveAsSocial,
  isSavingSocial = false 
}: NewsDisplayProps) {
  // Allow toggling view format: 'blog' or 'social'
  const [currentFormat, setCurrentFormat] = useState<'blog' | 'social'>(item.type);
  const [copied, setCopied] = useState(false);
  const [hasSavedSocial, setHasSavedSocial] = useState(false);

  const socialData = extractSocialData(item);

  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(socialData.fullShareText);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(socialData.fullShareText);
    const url = `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSaveSocial = () => {
    if (!onSaveAsSocial) return;
    const newSocialRecord: GenerationRecord = {
      ...item,
      id: Math.random().toString(36).substring(2, 11),
      title: socialData.headline,
      excerpt: socialData.summary,
      content: socialData.fullShareText,
      type: 'social',
      timestamp: new Date().toISOString()
    };
    onSaveAsSocial(newSocialRecord);
    setHasSavedSocial(true);
  };

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl border border-black/5 shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Top Format Switcher / Conversion Bar */}
      <div className="bg-neutral-50/90 border-b border-black/5 px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-200/60 rounded-xl">
          <button
            type="button"
            onClick={() => setCurrentFormat('blog')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentFormat === 'blog'
                ? 'bg-white text-black shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <FileText size={13} />
            <span>Editorial Blog</span>
          </button>
          
          <button
            type="button"
            onClick={() => setCurrentFormat('social')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentFormat === 'social'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <MessageSquare size={13} />
            <span>Social Card</span>
            {item.type === 'blog' && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[9px] font-black rounded uppercase">
                Converted
              </span>
            )}
          </button>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2">
          {item.type === 'blog' && currentFormat === 'blog' && (
            <button
              type="button"
              onClick={() => setCurrentFormat('social')}
              className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Sparkles size={13} className="text-amber-400" />
              <span>Convert to Social Format</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleCopy(currentFormat === 'social' ? socialData.fullShareText : `${item.title}\n\n${item.excerpt}\n\n${item.content}`)}
            className="p-2 hover:bg-black/5 text-neutral-600 hover:text-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Copy formatted text"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span className="hidden sm:inline">Copy Text</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Authentic Cover Image (Clean & Unobstructed, No Duplicate Title Overlay) */}
      {(() => {
        const coverSrc = item.imageUrl || generateEditorialCover(item.title, item.category);
        const isSvgCover = coverSrc.startsWith('data:image/svg+xml');

        return (
          <div className="aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden bg-neutral-950 relative group">
            <img 
              src={coverSrc} 
              alt={item.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                const fallback = generateEditorialCover(item.title, item.category);
                if (target.src !== fallback) {
                  target.onerror = null;
                  target.src = fallback;
                }
              }}
            />

            {/* Subtle, unobtrusive press photo badge on authentic photos without any duplicate title or obscuring overlays */}
            {!isSvgCover && (
              <div className="absolute bottom-3 right-3 pointer-events-none">
                <span className="px-2.5 py-1 bg-black/75 backdrop-blur-md text-white/90 text-[10px] font-semibold tracking-wide rounded-md border border-white/10 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Verified Press Photo
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Main Content Area */}
      <div className="p-6 md:p-10 space-y-8">

        <AnimatePresence mode="wait">
          {currentFormat === 'social' ? (
            /* SOCIAL DESIGNED VIEW (Exact Match to Social Generation Output) */
            <motion.div
              key="social-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Social Card Box */}
              <div className="bg-gradient-to-br from-neutral-900 to-black text-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl space-y-6 border border-neutral-800">
                {/* Social Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center p-1">
                      <img src="/Trends_Box_Icon_20260302_211907_0000.png" alt="Trends Box" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs tracking-tight">
                        <span>Trends Box Nigeria</span>
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[9px] font-black">✓</div>
                      </div>
                      <div className="text-[10px] text-white/40">Real-time Verified News Feed</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Breaking
                  </span>
                </div>

                {/* Social Hook / Headline */}
                <div className="space-y-3">
                  <h2 className="text-lg md:text-2xl font-bold tracking-tight text-white leading-snug">
                    {socialData.headline}
                  </h2>
                  <p className="text-sm md:text-base text-neutral-300 leading-relaxed font-normal bg-white/5 p-4 rounded-xl border border-white/5">
                    {socialData.summary}
                  </p>
                </div>

                {/* Bullet Highlights */}
                {socialData.bulletPoints.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      Key Takeaways & Highlights
                    </div>
                    <div className="space-y-2">
                      {socialData.bulletPoints.map((bullet, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-200">
                          <span className="text-amber-400 text-base leading-none">•</span>
                          <span className="leading-relaxed">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hashtags */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                  {socialData.hashtags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-emerald-400 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer"
                      onClick={() => handleCopy(tag)}
                      title="Click to copy hashtag"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Social Interactive Action Bar */}
                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleShareTwitter}
                      className="px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
                    >
                      <span>Share on X</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="px-3.5 py-2 bg-emerald-600/80 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Share on WhatsApp</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.type === 'blog' && onSaveAsSocial && (
                      <button
                        type="button"
                        onClick={handleSaveSocial}
                        disabled={hasSavedSocial || isSavingSocial}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          hasSavedSocial
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white text-black hover:bg-neutral-200 active:scale-95'
                        }`}
                      >
                        {hasSavedSocial ? (
                          <>
                            <BookmarkCheck size={14} />
                            <span>Saved to Social History</span>
                          </>
                        ) : (
                          <>
                            <Bookmark size={14} />
                            <span>Save as Social Post</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopy(socialData.fullShareText)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copied ? 'Copied!' : 'Copy Post'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* FULL EDITORIAL BLOG VIEW */
            <motion.div
              key="blog-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Editorial Title & Category Metadata Header */}
              <div className="space-y-3 pb-6 border-b border-black/5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-black text-white text-[10px] md:text-[11px] font-black uppercase tracking-wider rounded-md shadow-xs">
                    {item.category}
                  </span>
                  <span className="px-2.5 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] md:text-[11px] font-bold uppercase tracking-wider rounded-md border border-black/5">
                    Full Editorial
                  </span>
                  <span className="text-[11px] text-neutral-400 font-medium ml-auto">
                    {new Date(item.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-neutral-950 tracking-tight leading-tight">
                  {item.title}
                </h1>
              </div>

              <p className="text-lg md:text-xl text-black/70 italic font-serif leading-relaxed border-l-4 border-black/20 pl-6">
                {item.excerpt}
              </p>

              <div className="prose prose-sm md:prose-base max-w-none text-black/85 leading-relaxed space-y-4 whitespace-pre-wrap font-medium">
                {item.content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reference Sources */}
        <div className="pt-8 border-t border-black/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-black/40">Verified Sources</h3>
              <p className="text-[10px] text-black/30">Verified across {item.sources?.length || 0} trusted Nigerian news outlets</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.sources?.map((source: NewsSource, idx: number) => {
                const verifiedUrl = getDirectArticleLink(source, item.title);
                const platformMeta = detectPlatform(source.url || '');
                const platformName = source.platform || platformMeta.platform;
                const score = source.reliabilityScore || platformMeta.reliabilityScore;

                return (
                  <a 
                    key={idx}
                    href={verifiedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Read original verified article on ${platformName}: ${source.name}`}
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all group border border-black/5 hover:border-black/20"
                  >
                    <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                      <Globe size={12} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black uppercase tracking-tighter leading-none group-hover:text-black">
                          {platformName}
                        </span>
                        <ExternalLink size={10} className="text-black/30 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <span className="text-[8px] text-black/40 font-medium truncate max-w-[130px] group-hover:text-black/60">
                        {source.name}
                      </span>
                    </div>
                    <div className="ml-1 px-1.5 py-0.5 bg-emerald-50 rounded-md border border-emerald-100 shrink-0">
                      <span className="text-[9px] font-black text-emerald-600">
                        {score}%
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
