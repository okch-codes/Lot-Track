import { useState, useEffect, useCallback, useRef } from 'react';
import { Ingredient } from '../types';
import { ingredientsApi } from '../services/api';
import IngredientList from '../components/IngredientList';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (q?: string) => {
    setIngredients(await ingredientsApi.list(q));
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSearchChange(value: string) {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(value || undefined);
    }, 300);
  }

  return (
    <div>
      <div className="page-header">
        <h2>Ingredients</h2>
      </div>
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>
      <IngredientList ingredients={ingredients} onUpdated={() => load(search || undefined)} />
    </div>
  );
}
