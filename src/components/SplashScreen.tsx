import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ChefHat, Utensils, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onLogin: () => void;
}

const CORRECT_PASSWORD = '1111';
const AUTH_KEY = 'culinary-blog-auth';

export function SplashScreen({ onLogin }: SplashScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  // Check if already authenticated
  useEffect(() => {
    const isAuth = localStorage.getItem(AUTH_KEY);
    if (isAuth === 'true') {
      onLogin();
      return;
    }

    // Simulate loading for smooth animation
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setShowContent(true), 100);
    }, 1500);

    return () => clearTimeout(timer);
  }, [onLogin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === CORRECT_PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true');
      setShowContent(false);
      setTimeout(onLogin, 500);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <ChefHat className="w-16 h-16 text-white/80" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/60 text-lg"
          >
            Загрузка...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Background with food image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80"
          alt="Food background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 10, -10, 0]
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          >
            {i % 3 === 0 && <Sparkles className="w-6 h-6 text-white/20" />}
            {i % 3 === 1 && <Utensils className="w-5 h-5 text-white/15" />}
            {i % 3 === 2 && <ChefHat className="w-7 h-7 text-white/10" />}
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 h-full flex flex-col items-center justify-center px-6"
          >
            {/* Logo and title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center mb-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center"
              >
                <ChefHat className="w-12 h-12 text-white" />
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-5xl md:text-6xl font-bold text-white mb-4"
              >
                Мои рецепты
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-white/60 text-lg"
              >
                Ваша личная кулинарная книга
              </motion.p>
            </motion.div>

            {/* Password form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onSubmit={handleSubmit}
              className="w-full max-w-sm"
            >
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Lock className={`w-5 h-5 transition-colors ${error ? 'text-red-400' : 'text-white/40'}`} />
                </div>
                
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  maxLength={4}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-md border-2 text-white text-center text-xl tracking-widest placeholder:text-white/30 focus:outline-none transition-all ${
                    error 
                      ? 'border-red-500/50 animate-shake' 
                      : 'border-white/20 focus:border-white/50'
                  }`}
                  autoFocus
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-sm text-center mt-3"
                  >
                    Неверный пароль
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 py-4 rounded-2xl bg-white text-black font-semibold text-lg transition-all hover:bg-white/90 disabled:opacity-50"
                disabled={password.length < 4}
              >
                Войти
              </motion.button>
            </motion.form>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Check auth status helper
export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

// Logout helper
export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}
