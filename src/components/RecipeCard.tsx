import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getMediaFile } from '../mediaStorage';
import type { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  onClick: () => void;
  isDragging?: boolean;
  onDelete?: () => void;
  isDarkTheme?: boolean;
}

export function RecipeCard({ recipe, index, onClick, isDragging, onDelete, isDarkTheme = true }: RecipeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>(recipe.image);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isIndexedDBVideo = recipe.video?.startsWith('indexeddb://');
  const hasVideo = !!recipe.video;

  // Intersection Observer для отложенной загрузки
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load image from IndexedDB if needed (только когда видимо)
  useEffect(() => {
    if (!isVisible) return;
    
    let cancelled = false;
    
    if (recipe.image?.startsWith('indexeddb://')) {
      getMediaFile(recipe.image)
        .then((url) => {
          if (!cancelled && url) setImageUrl(url);
        })
        .catch((err) => {
          console.error('Card image load error:', err);
        });
    } else {
      setImageUrl(recipe.image);
    }
    
    return () => { cancelled = true; };
  }, [recipe.image, isVisible]);

  // Load video только при наведении (оптимизация)
  const loadVideo = useCallback(() => {
    if (!hasVideo || videoUrl) return;
    
    if (isIndexedDBVideo) {
      getMediaFile(recipe.video!)
        .then((url) => setVideoUrl(url))
        .catch((err) => console.error('Card video load error:', err));
    } else {
      setVideoUrl(recipe.video || null);
    }
  }, [hasVideo, isIndexedDBVideo, recipe.video, videoUrl]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    loadVideo();
  }, [loadVideo]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: recipe.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCurrentlyDragging = isDragging || isSortableDragging;

  // Autoplay video on hover (только для внешних URL)
  useEffect(() => {
    if (isHovered && videoRef.current && videoUrl && !isIndexedDBVideo) {
      videoRef.current.play().catch(() => {});
    }
  }, [isHovered, videoUrl, isIndexedDBVideo]);

  const cardCallbackRef = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node);
    if (node) {
      (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [setNodeRef]);

  return (
    <motion.div
      ref={cardCallbackRef}
      style={style}
      {...attributes}
      className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group grid-item-${index % 12} animate-slide-up border shadow-xl ${isDarkTheme ? 'border-white/10 shadow-black/30' : 'border-gray-300 shadow-gray-300'}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ 
        opacity: isCurrentlyDragging ? 0.5 : 1, 
        y: 0,
        scale: isCurrentlyDragging ? 1.02 : 1,
      }}
      whileHover={{ scale: isCurrentlyDragging ? 1 : 1.03 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      layoutId={`card-${recipe.id}`}
    >
      {/* Delete Button */}
      {onDelete && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Удалить этот рецепт?')) {
              onDelete();
            }
          }}
          className="absolute top-2 left-2 z-30 p-1.5 rounded-full bg-red-500/60 hover:bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Trash2 className="w-3 h-3" />
        </motion.button>
      )}

      {/* Drag Handle */}
      <div
        {...listeners}
        className={`absolute top-2 right-2 z-20 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing ${isDarkTheme ? 'glass' : 'bg-white/80 shadow-sm'}`}
      >
        <GripVertical className={`w-3 h-3 ${isDarkTheme ? 'text-white' : 'text-gray-700'}`} />
      </div>

      {/* Image */}
      <motion.img
        src={imageUrl}
        alt={recipe.title}
        className="absolute inset-0 w-full h-full object-cover"
        layoutId={`image-${recipe.id}`}
        loading="lazy"
        decoding="async"
      />

      {/* Video Preview - only for external URLs */}
      {videoUrl && !isIndexedDBVideo && (
        <video
          ref={videoRef}
          src={videoUrl}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovered && videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          muted
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
        />
      )}

      {/* Play Icon Overlay - show for all videos */}
      {hasVideo && (
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkTheme ? 'glass' : 'bg-white/80 shadow-lg'}`}>
            <Play className={`w-4 h-4 ml-0.5 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`} fill={isDarkTheme ? "white" : "currentColor"} />
          </div>
        </div>
      )}

      {/* Bottom Glass Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <div className={`rounded-xl px-3 py-2 ${isDarkTheme ? 'glass-dark' : 'bg-white/90 shadow-lg'}`}>
          <motion.h3 
            className={`font-semibold text-sm leading-tight ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}
            layoutId={`title-${recipe.id}`}
          >
            {recipe.title}
          </motion.h3>
          <p className={`text-[10px] mt-0.5 line-clamp-1 ${isDarkTheme ? 'text-white/70' : 'text-gray-500'}`}>
            {recipe.description}
          </p>
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className={`absolute inset-0 pointer-events-none ${isDarkTheme ? 'bg-gradient-to-t from-black/60 via-transparent to-transparent' : 'bg-gradient-to-t from-black/20 via-transparent to-transparent'}`} />
    </motion.div>
  );
}
