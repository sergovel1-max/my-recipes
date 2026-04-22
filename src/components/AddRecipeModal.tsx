import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Video, Image as ImageIcon } from 'lucide-react';
import { uploadImage, uploadVideo, deleteFile, isLocalFile } from '../fileStorage-cloud';
import type { Recipe, Category, Ingredient, CategoryConfig } from '../types';

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
  onEdit?: (recipe: Recipe) => void;
  editingRecipe?: Recipe | null;
  categories?: CategoryConfig[];
  onAddCategory?: (label: string) => string;
}

export function AddRecipeModal({ isOpen, onClose, onAdd, onEdit, editingRecipe, categories = [], onAddCategory }: AddRecipeModalProps) {
  const isEditing = !!editingRecipe;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(categories[0]?.id || 'all');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState(0);
  const [video, setVideo] = useState('');
  const [prepTime, setPrepTime] = useState(15);
  const [cookTime, setCookTime] = useState(30);
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: '', amount: '', checked: false },
  ]);
  const [steps, setSteps] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);

  // Load editing recipe data when modal opens
  useEffect(() => {
    if (isOpen && editingRecipe) {
      setTitle(editingRecipe.title);
      setDescription(editingRecipe.description);
      setCategory(editingRecipe.category);
      // Support both old (single image) and new (multiple images) format
      const recipeImages = editingRecipe.images || [editingRecipe.image];
      setImages(recipeImages);
      setCoverImage(editingRecipe.coverImage || 0);
      setImageFiles(new Array(recipeImages.length).fill(null));
      setVideo(editingRecipe.video || '');
      setVideoFile(null);
      setPrepTime(editingRecipe.prepTime);
      setCookTime(editingRecipe.cookTime);
      setServings(editingRecipe.servings);
      setIngredients(editingRecipe.ingredients.length > 0 
        ? editingRecipe.ingredients 
        : [{ id: '1', name: '', amount: '', checked: false }]);
      setSteps(editingRecipe.steps.length > 0 
        ? editingRecipe.steps 
        : ['']);
      setError(null);
      setShowAddCategory(false);
    } else if (isOpen && !editingRecipe) {
      // Reset form for new recipe
      setTitle('');
      setDescription('');
      setCategory(categories.find(c => c.id !== 'all')?.id || 'meat');
      setImages([]);
      setCoverImage(0);
      setImageFiles([]);
      setVideo('');
      setVideoFile(null);
      setPrepTime(15);
      setCookTime(30);
      setServings(4);
      setIngredients([{ id: Date.now().toString(), name: '', amount: '', checked: false }]);
      setSteps(['']);
      setError(null);
      setUploadProgress(0);
    }
  }, [isOpen, editingRecipe]);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { 
      id: Date.now().toString(), 
      name: '', 
      amount: '', 
      checked: false 
    }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = MAX_IMAGES - images.length;
    const filesToAdd = Math.min(files.length, remainingSlots);
    
    for (let i = 0; i < filesToAdd; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      setImages(prev => [...prev, previewUrl]);
      setImageFiles(prev => [...prev, file]);
    }
  };

  const [imageFiles, setImageFiles] = useState<(File | null)[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const MAX_IMAGES = 5;

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview immediately
      const previewUrl = URL.createObjectURL(file);
      setVideo(previewUrl);
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validIngredients = ingredients.filter(ing => ing.name.trim());
    const validSteps = steps.filter(step => step.trim());
    
    if (!title.trim()) {
      setError('Введите название рецепта');
      return;
    }
    if (validIngredients.length === 0) {
      setError('Добавьте хотя бы один ингредиент с названием');
      return;
    }
    if (validSteps.length === 0) {
      setError('Добавьте хотя бы один шаг приготовления');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    let videoUrl = video;
    
    // Upload all new images
    const finalImageUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const file = imageFiles[i];
      
      if (file && img.startsWith('blob:')) {
        try {
          setUploadProgress(Math.round((i / images.length) * 40)); // 0-40%
          const url = await uploadImage(file);
          finalImageUrls.push(url);
        } catch (err) {
          console.error('Image upload error:', err);
        }
      } else {
        finalImageUrls.push(img); // Already uploaded or external URL
      }
    }
    
    if (finalImageUrls.length === 0) {
      finalImageUrls.push('https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80');
    }
    
    // Upload video to server folder if it's a new file
    if (videoFile && video.startsWith('blob:')) {
      try {
        setUploadProgress(60);
        videoUrl = await uploadVideo(videoFile, (progress) => {
          setUploadProgress(60 + Math.round(progress * 0.4)); // 60-100%
        });
      } catch (err) {
        setError('Ошибка загрузки видео');
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }
    }
    
    // Clean up old images that were removed
    if (isEditing && editingRecipe && editingRecipe.images) {
      for (const oldImg of editingRecipe.images) {
        if (isLocalFile(oldImg) && !finalImageUrls.includes(oldImg)) {
          await deleteFile(oldImg).catch(() => {});
        }
      }
    }
    // Clean up old single image format
    if (isEditing && editingRecipe && isLocalFile(editingRecipe.image)) {
      const allImages = [...finalImageUrls];
      if (!allImages.includes(editingRecipe.image)) {
        await deleteFile(editingRecipe.image).catch(() => {});
      }
    }
    // Clean up old video if replaced
    if (isEditing && editingRecipe && isLocalFile(editingRecipe.video || '') && videoUrl !== editingRecipe.video) {
      await deleteFile(editingRecipe.video!).catch(() => {});
    }

    const mainImage = finalImageUrls[coverImage] || finalImageUrls[0];
    
    if (isEditing && editingRecipe && onEdit) {
      onEdit({
        ...editingRecipe,
        title: title.trim(),
        description: description.trim(),
        category,
        image: mainImage,
        images: finalImageUrls,
        coverImage,
        video: videoUrl || undefined,
        ingredients: validIngredients,
        steps: validSteps,
        prepTime,
        cookTime,
        servings,
      });
    } else {
      onAdd({
        title: title.trim(),
        description: description.trim(),
        category,
        image: mainImage,
        images: finalImageUrls,
        coverImage,
        video: videoUrl || undefined,
        ingredients: validIngredients,
        steps: validSteps,
        prepTime,
        cookTime,
        servings,
      });
    }
    
    setIsUploading(false);

    // Reset form
    setTitle('');
    setDescription('');
    setCategory('meat');
    setImages([]);
    setCoverImage(0);
    setImageFiles([]);
    setVideo('');
    setVideoFile(null);
    setPrepTime(15);
    setCookTime(30);
    setServings(4);
    setIngredients([{ id: '1', name: '', amount: '', checked: false }]);
    setSteps(['']);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-dark rounded-3xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-black/40 backdrop-blur-md rounded-t-3xl">
              <h2 className="text-xl font-semibold text-white">{isEditing ? 'Редактировать рецепт' : 'Новый рецепт'}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors ios-button"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Название</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Паста Карбонара"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Краткое описание блюда..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Категория</label>
                <div className="flex flex-wrap gap-2">
                  {categories.filter(c => c.id !== 'all').map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ios-button ${
                        category === cat.id 
                          ? 'bg-white/20 text-white' 
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                  
                  {/* Add new category button */}
                  {onAddCategory && !showAddCategory && (
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(true)}
                      className="px-3 py-2 rounded-xl text-sm font-medium transition-all ios-button bg-white/5 text-white/50 hover:bg-white/10"
                      title="Добавить категорию"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {/* Add category input */}
                {showAddCategory && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newCategoryLabel}
                      onChange={(e) => setNewCategoryLabel(e.target.value)}
                      placeholder="Название категории"
                      className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newCategoryLabel.trim() && onAddCategory) {
                          const newId = onAddCategory(newCategoryLabel.trim());
                          setCategory(newId);
                          setNewCategoryLabel('');
                          setShowAddCategory(false);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCategoryLabel.trim() && onAddCategory) {
                          const newId = onAddCategory(newCategoryLabel.trim());
                          setCategory(newId);
                          setNewCategoryLabel('');
                          setShowAddCategory(false);
                        }
                      }}
                      disabled={!newCategoryLabel.trim()}
                      className="px-4 py-2 rounded-xl bg-white/20 text-white font-medium disabled:opacity-50"
                    >
                      Добавить
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryLabel('');
                      }}
                      className="px-3 py-2 rounded-xl bg-white/5 text-white/70"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Media Upload */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Фото блюда {images.length > 0 && `(${images.length}/${MAX_IMAGES})`}
                  </label>
                  
                  {/* Gallery */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {images.map((img, idx) => (
                        <div 
                          key={idx} 
                          className={`relative aspect-video rounded-xl overflow-hidden border-2 ${
                            coverImage === idx ? 'border-yellow-400' : 'border-white/10'
                          }`}
                        >
                          <img src={img} alt={`Фото ${idx + 1}`} className="w-full h-full object-cover" />
                          
                          {/* Cover badge */}
                          {coverImage === idx && (
                            <div className="absolute top-1 left-1 px-2 py-0.5 bg-yellow-400 text-black text-xs rounded-full font-medium">
                              Главная
                            </div>
                          )}
                          
                          {/* Actions */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setCoverImage(idx)}
                              className={`p-1.5 rounded-full ${coverImage === idx ? 'bg-yellow-400 text-black' : 'bg-white/20 text-white'}`}
                              title="Сделать главной"
                            >
                              ★
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setImages(images.filter((_, i) => i !== idx));
                                setImageFiles(imageFiles.filter((_, i) => i !== idx));
                                if (coverImage === idx) setCoverImage(0);
                                else if (coverImage > idx) setCoverImage(coverImage - 1);
                              }}
                              className="p-1.5 rounded-full bg-red-500/80 text-white"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add button */}
                  {images.length < MAX_IMAGES && (
                    <div 
                      onClick={() => imageInputRef.current?.click()}
                      className="aspect-video rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 cursor-pointer flex flex-col items-center justify-center transition-colors"
                    >
                      <ImageIcon className="w-8 h-8 text-white/40 mb-2" />
                      <span className="text-sm text-white/50">
                        {images.length === 0 ? 'Нажмите для загрузки' : 'Добавить фото'}
                      </span>
                    </div>
                  )}
                  
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Видео (опционально)</label>
                  <div 
                    onClick={() => videoInputRef.current?.click()}
                    className={`aspect-video rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-colors ${
                      video ? 'border-white/30 bg-white/5' : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {video ? (
                      <video src={video} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <>
                        <Video className="w-8 h-8 text-white/40 mb-2" />
                        <span className="text-sm text-white/50">Нажмите для загрузки</span>
                      </>
                    )}
                  </div>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-white/40 mt-2 text-center">или</p>
                  <input
                    type="text"
                    value={video}
                    onChange={(e) => setVideo(e.target.value)}
                    placeholder="Вставьте ссылку на видео"
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Time & Servings */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Подготовка (мин)</label>
                  <input
                    type="number"
                    value={prepTime}
                    onChange={(e) => setPrepTime(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-white/30 transition-colors"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Приготовление (мин)</label>
                  <input
                    type="number"
                    value={cookTime}
                    onChange={(e) => setCookTime(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-white/30 transition-colors"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Порции</label>
                  <input
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-white/30 transition-colors"
                    min="1"
                  />
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/70">Ингредиенты</label>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors ios-button"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить
                  </button>
                </div>
                <div className="space-y-2">
                  {ingredients.map((ingredient, index) => (
                    <div key={ingredient.id} className="flex gap-2">
                      <input
                        type="text"
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                        placeholder="Название"
                        className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors text-sm"
                      />
                      <input
                        type="text"
                        value={ingredient.amount}
                        onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                        placeholder="Количество"
                        className="w-28 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        className="p-2 rounded-xl hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors ios-button"
                        disabled={ingredients.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/70">Пошаговое приготовление</label>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors ios-button"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить шаг
                  </button>
                </div>
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm text-white/70 font-medium">
                        {index + 1}
                      </span>
                      <textarea
                        value={step}
                        onChange={(e) => handleStepChange(index, e.target.value)}
                        placeholder={`Шаг ${index + 1}`}
                        rows={2}
                        className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors text-sm resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="p-2 rounded-xl hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors ios-button h-fit"
                        disabled={steps.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-4 rounded-2xl bg-white text-black font-semibold text-lg hover:bg-white/90 transition-colors ios-button disabled:opacity-70 disabled:cursor-not-allowed flex flex-col items-center justify-center"
              >
                {isUploading ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <motion.div
                        className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>Загрузка видео {uploadProgress}%</span>
                    </div>
                    <div className="w-32 h-1 bg-black/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-black/50"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </>
                ) : (
                  isEditing ? 'Сохранить изменения' : 'Добавить рецепт'
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
