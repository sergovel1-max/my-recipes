import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

interface ThemeSelectorProps {
  isDarkTheme: boolean;
  onChange: (isDark: boolean) => void;
}

export function ThemeSelector({ isDarkTheme, onChange }: ThemeSelectorProps) {
  const toggleTheme = () => {
    onChange(!isDarkTheme);
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center ios-button border transition-colors ${
        isDarkTheme 
          ? 'bg-white/10 text-white border-white/20' 
          : 'bg-gray-800 text-white border-gray-600'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isDarkTheme ? 'Переключить на светлую' : 'Переключить на тёмную'}
    >
      {isDarkTheme ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </motion.button>
  );
}
