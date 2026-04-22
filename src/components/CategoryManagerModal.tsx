import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Pencil, Check } from 'lucide-react';
import type { CategoryConfig } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryConfig[];
  onAdd: (label: string) => void;
  onUpdate: (id: string, newLabel: string) => void;
  onDelete: (id: string) => void;
}

export function CategoryManagerModal({ 
  isOpen, 
  onClose, 
  categories, 
  onAdd, 
  onUpdate, 
  onDelete 
}: CategoryManagerModalProps) {
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const handleAdd = () => {
    if (newLabel.trim()) {
      onAdd(newLabel.trim());
      setNewLabel('');
    }
  };

  const handleStartEdit = (cat: CategoryConfig) => {
    setEditingId(cat.id);
    setEditLabel(cat.label);
  };

  const handleSaveEdit = () => {
    if (editingId && editLabel.trim()) {
      onUpdate(editingId, editLabel.trim());
      setEditingId(null);
      setEditLabel('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 m-auto w-full max-w-md h-fit max-h-[80vh] bg-black/90 border border-white/10 rounded-3xl overflow-hidden z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Категории</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Add new category */}
            <div className="p-6 border-b border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Новая категория"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd();
                  }}
                />
                <button
                  onClick={handleAdd}
                  disabled={!newLabel.trim()}
                  className="px-4 py-3 rounded-xl bg-white/20 text-white font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Categories list */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {categories.filter(c => c.id !== 'all').map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                  >
                    {editingId === cat.id ? (
                      <>
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="p-2 rounded-lg bg-green-500/20 text-green-400"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 rounded-lg bg-white/10 text-white/60"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-white">{cat.label}</span>
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="p-2 rounded-lg bg-white/10 text-white/60 hover:text-white transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(cat.id)}
                          className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
