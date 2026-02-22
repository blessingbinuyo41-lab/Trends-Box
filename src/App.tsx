/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  Search, 
  History, 
  Share2, 
  FileText, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  Star,
  MessageSquare,
  X,
  LayoutDashboard,
  Globe,
  Zap,
  BarChart3,
  RotateCcw,
  LogOut,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationRecord, GenerationType, Category, NewsSource } from './types';
import { CATEGORIES, getReliabilityScore } from './constants';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const DAILY_LIMIT = 20;

const Logo = memo(function Logo({ className = "w-8 h-8" }: { className?: string }) {
  // To use your own logo image later:
  // 1. Upload your logo to GitHub
  // 2. Get the "Raw" URL (e.g., https://raw.githubusercontent.com/user/repo/main/logo.png)
  // 3. Replace the <Zap /> line below with:
  //    <img src="YOUR_GITHUB_RAW_URL" alt="Logo" className="w-full h-full object-contain" />
  
  return (
    <div className={`${className} bg-black rounded-lg md:rounded-xl flex items-center justify-center text-white shrink-0 overflow-hidden`}>
      <Zap size={className.includes('w-10') ? 24 : 18} />
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
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<GenerationRecord | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    fetchHistory();
    fetchUsage();
  }, []);

  const handleReset = () => {
    setIsResetting(true);
    setResult(null);
    setSelectedHistoryItem(null);
    setActiveTab('generate');
    setManualInput('');
    setCategory('General');
    setGenType('blog');
    setTimeout(() => setIsResetting(false), 600);
  };

  const fetchUsage = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('usage')
        .select('count')
        .eq('user_id', session.session.user.id)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch usage', error);
        return;
      }

      setUsageCount(data?.count || 0);
    } catch (err) {
      console.error('Failed to fetch usage', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch history', error);
        return;
      }

      const formattedHistory = data.map(item => ({
        id: item.id,
        title: item.title || '',
        excerpt: item.excerpt || '',
        content: item.content || '',
        type: item.type as GenerationType,
        category: item.category as Category,
        imageUrl: item.image_url || '',
        sources: item.sources || [],
        timestamp: item.created_at
      }));

      setHistory(formattedHistory);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const saveToHistory = async (record: GenerationRecord) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { error } = await supabase
        .from('history')
        .insert({
          id: record.id,
          user_id: session.session.user.id,
          title: record.title,
          excerpt: record.excerpt,
          content: record.content,
          type: record.type,
          category: record.category,
          image_url: record.imageUrl,
          sources: record.sources
        });

      if (error) {
        console.error('Failed to save history', error);
        return;
      }

      // Update usage count
      const today = new Date().toISOString().split('T')[0];
      const { error: usageError } = await supabase
        .from('usage')
        .upsert({
          user_id: session.session.user.id,
          date: today,
          count: usageCount + 1
        }, {
          onConflict: 'user_id,date'
        });

      if (usageError) {
        console.error('Failed to update usage', usageError);
      }
    } catch (err) {
      console.error('Failed to save to database', err);
    }
  };

  const deleteHistory = async (id: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { error } = await supabase
        .from('history')
        .delete()
        .eq('id', id)
        .eq('user_id', session.session.user.id);

      if (error) {
        console.error('Delete failed', error);
        return;
      }

      setHistory(prev => prev.filter(item => item.id !== id));
      if (selectedHistoryItem?.id === id) setSelectedHistoryItem(null);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  const oldFetchUsage = async () => {
    try {
      const res = await fetch('/api/usage');
      const data = await res.json();
      setUsageCount(data.count);
    } catch (err) {
      console.error('Failed to fetch usage', err);
    }
  };

  const oldFetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data.map((item: any) => ({
        ...item,
        sources: JSON.parse(item.sources)
      })));
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleGenerate = async () => {
    if (usageCount >= DAILY_LIMIT) {
      alert('Daily generation limit reached. Please try again tomorrow.');
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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              content: { type: Type.STRING },
              sources: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    url: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["title", "excerpt", "content", "sources"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      
      // Generate Image
      let imageUrl = '';
      try {
        const imgResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: `A professional news image for: ${data.title}. Style: Realistic, high quality.` }]
          },
          config: {
            imageConfig: { aspectRatio: "16:9" }
          }
        });
        
        for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (imgErr) {
        console.error('Image generation failed', imgErr);
      }

      const enrichedSources = (data.sources || []).map((s: any) => ({
        ...s,
        reliabilityScore: getReliabilityScore(s.name)
      }));

      const newRecord: GenerationRecord = {
        id: Math.random().toString(36).substr(2, 9),
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        type: genType,
        category: category,
        imageUrl: imageUrl,
        sources: enrichedSources,
        timestamp: new Date().toISOString()
      };

      // Save to DB
      await saveToHistory(newRecord);

      setResult(newRecord);
      setSelectedHistoryItem(newRecord);
      setProgress(100);
      
      // Update local state immediately for real-time feel
      setHistory(prev => [newRecord, ...prev]);
      setUsageCount(prev => prev + 1);
    } catch (err) {
      console.error('Generation failed', err);
      alert('Failed to generate content. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden h-16 bg-white border-b border-black/5 flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2 shrink-0">
          <Logo />
          <h1 className="text-sm font-bold tracking-tight hidden sm:block">Trends Box</h1>
        </div>

        {/* Mobile Tabs in Header */}
        <div className="flex p-1 bg-[#F5F5F5] rounded-xl mx-4 flex-1 max-w-[200px]">
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

        <button 
          onClick={handleReset}
          className="p-2 hover:bg-black/5 rounded-lg transition-colors shrink-0 text-black/40 hover:text-black"
          title="Reset App"
        >
          <motion.div
            animate={{ 
              rotate: isResetting ? -360 : 0,
              scale: isResetting ? [1, 0.8, 1.2, 1] : 1
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <RotateCcw size={20} />
          </motion.div>
        </button>

        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-black/5 rounded-lg transition-colors shrink-0"
        >
          {mobileMenuOpen ? <X size={24} /> : <LayoutDashboard size={24} />}
        </button>
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
            <div className="p-6 border-bottom border-black/5 hidden lg:flex items-center gap-3">
              <Logo className="w-10 h-10" />
              <h1 className="text-xl font-bold tracking-tight">Trends Box</h1>
            </div>

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
                            deleteHistory(item.id);
                          }}
                          className="opacity-40 hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 hover:bg-red-500 hover:text-white rounded-lg transition-all shrink-0"
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

            <div className="p-6 border-t border-black/5 bg-black/[0.02]">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black/40">
                    <BarChart3 size={12} />
                    Daily Usage
                  </div>
                  <span className={`text-[10px] font-bold ${usageCount >= DAILY_LIMIT ? 'text-red-500' : 'text-black/60'}`}>
                    {usageCount}/{DAILY_LIMIT}
                  </span>
                </div>
                <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${usageCount >= DAILY_LIMIT ? 'bg-red-500' : 'bg-black'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((usageCount / DAILY_LIMIT) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-black/30 leading-tight">
                  {usageCount >= DAILY_LIMIT 
                    ? "Limit reached. Upgrade for more generations." 
                    : `${DAILY_LIMIT - usageCount} generations remaining for today.`}
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
          <div className="flex gap-8">
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-black/5 rounded-full text-xs">
              <User size={14} className="text-black/40" />
              <span className="font-medium text-black/60 truncate max-w-[120px]">
                {user?.email}
              </span>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors text-black/40 hover:text-black flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
              title="Sign Out"
            >
              <LogOut size={16} />
              Sign Out
            </button>
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
                  >
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
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl -ml-16 -mb-16" />
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
                    placeholder="e.g. Focus on the recent fuel price changes in Lagos..."
                    className="w-full bg-[#F5F5F5] border-none rounded-2xl px-4 py-4 text-sm min-h-[100px] md:min-h-[120px] focus:ring-2 focus:ring-black transition-all"
                  />
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full bg-black text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      Generate News Update
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
                      initial={{ width: 0 }}
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
                  <NewsDisplay item={result} />
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
                    Back to Selection
                  </button>
                  <NewsDisplay item={selectedHistoryItem} />
                </div>
              ) : (
                <div className="text-center py-12 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-black/5">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LayoutDashboard size={24} className="text-black/20 md:hidden" />
                    <LayoutDashboard size={32} className="text-black/20 hidden md:block" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold">Select a record from history</h3>
                  <p className="text-sm text-black/40 mt-2 px-4">Your generated news updates will appear here.</p>
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

const NewsDisplay = memo(function NewsDisplay({ item }: { item: GenerationRecord }) {
  return (
    <div className="bg-white rounded-2xl md:rounded-3xl border border-black/5 shadow-sm overflow-hidden flex flex-col">
      {item.imageUrl && (
        <div className="aspect-[21/9] w-full overflow-hidden bg-black/5 relative">
          <img 
            src={item.imageUrl} 
            alt={item.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6 md:p-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-white text-black text-[8px] md:text-[10px] font-bold uppercase tracking-widest rounded">
                  {item.category}
                </span>
                <span className="px-2 py-0.5 bg-black/40 backdrop-blur-md text-white text-[8px] md:text-[10px] font-bold uppercase tracking-widest rounded">
                  {item.type === 'social' ? 'Social' : 'Blog'}
                </span>
              </div>
              <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight leading-tight drop-shadow-lg">
                {item.title}
              </h1>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-6 md:p-10 space-y-8">
        {!item.imageUrl && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-black text-white text-[8px] md:text-[10px] font-bold uppercase tracking-widest rounded">
                {item.category}
              </span>
              <span className="text-[8px] md:text-xs font-bold text-black/40 uppercase tracking-widest">
                {item.type === 'social' ? 'Social Content' : 'Blog Post'}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight">
              {item.title}
            </h1>
          </div>
        )}

        <div className="space-y-6">
          <p className="text-lg md:text-xl text-black/60 italic font-serif leading-relaxed border-l-4 border-black/10 pl-6">
            {item.excerpt}
          </p>

          <div className="prose prose-sm md:prose-base max-w-none text-black/80 leading-relaxed space-y-4 whitespace-pre-wrap font-medium">
            {item.content}
          </div>
        </div>

        <div className="pt-8 border-t border-black/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-black/40">Reference Sources</h3>
              <p className="text-[10px] text-black/30">Verified across {item.sources.length} trusted Nigerian news outlets</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.sources.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F5] rounded-lg hover:bg-black hover:text-white transition-all group border border-black/5"
                >
                  <Globe size={12} className="text-black/40 group-hover:text-white/40" />
                  <span className="text-[10px] font-bold truncate max-w-[100px]">{source.name}</span>
                  <div className="w-1 h-1 rounded-full bg-black/10 group-hover:bg-white/20" />
                  <span className="text-[10px] font-bold text-emerald-500 group-hover:text-emerald-400">
                    {source.reliabilityScore}%
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
