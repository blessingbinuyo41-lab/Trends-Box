import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, X } from 'lucide-react';

const Logo = React.memo(function Logo({ className = "w-8 h-8" }: { className?: string }) {
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

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Generation?",
  message = "This action cannot be undone. The generation will be permanently removed from your history."
}: ConfirmationModalProps) {
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25,
              duration: 0.3 
            }}
            className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-black/5 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Logo className="w-10 h-10" />
                <h2 className="text-lg font-bold tracking-tight">Trends Box</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-xl transition-colors text-black/40 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 space-y-6">
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
                  className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto"
                >
                  <Trash2 size={28} className="text-red-500" />
                </motion.div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight text-black">
                    {title}
                  </h3>
                  <p className="text-sm text-black/60 leading-relaxed max-w-sm mx-auto">
                    {message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-[#F5F5F5] hover:bg-black/5 text-black font-semibold rounded-xl transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}