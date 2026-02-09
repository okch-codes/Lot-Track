import { useState, useEffect, useCallback, useRef } from 'react';
import { Recipe } from '../types';
import { recipesApi } from '../services/api';
import RecipeList from '../components/RecipeList';
import RecipeForm from '../components/RecipeForm';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (q?: string) => {
    setRecipes(await recipesApi.list(q));
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSearchChange(value: string) {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(value || undefined);
    }, 300);
  }

  async function handleSave(name: string, ingredients: string[]) {
    setError('');
    try {
      if (editingRecipe) {
        await recipesApi.update(editingRecipe.id, { name, ingredients });
      } else {
        await recipesApi.create({ name, ingredients });
      }
      setShowForm(false);
      setEditingRecipe(null);
      await load(search || undefined);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this recipe?')) return;
    try {
      await recipesApi.delete(id);
      await load(search || undefined);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleEdit(recipe: Recipe) {
    setEditingRecipe(recipe);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingRecipe(null);
  }

  return (
    <div>
      <div className="page-header">
        <h2>Recipes</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)}>New Recipe</button>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      {showForm ? (
        <RecipeForm editingRecipe={editingRecipe} onSave={handleSave} onCancel={handleCancel} />
      ) : (
        <>
          <div className="filter-bar">
            <input
              type="text"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <RecipeList recipes={recipes} onEdit={handleEdit} onDelete={handleDelete} />
        </>
      )}
    </div>
  );
}
