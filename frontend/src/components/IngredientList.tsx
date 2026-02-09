import { useState } from 'react';
import { Ingredient, LotHistoryEntry } from '../types';
import { ingredientsApi } from '../services/api';

interface Props {
  ingredients: Ingredient[];
  onUpdated: () => void;
}

export default function IngredientList({ ingredients, onUpdated }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [historyCache, setHistoryCache] = useState<Record<number, LotHistoryEntry[]>>({});
  const [loadingHistory, setLoadingHistory] = useState(false);

  function startEdit(ing: Ingredient) {
    setEditingId(ing.id);
    setEditValue(ing.last_lot_number || '');
  }

  async function saveEdit(id: number) {
    await ingredientsApi.updateLotNumber(id, editValue);
    setEditingId(null);
    onUpdated();
  }

  async function toggleHistory(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!historyCache[id]) {
      setLoadingHistory(true);
      const history = await ingredientsApi.getLotHistory(id);
      setHistoryCache((prev) => ({ ...prev, [id]: history }));
      setLoadingHistory(false);
    }
  }

  if (ingredients.length === 0) return <p>No ingredients yet.</p>;

  return (
    <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Last Lot Number</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {ingredients.map((ing) => (
          <>
            <tr key={ing.id} className={expandedId === ing.id ? 'expanded-row' : ''}>
              <td>{ing.name}</td>
              <td>
                {editingId === ing.id ? (
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(ing.id)}
                  />
                ) : (
                  ing.last_lot_number || '\u2014'
                )}
              </td>
              <td>
                {editingId === ing.id ? (
                  <>
                    <button onClick={() => saveEdit(ing.id)}>Save</button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(ing)}>Edit</button>
                    <button onClick={() => toggleHistory(ing.id)} className="btn-secondary">
                      {expandedId === ing.id ? 'Hide History' : 'History'}
                    </button>
                  </>
                )}
              </td>
            </tr>
            {expandedId === ing.id && (
              <tr key={`${ing.id}-history`}>
                <td colSpan={3} className="lot-history">
                  {loadingHistory && !historyCache[ing.id] ? (
                    <p>Loading...</p>
                  ) : historyCache[ing.id]?.length === 0 ? (
                    <p>No lot history found.</p>
                  ) : (
                    <table className="lot-history-table">
                      <thead>
                        <tr>
                          <th>Ingredient Lot #</th>
                          <th>Lot Code</th>
                          <th>Recipe</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyCache[ing.id]?.map((entry, idx) => (
                          <tr key={idx}>
                            <td>{entry.lot_number || '\u2014'}</td>
                            <td>{entry.lot_code}</td>
                            <td>{entry.recipe_name}</td>
                            <td>{new Date(entry.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </td>
              </tr>
            )}
          </>
        ))}
      </tbody>
    </table>
    </div>
  );
}
