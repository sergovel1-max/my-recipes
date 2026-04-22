import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isDarkTheme: boolean;
}

export function SearchBar({ value, onChange, isDarkTheme }: SearchBarProps) {
  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={`rounded-2xl flex items-center px-4 py-3 ${isDarkTheme ? 'glass' : 'bg-white/80 shadow-lg border border-gray-200'}`}>
        <Search className={`w-5 h-5 mr-3 flex-shrink-0 ${isDarkTheme ? 'text-white/50' : 'text-gray-500'}`} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Поиск рецептов..."
          className={`flex-1 bg-transparent outline-none text-base ${isDarkTheme ? 'text-white placeholder-white/40' : 'text-gray-800 placeholder-gray-400'}`}
        />
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onChange('')}
            className={`ml-2 p-1 rounded-full transition-colors ${isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
          >
            <X className={`w-4 h-4 ${isDarkTheme ? 'text-white/50' : 'text-gray-500'}`} />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
