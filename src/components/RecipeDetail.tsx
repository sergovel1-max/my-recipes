import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, Users, ChefHat, PictureInPicture, X, Play, Pause, Pencil, ChevronLeft as ChevronLeftIcon, ChevronRight } from 'lucide-react';
import { getMediaFile } from '../mediaStorage';
import type { Recipe } from '../types';

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
  onToggleIngredient: (recipeId: string, ingredientId: string) => void;
  onEdit?: () => void;
}

export function RecipeDetail({ recipe, onClose, onToggleIngredient, onEdit }: RecipeDetailProps) {
  const [isPiP, setIsPiP] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Get all images (support both old single image and new multiple images format)
  const allImages = recipe.images && recipe.images.length > 0 
    ? recipe.images 
    : recipe.image 
      ? [recipe.image] 
      : [];
  const currentImage = allImages[currentImageIndex] || recipe.image;

  // Load video from IndexedDB if needed
  useEffect(() => {
    if (recipe.video?.startsWith('indexeddb://')) {
      setIsLoadingVideo(true);
      getMediaFile(recipe.video)
        .then((url) => {
          setVideoUrl(url);
        })
        .catch((err) => {
          console.error('Failed to load video:', err);
        })
        .finally(() => {
          setIsLoadingVideo(false);
        });
    } else {
      setVideoUrl(recipe.video || null);
      setIsLoadingVideo(false);
    }
  }, [recipe.video]);

  const handlePiP = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (error) {
        console.error('PiP failed:', error);
      }
    }
  };

  const togglePlay = async () => {
    if (!videoRef.current) return;
    
    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Video playback failed:', err);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current && !isPiP && isPlaying) {
        handlePiP();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPiP, isPlaying]);

  // Cleanup: stop video and exit PiP when component unmounts
  useEffect(() => {
    return () => {
      // Exit PiP if active
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      }
      // Stop video
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black overflow-y-auto"
      initial={{ opacity: 0, pointerEvents: 'auto' }}
      animate={{ opacity: 1, pointerEvents: 'auto' }}
      exit={{ opacity: 0, pointerEvents: 'none' }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between p-4 glass-dark">
        <motion.button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-full glass text-white ios-button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Назад</span>
        </motion.button>
        
        <h1 className="text-lg font-semibold text-white truncate max-w-[200px]">
          {recipe.title}
        </h1>
        
        <div className="flex items-center gap-2">
          {onEdit && (
            <motion.button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-full glass text-white ios-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              <Pencil className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Изменить</span>
            </motion.button>
          )}
          {!onEdit && <div className="w-20" />}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        {/* Hero Image/Video */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                poster={currentImage}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls={false}
              />
              
              {/* Loading indicator */}
              {isLoadingVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <motion.div
                    className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              )}
              
              {!isLoadingVideo && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <button
                      onClick={togglePlay}
                      className="w-16 h-16 rounded-full glass flex items-center justify-center ios-button z-20 pointer-events-auto"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-white" fill="white" />
                      ) : (
                        <Play className="w-6 h-6 text-white ml-1" fill="white" />
                      )}
                    </button>
                  </div>
                  
                  {/* PiP Button */}
                  {document.pictureInPictureEnabled && (
                    <button
                      onClick={handlePiP}
                      className="absolute top-4 right-4 p-2 rounded-full glass ios-button"
                    >
                      <PictureInPicture className="w-5 h-5 text-white" />
                    </button>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="relative w-full h-full">
              <motion.img
                src={currentImage}
                alt={recipe.title}
                className="w-full h-full object-cover"
                layoutId={`image-${recipe.id}`}
              />
              
              {/* Navigation arrows for multiple images */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm ios-button z-10 pointer-events-auto"
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm ios-button z-10 pointer-events-auto"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  
                  {/* Image counter */}
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 text-white text-sm backdrop-blur-sm z-10">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <motion.h1 
            className="text-3xl font-bold text-white mb-2"
            layoutId={`title-${recipe.id}`}
          >
            {recipe.title}
          </motion.h1>
          <p className="text-white/70 text-lg">{recipe.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 px-6 py-4">
        <div className="flex items-center gap-2 text-white/60">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{recipe.prepTime + recipe.cookTime} мин</span>
        </div>
        <div className="flex items-center gap-2 text-white/60">
          <Users className="w-4 h-4" />
          <span className="text-sm">{recipe.servings} порции</span>
        </div>
        <div className="flex items-center gap-2 text-white/60">
          <ChefHat className="w-4 h-4" />
          <span className="text-sm">{recipe.cookTime} мин готовка</span>
        </div>
      </div>

      {/* Photo Gallery Thumbnails */}
      {allImages.length > 1 && (
        <div className="px-6 py-2">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all ${
                  currentImageIndex === idx ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Фото ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients */}
      <div className="px-6 py-4">
        <h2 className="text-xl font-semibold text-white mb-4">Ингредиенты</h2>
        <div className="space-y-2">
          {recipe.ingredients.map((ingredient) => (
            <motion.div
              key={ingredient.id}
              onClick={() => onToggleIngredient(recipe.id, ingredient.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ios-button ${
                ingredient.checked ? 'bg-white/10' : 'bg-white/5'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <input
                type="checkbox"
                checked={ingredient.checked}
                readOnly
                className="custom-checkbox pointer-events-none"
              />
              <span className={`flex-1 text-base transition-all ${
                ingredient.checked ? 'text-white/50 line-through' : 'text-white'
              }`}>
                {ingredient.name}
              </span>
              <span className={`text-sm ${
                ingredient.checked ? 'text-white/30' : 'text-white/60'
              }`}>
                {ingredient.amount}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="px-6 py-4 pb-20">
        <h2 className="text-xl font-semibold text-white mb-4">Приготовление</h2>
        <div className="space-y-4">
          {recipe.steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">{index + 1}</span>
              </div>
              <p className="text-white/80 text-base leading-relaxed pt-2">
                {step}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* PiP Video Container */}
      {isPiP && recipe.video && (
        <motion.div
          className="fixed bottom-4 right-4 w-64 aspect-video rounded-xl overflow-hidden glass z-50"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <video
            src={recipe.video}
            className="w-full h-full object-cover"
            autoPlay
            controls
          />
          <button
            onClick={() => setIsPiP(false)}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/50"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
