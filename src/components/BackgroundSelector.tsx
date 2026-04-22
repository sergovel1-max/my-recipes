import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, X, Upload, Check } from 'lucide-react';

interface BackgroundSelectorProps {
  currentBackground: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
}

const PRESET_BACKGROUNDS = [
  { url: 'https://images.unsplash.com/photo-1495195134817-325d54e146c9?w=1920&q=80', label: 'Еда 1' },
  { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80', label: 'Еда 2' },
  { url: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1920&q=80', label: 'Еда 3' },
  { url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1920&q=80', label: 'Овощи' },
  { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=80', label: 'Пицца' },
  { url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1920&q=80', label: 'Блины' },
  { url: 'https://images.unsplash.com/photo-1482049016gy-22e7c634c5c?w=1920&q=80', label: 'Фрукты' },
  { url: 'https://images.unsplash.com/photo-1606787366850-de6330128b86?w=1920&q=80', label: 'Приготовление' },
];

export function BackgroundSelector({ currentBackground, onChange, onUpload }: BackgroundSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (err) {
      console.error('Failed to upload background:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center ios-button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Изменить фон"
      >
        <Image className="w-5 h-5" />
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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[80vh] bg-black/90 border border-white/10 rounded-3xl overflow-hidden z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Фон приложения</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>

              {/* Upload Button */}
              <div className="p-6 border-b border-white/10">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-4 rounded-2xl bg-white/10 border-2 border-dashed border-white/30 text-white font-medium flex items-center justify-center gap-3 hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Загрузить свой фон
                    </>
                  )}
                </button>
              </div>

              {/* Preset Grid */}
              <div className="p-6 overflow-y-auto">
                <p className="text-white/50 text-sm mb-4">Готовые фоны</p>
                <div className="grid grid-cols-2 gap-3">
                  {PRESET_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.url}
                      onClick={() => {
                        onChange(bg.url);
                        setIsOpen(false);
                      }}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                        currentBackground === bg.url
                          ? 'border-white ring-2 ring-white/50'
                          : 'border-white/20 hover:border-white/50'
                      }`}
                    >
                      <img
                        src={bg.url}
                        alt={bg.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <span className="absolute bottom-2 left-2 text-white text-sm font-medium">
                        {bg.label}
                      </span>
                      {currentBackground === bg.url && (
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
