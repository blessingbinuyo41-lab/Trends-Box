/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, memo } from 'react';
import { Search, History, Share2, FileText, Trash2, ExternalLink, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Loader as Loader2, ChevronRight, ChevronDown, Star, MessageSquare, X, LayoutDashboard, Globe, Zap, ChartBar as BarChart3, RotateCcw, LogOut, Lock, ShieldAlert, Copy, Check, ArrowRightLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import ConfirmationModal from './components/ConfirmationModal';
import DailyLimitModal from './components/DailyLimitModal';
import BugAntMascot from './components/BugAntMascot';
import BugReportModal from './components/BugReportModal';
import DuplicateTopicModal from './components/DuplicateTopicModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import { PrivacyPolicyModal, TermsModal } from './components/LegalModals';
import { NewsDisplay } from './components/NewsDisplay';
import { GenerationRecord, GenerationType, Category, NewsSource } from './types';
import { CATEGORIES, getReliabilityScore } from './constants';
import { generateEditorialCover, convertBlogToSocial } from './lib/editorialCover';
import { DAILY_LIMIT, getLocalUsageCount, incrementUsageCount, syncUsageWithServer, getNigeriaDateKey } from './lib/quota';
import { checkTopicDuplicate, DuplicateCheckResult, fetchRecentPlatformArticles } from './lib/duplicateService';

// Safe access to process.env for production builds

interface UsageBadgeProps {
  count: number;
  limit: number;
  isMobile?: boolean;
  onClick?: () => void;
}

const UsageBadge = memo(function UsageBadge({ count, limit, isMobile = false, onClick }: UsageBadgeProps) {
  const isExceeded = count >= limit;
  const isNearLimit = !isExceeded && count >= Math.floor(limit * 0.7);

  // Dynamic styling based on usage tier
  const colorStyles = isExceeded
    ? "bg-rose-50 text-rose-700 border-rose-200/90 shadow-xs ring-1 ring-rose-300/60"
    : isNearLimit
    ? "bg-amber-50 text-amber-800 border-amber-200/90 shadow-xs ring-1 ring-amber-200/40"
    : "bg-[#F5F5F5] hover:bg-neutral-100 text-neutral-800 border-neutral-200/80 shadow-xs";

  const iconColor = isExceeded
    ? "text-rose-600"
    : isNearLimit
    ? "text-amber-600"
    : "text-neutral-500";

  return (
    <button 
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border transition-all duration-300 select-none cursor-pointer active:scale-95 hover:brightness-95 ${colorStyles} ${
        isMobile ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
      title={`Daily Usage: ${count}/${limit} used today (Click to view limit details)`}
      role="status"
      aria-label={`Daily usage: ${count} of ${limit}. Click for details`}
    >
      <motion.div
        key={`icon-${count}`}
        animate={isExceeded ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : { scale: [1, 1.22, 1] }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex items-center justify-center shrink-0"
      >
        <BarChart3 
          size={isMobile ? 12 : 13} 
          className={`${iconColor} transition-colors`} 
        />
      </motion.div>
      <div className="flex items-center font-mono leading-none tracking-tight">
        <div className="relative overflow-hidden inline-flex items-center justify-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`count-${count}`}
              initial={{ y: -9, opacity: 0, scale: 0.75 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 9, opacity: 0, scale: 0.75 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="font-bold tabular-nums inline-block"
            >
              {count}
            </motion.span>
          </AnimatePresence>
        </div>
        <span className="opacity-40 font-semibold text-[10px] sm:text-[11px] ml-0.5">/{limit}</span>
      </div>
    </button>
  );
});

const Logo = memo(function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} bg-black rounded-lg md:rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-1`}>
      <img 
        src="/Trends_Box_Icon_20260302_211907_0000.png" 
        alt="Trends Box Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  );
});

export default function App() {
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [genType, setGenType] = useState<GenerationType>('blog');
  const [category, setCategory] = useState<Category>('General');
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<GenerationRecord | null>(null);
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [displayedHistory, setDisplayedHistory] = useState<GenerationRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<GenerationRecord | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateCheckResult | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [authView, setAuthView] = useState<'landing' | 'signin' | 'signup'>('landing');

  const ITEMS_PER_PAGE = 10;
  useEffect(() => {
    // Check if user came from a password recovery email link (#type=recovery)
    if (window.location.hash.includes('type=recovery')) {
      setIsResetPasswordOpen(true);
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // Listen for auth changes including PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordOpen(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistory();
      // Instantly load local usage for today (Nigeria Time) so user is never locked out
      const current = getLocalUsageCount(user.id);
      setUsageCount(current);

      // Non-blocking background sync with server
      syncUsageWithServer(user.id).then(cnt => {
        setUsageCount(cnt);
      });
    } else {
      setHistory([]);
      setDisplayedHistory([]);
      const guestUsage = getLocalUsageCount(null);
      setUsageCount(guestUsage);
    }
  }, [user]);

  // Automatic midnight rollover listener: constantly monitor Nigeria time (12:00 AM WAT)
  // to instantly unlock the daily limit without requiring a database query or hard reload
  useEffect(() => {
    const checkMidnightRollover = () => {
      const current = getLocalUsageCount(user?.id);
      setUsageCount(prev => {
        // If current count is 0 but state still had > 0, Nigeria midnight just passed!
        if (current === 0 && prev > 0) {
          setIsLimitModalOpen(false);
          return 0;
        }
        return current;
      });
    };

    const interval = setInterval(checkMidnightRollover, 5000);
    window.addEventListener('focus', checkMidnightRollover);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkMidnightRollover);
    };
  }, [user]);

  useEffect(() => {
    // Update displayed history when history changes
    const newDisplayed = history.slice(0, historyPage * ITEMS_PER_PAGE);
    setDisplayedHistory(newDisplayed);
    setHasMoreHistory(history.length > newDisplayed.length);
  }, [history, historyPage]);
  const handleReset = () => {
    setIsResetting(true);
    setResult(null);
    setSelectedHistoryItem(null);
    setActiveTab('generate');
    setManualInput('');
    setCategory('General');
    setGenType('blog');
    setHistoryPage(1);
    setTimeout(() => setIsResetting(false), 600);
  };

  const openDeleteModal = (id: string) => {
    setItemToDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDeleteId(null);
  };

  const handleConfirmDelete = () => {
    if (itemToDeleteId) {
      deleteHistory(itemToDeleteId);
    }
  };

  const fetchUsage = async () => {
    const local = getLocalUsageCount(user?.id);
    setUsageCount(local);
    if (user?.id) {
      syncUsageWithServer(user.id).then(cnt => setUsageCount(cnt));
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setHistory((data || []).map((item: any) => ({
        ...item,
        imageUrl: item.image_url,
        timestamp: item.created_at || new Date().toISOString(),
        sources: typeof item.sources === 'string' ? JSON.parse(item.sources) : item.sources
      })));
      setHistoryPage(1); // Reset pagination when fetching new history
    } catch (err) {
      console.error('Supabase history fetch failed', err);
      const localHistory = JSON.parse(localStorage.getItem('trendsbox_history') || '[]');
      setHistory(localHistory);
      setHistoryPage(1);
    }
  };

  const loadMoreHistory = () => {
    if (hasMoreHistory) {
      setHistoryPage(prev => prev + 1);
    }
  };

  const handleGenerate = async () => {
    // If user provided a manual topic, pre-check if this exact story was already covered in 24-48h
    if (manualInput.trim()) {
      try {
        const dupCheck = await checkTopicDuplicate(manualInput, category, user?.id, 48);
        if (dupCheck.isDuplicate && dupCheck.matchedRecord) {
          setDuplicateMatch(dupCheck);
          setDuplicateModalOpen(true);
          return;
        }
      } catch (dupErr) {
        console.warn('Pre-check duplicate skipped:', dupErr);
      }
    }

    await executeGeneration();
  };

  const executeGeneration = async (forceBypassDuplicate: boolean = false) => {
    const freshCount = getLocalUsageCount(user?.id);
    if (freshCount >= DAILY_LIMIT) {
      setUsageCount(freshCount);
      setIsLimitModalOpen(true);
      return;
    }
    setLoading(true);
    setProgress(0);
    setResult(null);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.floor(Math.random() * 10) + 1;
      });
    }, 500);

    try {
      const prompt = manualInput 
        ? `Generate a ${genType} post about: ${manualInput}. Category: ${category}. Focus on Nigerian context if applicable. ${genType === 'social' ? 'Keep it extremely minimal: just a catchy title and 1-2 sentences of key details.' : 'Provide a full, detailed blog post with an attractive title and human-like delivery.'}`
        : `Find the latest news in ${category} from popular Nigerian sources and generate a ${genType} post. ${genType === 'social' ? 'Keep it extremely minimal: just a catchy title and 1-2 sentences of key details.' : 'Provide a full, detailed blog post with an attractive title and human-like delivery.'}`;

      // Collect platform-wide recent titles to avoid duplicates in AI search
      let recentTitles = history.slice(0, 25).map(h => h.title);
      try {
        const platformRecent = await fetchRecentPlatformArticles(48, category);
        const combined = Array.from(new Set([...recentTitles, ...platformRecent.map(r => r.title)]));
        recentTitles = combined.slice(0, 30);
      } catch (err) {
        // Fall back to local history titles
      }

      // Call Netlify Function instead of direct API
      const response = await fetch('/.netlify/functions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, genType, category, recentTitles })
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse function response:', responseText);
        throw new Error(`Server Error (${response.status}): Invalid JSON response`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Server Error (${response.status})`);
      }

      // Check if generated title matches an existing article from the last 48 hours
      // (Unless the user previously chose "Generate Fresh Take Anyway")
      if (!forceBypassDuplicate && data.title) {
        try {
          const postGenDup = await checkTopicDuplicate(data.title, category, user?.id, 48);
          if (postGenDup.isDuplicate && postGenDup.matchedRecord) {
            clearInterval(interval);
            setLoading(false);
            setProgress(0);
            setDuplicateMatch(postGenDup);
            setDuplicateModalOpen(true);
            return;
          }
        } catch (postDupErr) {
          console.warn('Post-gen duplicate check skipped:', postDupErr);
        }
      }

      const imageUrl = data.imageUrl || generateEditorialCover(data.title, category);

      const enrichedSources = (data.sources || []).map((s: any) => ({
        ...s,
        reliabilityScore: getReliabilityScore(s.name)
      }));

      const newRecord: any = {
        id: Math.random().toString(36).substr(2, 9),
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        type: genType,
        category: category,
        image_url: imageUrl,
        sources: enrichedSources,
        user_id: user?.id,
        socialTitle: data.socialTitle,
        socialContent: data.socialContent,
        hashtags: data.hashtags
      };

      // Save to DB
      try {
        if (user) {
          // Prepare record for Supabase (snake_case)
          const dbRecord = {
            id: newRecord.id,
            user_id: user.id,
            title: newRecord.title,
            excerpt: newRecord.excerpt,
            content: newRecord.content,
            type: newRecord.type,
            category: newRecord.category,
            image_url: newRecord.image_url,
            sources: newRecord.sources
          };

          const { error: historyError } = await supabase
            .from('history')
            .insert([dbRecord]);
          
          if (historyError) throw historyError;
        }
      } catch (saveErr) {
        console.error('Supabase save failed', saveErr);
      }

      // Map back to UI format if necessary
      const uiRecord: GenerationRecord = {
        ...newRecord,
        imageUrl: newRecord.image_url,
        timestamp: new Date().toISOString(),
        socialTitle: data.socialTitle,
        socialContent: data.socialContent,
        hashtags: data.hashtags
      };

      setResult(uiRecord);
      setSelectedHistoryItem(uiRecord);
      setProgress(100);
      
      // Update local state
      setHistory(prev => [uiRecord, ...prev]);

      // Safely increment daily usage anchored to 12:00 AM Nigeria local time
      const nextUsage = await incrementUsageCount(user?.id);
      setUsageCount(nextUsage);
      if (nextUsage >= DAILY_LIMIT) {
        setTimeout(() => setIsLimitModalOpen(true), 1200);
      }
    } catch (err: any) {
      console.error('Generation failed:', err);
      if (err.message === 'API_KEY_MISSING') {
        alert('Gemini API Key is missing. Please ensure VITE_GEMINI_API_KEY is set in your Netlify environment variables and you have redeployed.');
      } else if (err.message?.includes('API_KEY_INVALID') || err.status === 403) {
        alert('Invalid API Key. Please check your Gemini API key in Netlify settings.');
      } else {
        alert('Failed to generate content. This could be due to a connection issue or API limit. Please check the console for details.');
      }
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const deleteHistory = async (id: string) => {
    try {
      if (user) {
        const { error } = await supabase
          .from('history')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        throw new Error('User not authenticated');
      }
    } catch (err) {
      console.warn('Supabase delete failed, falling back to localStorage', err);
      const localHistory = JSON.parse(localStorage.getItem('trendsbox_history') || '[]');
      localStorage.setItem('trendsbox_history', JSON.stringify(localHistory.filter((item: any) => item.id !== id)));
    }
    setHistory(prev => prev.filter(item => item.id !== id));
    if (selectedHistoryItem?.id === id) setSelectedHistoryItem(null);
  };

  const handleSaveAsSocial = async (newSocialItem: GenerationRecord) => {
    try {
      if (user) {
        const dbRecord = {
          id: newSocialItem.id,
          user_id: user.id,
          title: newSocialItem.title,
          excerpt: newSocialItem.excerpt,
          content: newSocialItem.content,
          type: 'social',
          category: newSocialItem.category,
          image_url: newSocialItem.imageUrl,
          sources: newSocialItem.sources
        };
        const { error } = await supabase.from('history').insert([dbRecord]);
        if (error) console.warn('Supabase social save fallback:', error);
      }
    } catch (err) {
      console.warn('Supabase social save failed, falling back to localStorage', err);
    }
    const localHistory = JSON.parse(localStorage.getItem('trendsbox_history') || '[]');
    localStorage.setItem('trendsbox_history', JSON.stringify([newSocialItem, ...localHistory]));

    setHistory(prev => [newSocialItem, ...prev]);
    setSelectedHistoryItem(newSocialItem);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <Loader2 className="animate-spin text-black/20" size={40} />
      </div>
    );
  }

  if (!user) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onGetStarted={() => setAuthView('signup')}
          onSignIn={() => setAuthView('signin')}
        />
      );
    }

    return (
      <Auth
        initialMode={authView === 'signup' ? 'signup' : 'signin'}
        onBackToLanding={() => setAuthView('landing')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden h-16 bg-white border-b border-black/5 flex items-center justify-between px-3 sm:px-4 sticky top-0 z-40 gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <Logo />
          <h1 className="text-sm font-bold tracking-tight hidden sm:block">Trends Box</h1>
        </div>

        {/* Mobile Tabs in Header */}
        <div className="flex p-1 bg-[#F5F5F5] rounded-xl flex-1 max-w-[170px] sm:max-w-[200px]">
          <button 
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${activeTab === 'generate' ? 'bg-white shadow-sm text-black' : 'text-black/40'}`}
          >
            Generate
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-black' : 'text-black/40'}`}
          >
            Results
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <UsageBadge count={usageCount} limit={DAILY_LIMIT} isMobile onClick={() => setIsLimitModalOpen(true)} />

          <button 
            onClick={handleReset}
            className="p-1.5 sm:p-2 hover:bg-black/5 rounded-lg transition-colors shrink-0 text-black/40 hover:text-black"
            title="Reset App"
          >
            <motion.div
              animate={{ 
                rotate: isResetting ? -360 : 0,
                scale: isResetting ? [1, 0.8, 1.2, 1] : 1
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <RotateCcw size={18} />
            </motion.div>
          </button>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 sm:p-2 hover:bg-black/5 rounded-lg transition-colors shrink-0"
          >
            {mobileMenuOpen ? <X size={20} /> : <LayoutDashboard size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar - History */}
      <aside 
        className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-30
          w-80 bg-white border-r border-black/5 flex flex-col h-screen
          transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
            <div className="p-6 border-b border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Logo className="w-10 h-10" />
                <h1 className="text-xl font-bold tracking-tight">Trends Box</h1>
              </div>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="p-2.5 bg-[#F5F5F5] hover:bg-red-50 text-black/40 hover:text-red-500 rounded-xl transition-all"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-black/40 uppercase tracking-wider">
                  <History size={14} />
                  History
                </div>
                <button className="lg:hidden p-1" onClick={() => setMobileMenuOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              
              {history.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-3">
                    <History size={20} className="text-black/20" />
                  </div>
                  <p className="text-sm text-black/40">No generations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item, index) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSelectedHistoryItem(item);
                        setActiveTab('history');
                        setMobileMenuOpen(false);
                      }}
                      className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedHistoryItem?.id === item.id 
                        ? 'bg-black text-white border-black shadow-lg' 
                        : 'bg-white border-black/5 hover:border-black/20'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm font-medium line-clamp-2 leading-snug flex-1">
                          {item.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(item.id);
                          }}
                          className="p-1.5 text-black/40 hover:text-red-500 rounded-lg transition-all shrink-0"
                          title="Delete generation"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[10px] opacity-60">
                        <span className="px-1.5 py-0.5 bg-black/10 rounded uppercase font-bold">
                          {item.category}
                        </span>
                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Footer Watermark */}
            <div className="p-4 border-t border-black/5 bg-neutral-50/70 text-center space-y-1 text-[11px] text-neutral-500">
              <div className="flex items-center justify-center gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowTermsModal(true)} 
                  className="hover:text-black transition-colors underline cursor-pointer"
                >
                  Terms
                </button>
                <span aria-hidden="true">·</span>
                <button 
                  type="button" 
                  onClick={() => setShowPrivacyModal(true)} 
                  className="hover:text-black transition-colors underline cursor-pointer"
                >
                  Privacy
                </button>
              </div>
              <p className="text-[10px] text-neutral-400">
                With ❤️ from <span className="font-semibold text-neutral-700">Binuyo Legacy Hub</span>
              </p>
            </div>
          </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <header className="hidden lg:flex h-16 bg-white border-b border-black/5 items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setActiveTab('generate')}
              className={`text-sm font-medium transition-colors ${activeTab === 'generate' ? 'text-black' : 'text-black/40 hover:text-black/60'}`}
            >
              Generate
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`text-sm font-medium transition-colors ${activeTab === 'history' ? 'text-black' : 'text-black/40 hover:text-black/60'}`}
            >
              View Results
            </button>
          </div>
          <div className="flex items-center gap-3">
            <UsageBadge count={usageCount} limit={DAILY_LIMIT} onClick={() => setIsLimitModalOpen(true)} />

            <button 
              onClick={handleReset}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors text-black/40 hover:text-black flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
              title="Reset App"
            >
              <motion.div
                animate={{ 
                  rotate: isResetting ? -360 : 0,
                  scale: isResetting ? [1, 0.8, 1.2, 1] : 1
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <RotateCcw size={16} />
              </motion.div>
              Reset
            </button>
            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50/50 backdrop-blur-sm text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100/50">
              <div className="relative flex h-2 w-2">
                <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div>
                <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></div>
              </div>
              Live Search Verification
            </div>
          </div>
        </header>

        <div className="px-4 py-6 md:p-8 max-w-4xl mx-auto w-full flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'generate' ? (
              <motion.div 
                key="generate-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 md:space-y-8"
              >
                {!result && !loading && (
                  <motion.div 
                    key="welcome-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-black text-white p-8 md:p-12 rounded-[2rem] overflow-hidden relative shadow-xl"
                    style={{
                      backgroundImage: 'url("/trends_box_dashboard_card copy.png")',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    {/* Gradient overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    <div className="relative z-10 space-y-4 max-w-lg">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest border border-white/10">
                        <Zap size={12} className="text-yellow-400" />
                        Welcome to Trends Box
                      </div>
                      <h2 className="text-2xl md:text-5xl font-bold tracking-tight leading-tight">
                        Aggregating Nigeria's <span className="text-white/40 italic font-serif">Top Stories</span> in Real-time.
                      </h2>
                      <p className="text-white/60 text-xs md:text-base leading-relaxed">
                        Select a category and generation type below to start crafting professional news updates from trusted sources.
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-black/5 shadow-sm space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight">Craft New Content</h2>
                  <p className="text-sm md:text-base text-black/50">Select your preferences and let Trends Box do the magic.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-black/40">Generation Type</label>
                    <div className="relative flex p-1 bg-[#F5F5F5] rounded-xl overflow-hidden">
                      <motion.div 
                        className="absolute top-1 bottom-1 left-1 bg-white shadow-sm rounded-lg z-0"
                        initial={false}
                        animate={{ 
                          x: genType === 'blog' ? 0 : '100%',
                          width: 'calc(50% - 4px)'
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                      <button 
                        onClick={() => setGenType('blog')}
                        className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors ${genType === 'blog' ? 'text-black' : 'text-black/40 hover:text-black/60'}`}
                      >
                        Blog Post
                      </button>
                      <button 
                        onClick={() => setGenType('social')}
                        className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors ${genType === 'social' ? 'text-black' : 'text-black/40 hover:text-black/60'}`}
                      >
                        Social Media
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 relative">
                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-black/40">Category</label>
                    <button 
                      onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                      className="w-full bg-[#F5F5F5] border-none rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center justify-between hover:bg-black/5 transition-all group"
                    >
                      <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-black/20 group-hover:bg-black/40 transition-colors" />
                        {category}
                      </span>
                      <ChevronDown size={16} className={`transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {isCategoryOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsCategoryOpen(false)} 
                          />
                          <motion.div 
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/5 rounded-2xl shadow-xl z-20 overflow-hidden"
                          >
                            <div className="p-2">
                              {CATEGORIES.map(c => (
                                <button
                                  key={c}
                                  onClick={() => {
                                    setCategory(c);
                                    setIsCategoryOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${category === c ? 'bg-black text-white' : 'hover:bg-black/5'}`}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-black/40">Custom Guidance (Optional)</label>
                  <textarea 
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        if (usageCount >= DAILY_LIMIT) {
                          setIsLimitModalOpen(true);
                        } else if (!loading) {
                          handleGenerate();
                        }
                      }
                    }}
                    placeholder={
                      usageCount >= DAILY_LIMIT
                        ? "Daily generation quota reached (10/10). Resets tonight at midnight 00:00."
                        : "e.g. Focus on the recent fuel price changes in Lagos..."
                    }
                    className="w-full bg-[#F5F5F5] border-none rounded-2xl px-4 py-4 text-sm min-h-[100px] md:min-h-[120px] focus:ring-2 focus:ring-black transition-all"
                  />
                </div>

                {/* Inline Generation Limit Blocking Notice */}
                {usageCount >= DAILY_LIMIT && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="p-4 bg-rose-50/90 border border-rose-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 text-rose-800">
                      <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200/80 flex items-center justify-center shrink-0 text-rose-600">
                        <ShieldAlert size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-rose-950 text-xs sm:text-sm">Daily Generation Quota Reached (10/10)</div>
                        <div className="text-rose-700/80 text-[11px] leading-relaxed">Further generation is blocked until the counter automatically resets at midnight.</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLimitModalOpen(true)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs shrink-0 transition-all shadow-xs cursor-pointer text-center"
                    >
                      Limit Details
                    </button>
                  </motion.div>
                )}

                <button 
                  onClick={() => {
                    if (usageCount >= DAILY_LIMIT) {
                      setIsLimitModalOpen(true);
                      return;
                    }
                    handleGenerate();
                  }}
                  disabled={loading}
                  className={`w-full py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    usageCount >= DAILY_LIMIT
                      ? 'bg-neutral-900 text-rose-400 hover:bg-black border border-rose-500/30 shadow-md'
                      : 'bg-black text-white hover:bg-black/90 shadow-md hover:shadow-lg'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Crafting The Content...
                    </>
                  ) : usageCount >= DAILY_LIMIT ? (
                    <>
                      <Lock size={18} className="text-rose-400" />
                      <span>Daily Limit Reached (10/10) • Locked</span>
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      Witness The Magic
                    </>
                  )}
                </button>
              </div>

              {loading && (
                <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-black/5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-black/40">Processing</span>
                    <span className="text-xs md:text-sm font-bold">{progress}%</span>
                  </div>
                  <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-black"
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] md:text-xs text-center text-black/40 animate-pulse">
                    Scanning Nigerian news sources, verifying reliability, and crafting your summary...
                  </p>
                </div>
              )}

              {result && !loading && (
                <motion.div 
                  key="result-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl md:rounded-2xl text-emerald-700">
                    <CheckCircle2 size={20} />
                    <span className="text-xs md:text-sm font-medium">Content successfully generated and saved to history!</span>
                  </div>
                  <NewsDisplay item={result} onSaveAsSocial={handleSaveAsSocial} />
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="history-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 md:space-y-8"
            >
              {selectedHistoryItem ? (
                <div className="space-y-6">
                  <button 
                    onClick={() => setSelectedHistoryItem(null)}
                    className="flex items-center gap-2 text-sm font-medium text-black/40 hover:text-black transition-colors"
                  >
                    <ChevronRight className="rotate-180" size={16} />
                    Back to History
                  </button>
                  <NewsDisplay item={selectedHistoryItem} onSaveAsSocial={handleSaveAsSocial} />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight">Generation History</h2>
                    <p className="text-sm md:text-base text-black/50">View and manage your previous generations.</p>
                  </div>

                  {displayedHistory.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History size={24} className="text-black/20" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No generations yet</h3>
                      <p className="text-black/40 mb-6">Start generating content to see your history here.</p>
                      <button 
                        onClick={() => setActiveTab('generate')}
                        className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-black/90 transition-all"
                      >
                        Generate Content
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {displayedHistory.map((item, index) => (
                        <motion.div 
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setSelectedHistoryItem(item)}
                          className="group bg-white p-6 rounded-2xl border border-black/5 hover:border-black/20 transition-all cursor-pointer shadow-sm hover:shadow-md"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded">
                                  {item.category}
                                </span>
                                <span className="px-2 py-0.5 bg-black/5 text-black/60 text-[10px] font-bold uppercase tracking-widest rounded">
                                  {item.type === 'social' ? 'Social' : 'Blog'}
                                </span>
                                <span className="text-[10px] text-black/40 font-medium">
                                  {new Date(item.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold line-clamp-2 leading-snug group-hover:text-black/80 transition-colors">
                                {item.title}
                              </h3>
                              <p className="text-sm text-black/60 line-clamp-2 leading-relaxed">
                                {item.excerpt}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal(item.id);
                                }}
                                className="p-2 text-black/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete generation"
                              >
                                <Trash2 size={16} />
                              </button>
                              <ChevronRight size={16} className="text-black/20 group-hover:text-black/40 transition-colors" />
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {hasMoreHistory && (
                        <button
                          onClick={loadMoreHistory}
                          className="w-full p-3 text-center text-sm font-medium text-black/40 hover:text-black hover:bg-black/5 rounded-xl transition-all border border-dashed border-black/10 hover:border-black/20"
                        >
                          Load More ({history.length - displayedHistory.length} remaining)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Brand Signature Footer Watermark */}
        <footer className="mt-auto py-8 px-4 border-t border-black/5 bg-white/50 text-center space-y-2">
          <div className="flex items-center justify-center gap-3 text-xs text-neutral-500 font-medium">
            <button 
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="hover:text-black transition-colors underline cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
            <span aria-hidden="true">·</span>
            <button 
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-black transition-colors underline cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
          <p className="text-xs text-neutral-500 font-medium">
            With ❤️ from <span className="font-bold text-neutral-800">Binuyo Legacy Hub</span>
          </p>
        </footer>
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      {/* Daily Limit Modal */}
      <DailyLimitModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        onViewHistory={() => {
          setActiveTab('history');
          if (history.length > 0 && !selectedHistoryItem) {
            setSelectedHistoryItem(history[0]);
          }
        }}
        currentUsage={usageCount}
        maxLimit={DAILY_LIMIT}
        onResetQuota={() => setUsageCount(0)}
      />

      {/* Interactive Bug Ant Mascot */}
      <BugAntMascot onOpenReport={() => setIsBugReportOpen(true)} />

      {/* Bug Report Floating Modal */}
      <BugReportModal
        isOpen={isBugReportOpen}
        onClose={() => setIsBugReportOpen(false)}
        userEmail={user?.email || ''}
        userName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''}
      />

      {/* Duplicate Topic Detection Modal */}
      {duplicateMatch && duplicateMatch.matchedRecord && (
        <DuplicateTopicModal
          isOpen={duplicateModalOpen}
          onClose={() => {
            setDuplicateModalOpen(false);
            setDuplicateMatch(null);
          }}
          matchedRecord={duplicateMatch.matchedRecord}
          isCurrentUser={duplicateMatch.isCurrentUser}
          timeAgoText={duplicateMatch.timeAgoText}
          matchedKeywords={duplicateMatch.matchedKeywords}
          onViewExisting={() => {
            // View existing article without consuming any quota (0 quota used)
            const matched = duplicateMatch.matchedRecord!;
            setResult(matched);
            setSelectedHistoryItem(matched);
            setActiveTab('generate');
            setDuplicateModalOpen(false);
            setDuplicateMatch(null);
          }}
          onProceedAnyway={() => {
            // User insists on generating a fresh angle anyway (1 quota upon success)
            setDuplicateModalOpen(false);
            setDuplicateMatch(null);
            executeGeneration(true);
          }}
        />
      )}

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        onSuccess={() => {
          setIsResetPasswordOpen(false);
          // Clean hash from URL without reloading
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
      />

      {/* Legal Modals */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </div>
  );
}
