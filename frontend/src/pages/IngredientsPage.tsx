import { useState, useEffect, useCallback, useRef } from 'react';
import { Ingredient } from '../types';
import { ingredientsApi } from '../services/api';
import IngredientList from '../components/IngredientList';

const PAGE_SIZE = 20;

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (q?: string, p = 1) => {
    const result = await ingredientsApi.list(q, p, PAGE_SIZE);
    setIngredients(result.data);
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

  function handlePageChange(newPage: number) {
    setPage(newPage);
    load(search || undefined, newPage);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
      <IngredientList ingredients={ingredients} onUpdated={() => load(search || undefined, page)} />
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
