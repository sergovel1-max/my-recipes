import { motion } from 'framer-motion';
import { LayoutGrid, Tag, Settings } from 'lucide-react';
import type { Category, CategoryConfig } from '../types';

interface CategoryFilterProps {
  categories: CategoryConfig[];
  selected: Category;
  onSelect: (category: Category) => void;
  onManage?: () => void;
  isDarkTheme: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  all: LayoutGrid,
};

export function CategoryFilter({ categories, selected, onSelect, onManage, isDarkTheme }: CategoryFilterProps) {
  return (
    <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
      {categories.map((category) => {
        const Icon = iconMap[category.id] || Tag;
        const isSelected = selected === category.id;
        
        return (
          <motion.button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`relative flex flex-col items-center gap-2 min-w-[64px] p-3 rounded-2xl transition-all duration-300 ios-button ${
              isSelected 
                ? (isDarkTheme ? 'glass' : 'bg-white shadow-md border border-gray-200') 
                : (isDarkTheme ? 'bg-white/5 hover:bg-white/10' : 'bg-white/70 hover:bg-white border border-gray-200')
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isSelected 
                ? (isDarkTheme ? 'bg-white/20' : 'bg-gray-100') 
                : (isDarkTheme ? 'bg-white/5' : 'bg-gray-50')
            }`}>
              <Icon className={`w-5 h-5 ${
                isSelected 
                  ? (isDarkTheme ? 'text-white' : 'text-gray-800') 
                  : (isDarkTheme ? 'text-white/60' : 'text-gray-500')
              }`} />
            </div>
            <span className={`text-xs font-medium ${
              isSelected 
                ? (isDarkTheme ? 'text-white' : 'text-gray-800') 
                : (isDarkTheme ? 'text-white/50' : 'text-gray-600')
            }`}>
              {category.label}
            </span>
            {isSelected && (
              <motion.div
                className={`absolute -bottom-1 w-1 h-1 rounded-full ${isDarkTheme ? 'bg-white' : 'bg-blue-500'}`}
                layoutId="category-indicator"
              />
            )}
          </motion.button>
        );
      })}
      
      {/* Manage categories button */}
      {onManage && (
        <motion.button
          onClick={onManage}
          className={`relative flex flex-col items-center gap-2 min-w-[64px] p-3 rounded-2xl transition-all duration-300 ios-button ${
            isDarkTheme ? 'bg-white/5 hover:bg-white/10' : 'bg-white/70 hover:bg-white border border-gray-200'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkTheme ? 'bg-white/5' : 'bg-gray-50'}`}>
            <Settings className={`w-5 h-5 ${isDarkTheme ? 'text-white/60' : 'text-gray-500'}`} />
          </div>
          <span className={`text-xs font-medium ${isDarkTheme ? 'text-white/50' : 'text-gray-600'}`}>Настройки</span>
        </motion.button>
      )}
    </div>
  );
}
