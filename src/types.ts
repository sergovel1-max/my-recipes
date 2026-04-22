export type Category = string;

export interface CategoryConfig {
  id: string;
  label: string;
  color?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  checked: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: Category;
  image: string;
  images?: string[];
  coverImage?: number;
  video?: string;
  ingredients: Ingredient[];
  steps: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  createdAt: number;
}

export interface DragItem {
  id: string;
  index: number;
}
