import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LogOut } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SearchBar } from './components/SearchBar';
import { CategoryFilter } from './components/CategoryFilter';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetail } from './components/RecipeDetail';
import { AddRecipeModal } from './components/AddRecipeModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { SplashScreen, logout } from './components/SplashScreen';
import { ThemeSelector } from './components/ThemeSelector';
import { sampleRecipes } from './data';
import { deleteFile, isLocalFile, uploadImage } from './fileStorage-cloud';
import type { Recipe, Category, CategoryConfig } from './types';

const STORAGE_KEY = 'culinary-blog-recipes';
const CATEGORIES_KEY = 'culinary-blog-categories';
const THEME_KEY = 'culinary-blog-theme';
const DEFAULT_IS_DARK = true;

const defaultCategories: CategoryConfig[] = [
  { id: 'all', label: 'Все', color: '#8B5CF6' },
  { id: 'meat', label: 'Мясо', color: '#EF4444' },
  { id: 'bakery', label: 'Выпечка', color: '#F59E0B' },
  { id: 'breakfast', label: 'Завтрак', color: '#10B981' },
  { id: 'dessert', label: 'Десерт', color: '#EC4899' },
  { id: 'soup', label: 'Суп', color: '#3B82F6' },
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>(defaultCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(DEFAULT_IS_DARK);

  // Load recipes and background from localStorage on mount
  useEffect(() => {
    // Load theme
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme) {
      setIsDarkTheme(storedTheme === 'dark');
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecipes(parsed);
      } catch {
        setRecipes(sampleRecipes);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleRecipes));
      }
    } else {
      setRecipes(sampleRecipes);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleRecipes));
    }
    setIsLoading(false);
  }, []);

  // Load categories from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(CATEGORIES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCategories(parsed);
      } catch {
        setCategories(defaultCategories);
      }
    } else {
      setCategories(defaultCategories);
    }
  }, []);

  // Save categories to localStorage
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    }
  }, [categories]);

  // Category management
  const addCategory = useCallback((label: string) => {
    const id = label.toLowerCase().replace(/\s+/g, '-');
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    setCategories(prev => [...prev, { id, label, color }]);
    return id;
  }, []);

  const updateCategory = useCallback((id: string, newLabel: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, label: newLabel } : c));
    // Update recipes using this category
    setRecipes(prev => prev.map(r => r.category === id ? { ...r, category: newLabel.toLowerCase().replace(/\s+/g, '-') } : r));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    if (id === 'all') return; // Cannot delete 'all'
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  // Save recipes to localStorage whenever they change
  useEffect(() => {
    if (!isLoading && recipes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    }
  }, [recipes, isLoading]);

  // Filter recipes
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Add new recipe
  const handleAddRecipe = useCallback((newRecipe: Omit<Recipe, 'id' | 'createdAt'>) => {
    const recipe: Recipe = {
      ...newRecipe,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    setRecipes((prev) => [recipe, ...prev]);
    setIsAddModalOpen(false);
  }, []);

  // Edit recipe
  const handleEditRecipe = useCallback((updatedRecipe: Recipe) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
    );
    setEditingRecipe(null);
    setSelectedRecipe(null);
  }, []);

  // Delete recipe
  const handleDeleteRecipe = useCallback(async (recipe: Recipe) => {
    // Close modal immediately
    setSelectedRecipe(null);
    
    // Delete files from server folder in background
    if (isLocalFile(recipe.video || '')) {
      deleteFile(recipe.video!).catch(console.error);
    }
    if (isLocalFile(recipe.image)) {
      deleteFile(recipe.image).catch(console.error);
    }
    
    // Remove from state
    setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
  }, []);

  // Toggle ingredient check
  const handleToggleIngredient = useCallback((recipeId: string, ingredientId: string) => {
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId
          ? {
              ...recipe,
              ingredients: recipe.ingredients.map((ing) =>
                ing.id === ingredientId ? { ...ing, checked: !ing.checked } : ing
              ),
            }
          : recipe
      )
    );
  }, []);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setRecipes((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  // Handle theme change
  const handleThemeChange = useCallback((isDark: boolean) => {
    setIsDarkTheme(isDark);
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-24">
      {/* Background */}
      <div className={`fixed inset-0 z-0 ${isDarkTheme ? 'bg-gray-950' : 'bg-gray-50'}`} />

      {/* Splash Screen / Auth */}
      {!isAuthenticated && (
        <SplashScreen onLogin={() => setIsAuthenticated(true)} />
      )}

      {/* Fixed Header */}
      <div className="sticky top-0 z-30 px-4 py-3">
        <motion.div
          className="flex items-center justify-between p-4 rounded-2xl bg-black/80 backdrop-blur-lg border border-white/10 shadow-xl shadow-black/40"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl font-bold text-white drop-shadow-md">Мои Рецепты</h1>
          <div className="flex items-center gap-2">
            <ThemeSelector
              isDarkTheme={isDarkTheme}
              onChange={handleThemeChange}
            />
            <motion.button
              onClick={() => {
                logout();
                setIsAuthenticated(false);
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center ios-button ${isDarkTheme ? 'bg-white/10 text-white' : 'bg-gray-800 text-white shadow-md'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Выйти"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => {
                setEditingRecipe(null);
                setIsAddModalOpen(true);
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center ios-button ${isDarkTheme ? 'bg-white text-black' : 'bg-blue-600 text-white shadow-md'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} isDarkTheme={isDarkTheme} />
      </div>

      {/* Content with z-index above background */}
      <div className="relative z-10">
        {/* Category Filter */}
        <div className="px-4 py-4">
          <CategoryFilter 
            categories={categories} 
            selected={selectedCategory} 
            onSelect={setSelectedCategory}
            onManage={() => setIsManagingCategories(true)}
            isDarkTheme={isDarkTheme}
          />
        </div>

        {/* Recipe Grid */}
        <div className="px-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredRecipes.map((r) => r.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredRecipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  index={index}
                  onClick={() => setSelectedRecipe(recipe)}
                  onDelete={() => handleDeleteRecipe(recipe)}
                  isDarkTheme={isDarkTheme}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Empty State */}
        {filteredRecipes.length === 0 && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className={`text-lg ${isDarkTheme ? 'text-white/50' : 'text-gray-500'}`}>Рецепты не найдены</p>
            <p className={`text-sm mt-2 ${isDarkTheme ? 'text-white/30' : 'text-gray-400'}`}>
              Попробуйте изменить параметры поиска
            </p>
          </motion.div>
        )}
        </div>
      </div>

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            onToggleIngredient={handleToggleIngredient}
            onEdit={() => {
              setEditingRecipe(selectedRecipe);
              setSelectedRecipe(null);
              setIsAddModalOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Add Recipe Modal */}
      <AddRecipeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRecipe(null);
        }}
        onAdd={handleAddRecipe}
        onEdit={handleEditRecipe}
        editingRecipe={editingRecipe}
        categories={categories}
        onAddCategory={addCategory}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isManagingCategories}
        onClose={() => setIsManagingCategories(false)}
        categories={categories}
        onAdd={addCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 bg-black/90 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-center">
          <p className="text-white/50 text-sm">© Мои Рецепты</p>
        </div>
      </div>
    </div>
  );
}

export default App;
