import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recipe, Ingredient } from '../types';
import { recipesApi, lotsApi } from '../services/api';

interface Props {
  editId?: number;
}

export default function LotForm({ editId }: Props) {
  const navigate = useNavigate();
  const isEdit = !!editId;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | ''>('');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [showRecipeDropdown, setShowRecipeDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [ingredients, setIngredients] = useState<(Ingredient & { lot_value: string })[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    recipesApi.list(undefined, 1, 200).then((res) => setRecipes(res.data));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowRecipeDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  function handleRecipeKeyDown(e: React.KeyboardEvent) {
    if (!showRecipeDropdown || filteredRecipes.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev < filteredRecipes.length - 1 ? prev + 1 : 0;
        scrollToItem(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : filteredRecipes.length - 1;
        scrollToItem(next);
        return next;
      });
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      const r = filteredRecipes[highlightedIndex];
      setRecipeSearch(r.name);
      setSelectedRecipeId(r.id);
      setShowRecipeDropdown(false);
      setHighlightedIndex(-1);
      handleRecipeChange(r.id);
    } else if (e.key === 'Escape') {
      setShowRecipeDropdown(false);
      setHighlightedIndex(-1);
    }
  }

  function scrollToItem(index: number) {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[index] as HTMLElement;
    if (item) item.scrollIntoView({ block: 'nearest' });
  }

  useEffect(() => {
    if (!editId) return;
    lotsApi.get(editId).then((lot) => {
      setSelectedRecipeId(lot.recipe_id);
      setRecipeSearch(lot.recipe_name || '');
      setNotes(lot.notes || '');
      setIngredients(
        (lot.ingredients || []).map((i) => ({
          id: i.ingredient_id,
          name: i.ingredient_name || '',
          last_lot_number: i.lot_number,
          is_highlighted: i.is_highlighted ?? false,
          lot_value: i.lot_number || '',
          created_at: '',
          updated_at: '',
        }))
      );
      setLoading(false);
    });
  }, [editId]);

  async function handleRecipeChange(recipeId: number) {
    setSelectedRecipeId(recipeId);
    const ings = await recipesApi.getIngredientsWithLots(recipeId);
    setIngredients(
      ings.map((i) => ({ ...i, lot_value: i.last_lot_number || '' }))
    );
  }

  function updateIngredientLot(id: number, value: string) {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, lot_value: value } : i))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRecipeId || ingredients.length === 0) return;
    setError('');
    try {
      const ingredientData = ingredients.map((i, idx) => ({
        ingredient_id: i.id,
        lot_number: i.lot_value,
        sort_order: idx,
        is_highlighted: (i as any).is_highlighted ?? false,
      }));
      if (isEdit) {
        await lotsApi.update(editId!, { ingredients: ingredientData, notes: notes || undefined });
        navigate(`/lots/${editId}`);
      } else {
        const lot = await lotsApi.create({
          recipe_id: selectedRecipeId,
          ingredients: ingredientData,
          notes: notes || undefined,
        });
        navigate(`/lots/${lot.id}`);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <form className="lot-form" onSubmit={handleSubmit}>
      <h3>{isEdit ? 'Edit Lot' : 'Create New Lot'}</h3>
      {error && <p className="error">{error}</p>}
      <div className="recipe-search" ref={dropdownRef}>
        <label>
          Recipe
          <input
            type="text"
            value={recipeSearch}
            onChange={(e) => {
              setRecipeSearch(e.target.value);
              setShowRecipeDropdown(true);
              setHighlightedIndex(-1);
              if (selectedRecipeId) {
                setSelectedRecipeId('');
                setIngredients([]);
              }
            }}
            onFocus={() => setShowRecipeDropdown(true)}
            onKeyDown={handleRecipeKeyDown}
            placeholder="Search for a recipe..."
            disabled={isEdit}
            autoComplete="off"
          />
        </label>
        {showRecipeDropdown && !isEdit && filteredRecipes.length > 0 && (
          <ul className="recipe-dropdown" ref={listRef}>
            {filteredRecipes.map((r, i) => (
              <li
                key={r.id}
                className={i === highlightedIndex ? 'highlighted' : ''}
                onMouseEnter={() => setHighlightedIndex(i)}
                onClick={() => {
                  setRecipeSearch(r.name);
                  setSelectedRecipeId(r.id);
                  setShowRecipeDropdown(false);
                  setHighlightedIndex(-1);
                  handleRecipeChange(r.id);
                }}
              >
                {r.name}
              </li>
            ))}
          </ul>
        )}
        {showRecipeDropdown && !isEdit && recipeSearch && filteredRecipes.length === 0 && (
          <ul className="recipe-dropdown">
            <li className="no-results">No recipes found</li>
          </ul>
        )}
      </div>

      {ingredients.length > 0 && (
        <div className="ingredient-lots">
          <h4>Ingredient Lot Numbers</h4>
          {ingredients.map((ing) => (
            <label key={ing.id}>
              {ing.name}
              <input
                value={ing.lot_value}
                onChange={(e) => updateIngredientLot(ing.id, e.target.value)}
                placeholder="Lot number"
              />
            </label>
          ))}
        </div>
      )}

      <label>
        Notes (optional)
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <div className="form-actions">
        <button type="submit" disabled={!selectedRecipeId}>
          {isEdit ? 'Save Changes' : 'Create Lot'}
        </button>
        <button type="button" onClick={() => navigate('/lots')} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
