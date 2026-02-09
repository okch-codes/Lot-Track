import { useState, useEffect } from 'react';
import { Recipe } from '../types';

interface Props {
  editingRecipe: Recipe | null;
  onSave: (name: string, ingredients: string[]) => void;
  onCancel: () => void;
}

export default function RecipeForm({ editingRecipe, onSave, onCancel }: Props) {
  const [name, setName] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');

  useEffect(() => {
    if (editingRecipe) {
      setName(editingRecipe.name);
      setIngredientsText(
        editingRecipe.ingredients?.map((i) => i.name).join('\n') || ''
      );
    } else {
      setName('');
      setIngredientsText('');
    }
  }, [editingRecipe]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ingredients = ingredientsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!name.trim() || ingredients.length === 0) return;
    onSave(name.trim(), ingredients);
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      <h3>{editingRecipe ? 'Edit Recipe' : 'New Recipe'}</h3>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Ingredients (one per line)
        <textarea
          rows={6}
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
          required
        />
      </label>
      <div className="form-actions">
        <button type="submit">{editingRecipe ? 'Update' : 'Create'}</button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
