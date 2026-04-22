import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, X, Check } from 'lucide-react';

interface GradientSelectorProps {
  currentGradient: string;
  onChange: (gradient: string) => void;
}

const PRESET_GRADIENTS = [
  { 
    value: 'from-orange-500 via-red-500 to-purple-600',
    label: 'Закат',
    preview: 'bg-gradient-to-br from-orange-500 via-red-500 to-purple-600'
  },
  { 
    value: 'from-blue-500 via-cyan-400 to-teal-500',
    label: 'Океан',
    preview: 'bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-500'
  },
  { 
    value: 'from-emerald-400 via-green-500 to-teal-600',
    label: 'Природа',
    preview: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600'
  },
  { 
    value: 'from-purple-500 via-pink-500 to-rose-500',
    label: 'Розовый',
    preview: 'bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500'
  },
  { 
    value: 'from-amber-400 via-orange-500 to-red-500',
    label: 'Оранжевый',
    preview: 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500'
  },
  { 
    value: 'from-indigo-500 via-purple-500 to-pink-500',
    label: 'Фиолетовый',
    preview: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
  },
  { 
    value: 'from-slate-800 via-gray-900 to-black',
    label: 'Тёмный',
    preview: 'bg-gradient-to-br from-slate-800 via-gray-900 to-black'
  },
  { 
    value: 'from-rose-400 via-red-500 to-orange-500',
    label: 'Красный',
    preview: 'bg-gradient-to-br from-rose-400 via-red-500 to-orange-500'
  },
];

export function GradientSelector({ currentGradient, onChange }: GradientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center ios-button border border-white/30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Изменить фон"
      >
        <Palette className="w-5 h-5" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">Фон приложения</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>

              {/* Gradient Grid */}
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  {PRESET_GRADIENTS.map((gradient) => (
                    <button
                      key={gradient.value}
                      onClick={() => {
                        onChange(gradient.value);
                        setIsOpen(false);
                      }}
                      className={`relative h-24 rounded-2xl overflow-hidden transition-all ${gradient.preview} ${
                        currentGradient === gradient.value
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-95'
                          : 'hover:scale-95'
                      }`}
                    >
                      <div className="absolute inset-0 bg-black/20" />
                      <span className="absolute bottom-2 left-2 text-white font-medium text-sm drop-shadow-lg">
                        {gradient.label}
                      </span>
                      {currentGradient === gradient.value && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
