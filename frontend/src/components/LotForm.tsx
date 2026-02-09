import { useState, useEffect } from 'react';
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
  const [ingredients, setIngredients] = useState<(Ingredient & { lot_value: string })[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    recipesApi.list().then(setRecipes);
  }, []);

  useEffect(() => {
    if (!editId) return;
    lotsApi.get(editId).then((lot) => {
      setSelectedRecipeId(lot.recipe_id);
      setNotes(lot.notes || '');
      setIngredients(
        (lot.ingredients || []).map((i) => ({
          id: i.ingredient_id,
          name: i.ingredient_name || '',
          last_lot_number: i.lot_number,
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
      const ingredientData = ingredients.map((i) => ({
        ingredient_id: i.id,
        lot_number: i.lot_value,
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
      <label>
        Recipe
        <select
          value={selectedRecipeId}
          onChange={(e) => handleRecipeChange(Number(e.target.value))}
          required
          disabled={isEdit}
        >
          <option value="">Select a recipe...</option>
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>

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
