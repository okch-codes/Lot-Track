import { useState, useEffect, useCallback, useRef } from 'react';
import { Recipe } from '../types';
import { recipesApi } from '../services/api';
import RecipeList from '../components/RecipeList';
import RecipeForm from '../components/RecipeForm';

const PAGE_SIZE = 20;

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (q?: string, p = 1) => {
    const result = await recipesApi.list(q, p, PAGE_SIZE);
    setRecipes(result.data);
    setTotal(result.total);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(value || undefined, 1);
    }, 300);
  }

  async function handleSave(name: string, ingredients: string[]) {
    setError('');
    try {
      if (editingRecipe) {
        await recipesApi.update(editingRecipe.id, { name, ingredients });
        await load(search || undefined, page);
      } else {
        await recipesApi.create({ name, ingredients });
        setPage(1);
        setSearch('');
        await load(undefined, 1);
      }
      setShowForm(false);
      setEditingRecipe(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this recipe?')) return;
    try {
      await recipesApi.delete(id);
      await load(search || undefined, page);
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

  function handlePageChange(newPage: number) {
    setPage(newPage);
    load(search || undefined, newPage);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
