import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, FileText, Lock, Globe, Scale } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: LegalModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden z-10 text-neutral-900 my-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white p-6 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Privacy Policy</h3>
                  <p className="text-xs text-neutral-400">Trends Box Nigeria · Last updated October 2026</p>
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

          {/* Body */}
          <div className="p-6 md:p-8 space-y-5 max-h-[68vh] overflow-y-auto text-xs text-neutral-600 leading-relaxed">
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-neutral-900">1. Commitment to Privacy</h4>
              <p>
                Trends Box Nigeria ("we", "our", or "the Platform"), managed by Binuyo Legacy Hub, respects your personal data. This policy explains what information we collect, how it is used, and how it is secured.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-neutral-900">2. Information We Collect</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Account Credentials:</strong> Your name and email address when creating an account or resetting your password.</li>
                <li><strong>Generation Records:</strong> Titles, excerpts, and editorial blogs or social card content generated during your sessions, stored in your private history.</li>
                <li><strong>Technical Diagnostics:</strong> Browser environment, screen dimensions, and Nigerian time (WAT) sent solely when filing bug reports or calculating daily quotas.</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-neutral-900">3. How We Use Information</h4>
              <p>
                We do not sell, rent, or trade your personal data. We use collected information strictly to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide editorial blog generation and social media formatting.</li>
                <li>Enforce fair daily usage quotas reset automatically at 12:00 AM West Africa Time (WAT).</li>
                <li>Detect duplicate trending stories across recent 24–48 hour news cycles to avoid repetitive coverage.</li>
                <li>Respond to feedback and bug submissions filed via our Bug Ant Hunter support desk.</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-neutral-900">4. Third-Party Integrations</h4>
              <p>
                Authentication and database storage are securely managed through Supabase with encrypted connections. Issue reporting forms and screenshot evidence links are dispatched via Formspree directly to our designated support team.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-neutral-900">5. Contact Us</h4>
              <p>
                For privacy inquiries or account data deletion requests, contact Binuyo Legacy Hub support at <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-800">blessingbinuyo41@gmail.com</code>.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-neutral-50 border-t border-black/5 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Understood &amp; Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function TermsModal({ isOpen, onClose }: LegalModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden z-10 text-neutral-900 my-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white p-6 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center shadow-md">
                  <Scale size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Terms &amp; Conditions</h3>
                  <p className="text-xs text-neutral-400">Trends Box Nigeria · Binuyo Legacy Hub</p>
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

          {/* Body */}
          <div className="p-6 md:p-8 space-y-5 max-h-[68vh] overflow-y-auto text-xs text-neutral-600 leading-relaxed">
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-neutral-900">1. Acceptance of Terms</h4>
              <p>
                By signing up for or using Trends Box Nigeria, you agree to comply with and be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use the service.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-neutral-900">2. Editorial &amp; Source Attribution</h4>
              <p>
                Trends Box synthesizes live verified public news reports from premier Nigerian outlets (including The Punch, Vanguard, Premium Times, TheCable, and Daily Post). Generated editorial articles and social media cards reference original sources. Users are encouraged to verify critical facts against the linked source platforms before broad publication.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-neutral-900">3. Daily Generation Quota &amp; Fair Use</h4>
              <p>
                To maintain high service availability, each account is allocated a daily quota of 10 generations, which automatically resets at midnight (12:00 AM West Africa Time). Any attempt to bypass quotas via automated scripts, scrapers, or abusive traffic will result in account suspension.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-neutral-900">4. Content Ownership</h4>
              <p>
                You retain ownership of the generated editorial outputs created under your account for personal, journalistic, blog, or social media distribution purposes.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-neutral-900">5. Limitation of Liability</h4>
              <p>
                Trends Box is provided on an "as is" and "as available" basis. While we verify sources with high standards, Binuyo Legacy Hub is not liable for indirect damages, news developments occurring after generation time, or decisions made based on generated editorial copy.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-neutral-50 border-t border-black/5 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              I Agree &amp; Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
