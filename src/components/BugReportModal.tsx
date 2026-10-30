import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';
import { submitBugReport, getStoredFormspreeId, BugReportResult } from '../lib/supportService';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

const CATEGORIES = [
  'News Source Mismatch',
  'Image / Cover Photo',
  'Daily Limit / Reset Issue',
  'Social Format Generation',
  'Layout / UI Glitch',
  'Other Bug / Feedback'
];

export default function BugReportModal({
  isOpen,
  onClose,
  userEmail = '',
  userName = ''
}: BugReportModalProps) {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; size: string; url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<BugReportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Formspree ID from env or saved setting
  const formspreeId = getStoredFormspreeId();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync user info on change
  useEffect(() => {
    if (userName && !name) setName(userName);
    if (userEmail && !email) setEmail(userEmail);
  }, [userName, userEmail]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // File selection & preview generation
  const handleFileChange = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    setErrorMessage(null);

    const incoming = Array.from(newFiles);
    const combined = [...files, ...incoming];

    if (combined.length > 2) {
      setErrorMessage('You can attach a maximum of 2 screenshot images.');
      return;
    }

    // Verify file types and sizes (max 5MB each)
    for (const f of incoming) {
      if (!f.type.startsWith('image/')) {
        setErrorMessage(`"${f.name}" is not an image. Please attach PNG, JPG, or WebP files.`);
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        setErrorMessage(`"${f.name}" exceeds 5MB limit.`);
        return;
      }
    }

    setFiles(combined);

    // Generate previews
    const previews: { name: string; size: string; url: string }[] = [];
    combined.forEach(file => {
      previews.push({
        name: file.name,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        url: URL.createObjectURL(file)
      });
    });
    setFilePreviews(previews);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = filePreviews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setFilePreviews(updatedPreviews);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!subject.trim()) {
      setErrorMessage('Please enter a short subject for the issue.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage('Please provide a brief description of what happened (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await submitBugReport({
        name,
        email,
        category,
        subject,
        description,
        files,
        formspreeId
      });

      setSubmitResult(result);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrorMessage(err.message || 'Failed to submit bug report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitResult(null);
    setSubject('');
    setDescription('');
    setFiles([]);
    setFilePreviews([]);
    setErrorMessage(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden my-8 z-10"
          >
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 text-white p-6 relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-400 text-black flex items-center justify-center text-2xl shadow-lg shrink-0">
                    🪲
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold tracking-tight text-white">Bug Ant Hunter</h2>
                      <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 text-[9px] font-black uppercase tracking-wider rounded-full border border-amber-400/30">
                        Live Support
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Spot a glitch or error? Tell us and we will squash it immediately.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              {submitResult ? (
                /* Success View */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center space-y-5"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto text-3xl shadow-sm">
                    🎯
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-neutral-900">Bug Report Dispatched!</h3>
                    <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
                      Thank you for reporting! We have recorded your issue along with your evidence screenshots. Our engineering team has been notified.
                    </p>
                  </div>

                  {submitResult.screenshotUrls.length > 0 && (
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-black/5 text-left space-y-2 max-w-md mx-auto">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Attached Evidence ({submitResult.screenshotUrls.length})
                      </span>
                      <div className="flex gap-2">
                        {submitResult.screenshotUrls.map((url, i) => (
                          <div key={i} className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5 font-medium truncate">
                            <CheckCircle2 size={13} />
                            <span>Screenshot #{i + 1} Saved</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResetAndClose}
                      className="px-6 py-3 bg-black hover:bg-neutral-800 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
                    >
                      Done &amp; Return to App
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Bug Report Form */
                <form onSubmit={handleSubmit} className="space-y-5">
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs"
                    >
                      <AlertCircle size={16} className="text-rose-600 shrink-0" />
                      <span>{errorMessage}</span>
                    </motion.div>
                  )}

                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Blessing Binuyo"
                        required
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                        Account Email *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. user@gmail.com"
                        required
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Issue Category */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Issue Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            category === cat
                              ? 'bg-black text-white shadow-xs'
                              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Subject / Headline of the Issue *
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Verified source link redirected to homepage instead of article"
                      required
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                        Describe What Happened *
                      </label>
                      <span className="text-[10px] text-neutral-400">
                        {description.length} chars
                      </span>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please describe what you were doing, what went wrong, and what you expected to see..."
                      rows={4}
                      required
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all resize-y min-h-[90px]"
                    />
                  </div>

                  {/* Screenshots Evidence Upload (Max 2 images) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                        <ImageIcon size={14} className="text-amber-500" />
                        <span>Screenshot Evidence (Max 2 Images)</span>
                      </label>
                      <span className="text-[10px] text-neutral-400">
                        {files.length}/2 attached
                      </span>
                    </div>

                    {/* Dropzone */}
                    {files.length < 2 && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleFileChange(e.dataTransfer.files);
                        }}
                        className="border-2 border-dashed border-black/15 hover:border-black/30 bg-neutral-50/70 hover:bg-neutral-50 rounded-2xl p-4 text-center cursor-pointer transition-all group"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleFileChange(e.target.files)}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-8 h-8 rounded-full bg-neutral-200/80 group-hover:bg-amber-400 group-hover:text-black flex items-center justify-center transition-colors">
                            <Upload size={14} />
                          </div>
                          <span className="text-xs font-semibold text-neutral-700">
                            Click to upload or drag &amp; drop screenshots
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            PNG, JPG, or WebP up to 5MB each
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Previews */}
                    {filePreviews.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {filePreviews.map((preview, idx) => (
                          <div
                            key={idx}
                            className="relative group rounded-xl border border-black/10 overflow-hidden bg-neutral-100 aspect-video flex items-center justify-center"
                          >
                            <img
                              src={preview.url}
                              alt={preview.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-2">
                              <span className="text-[9px] text-white font-mono truncate max-w-[80px]">
                                {preview.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                                title="Remove screenshot"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-[8px] font-mono rounded">
                              {preview.size}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 hover:text-black hover:bg-neutral-100 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Dispatching Report...</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>Submit Bug Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
