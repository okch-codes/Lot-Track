import { useState, useEffect, useCallback, useRef } from 'react';
import { Ingredient, Recipe, RecipeCostData, RecipeCostItem, InvoiceItem } from '../types';
import { costsApi, recipesApi } from '../services/api';

type Tab = 'ingredients' | 'recipes' | 'scan';

function IngredientPicker({ ingredients, value, onChange }: {
  ingredients: Ingredient[];
  value: number | '';
  onChange: (id: number | '') => void;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = value !== '' ? ingredients.find((i) => i.id === value) : null;
  const filtered = filter
    ? ingredients.filter((i) => i.name.toLowerCase().includes(filter.toLowerCase()))
    : ingredients;

  return (
    <div ref={ref} className="ing-picker">
      <button
        type="button"
        className="ing-picker-btn"
        onClick={() => { setOpen(!open); setFilter(''); }}
      >
        {selected ? selected.name : '— skip —'}
      </button>
      {open && (
        <div className="ing-picker-dropdown">
          <input
            type="text"
            placeholder="Search..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
          />
          <div className="ing-picker-list">
            <div
              className={`ing-picker-option${value === '' ? ' selected' : ''}`}
              onClick={() => { onChange(''); setOpen(false); }}
            >
              — skip —
            </div>
            {filtered.map((ing) => (
              <div
                key={ing.id}
                className={`ing-picker-option${value === ing.id ? ' selected' : ''}`}
                onClick={() => { onChange(ing.id); setOpen(false); }}
              >
                {ing.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatEuros(cents: number | null): string {
  if (cents == null) return '—';
  return (cents / 100).toFixed(2) + ' €';
}

function calcIngredientCost(item: RecipeCostItem): number | null {
  if (item.quantity == null || item.cost_price_cents == null || !item.cost_package_size) return null;
  const pricePerUnit = item.cost_price_cents / item.cost_package_size;
  const base = pricePerUnit * item.quantity;
  const vatMultiplier = 1 + (item.cost_vat_rate ?? 0) / 100;
  return base * vatMultiplier;
}

// ---- Ingredient Cost Tab ----

interface IngredientEdit {
  cost_price_cents: string;
  cost_vat_rate: string;
  cost_unit: string;
  cost_package_size: string;
}

function IngredientCostsTab() {
  const PAGE_SIZE = 20;
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<IngredientEdit>({ cost_price_cents: '', cost_vat_rate: '', cost_unit: '', cost_package_size: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await costsApi.listIngredients();
      setAllIngredients(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? allIngredients.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : allIngredients;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const ingredients = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function startEdit(ing: Ingredient) {
    setEditingId(ing.id);
    setEditValues({
      cost_price_cents: ing.cost_price_cents != null ? String(ing.cost_price_cents / 100) : '',
      cost_vat_rate: ing.cost_vat_rate != null ? String(ing.cost_vat_rate) : '',
      cost_unit: ing.cost_unit ?? '',
      cost_package_size: ing.cost_package_size != null ? String(ing.cost_package_size) : '',
    });
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setError('');
  }

  async function saveEdit(id: number) {
    setError('');
    try {
      const priceCents = editValues.cost_price_cents !== '' ? Math.round(parseFloat(editValues.cost_price_cents) * 100) : null;
      const vatRate = editValues.cost_vat_rate !== '' ? parseInt(editValues.cost_vat_rate, 10) : null;
      const unit = editValues.cost_unit.trim() || null;
      const packageSize = editValues.cost_package_size !== '' ? parseFloat(editValues.cost_package_size) : null;
      await costsApi.updateIngredient(id, {
        cost_price_cents: priceCents,
        cost_vat_rate: vatRate,
        cost_unit: unit,
        cost_package_size: packageSize,
      });
      setEditingId(null);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {error && <p className="error">{error}</p>}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>
      <div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Price / package</th>
              <th>VAT %</th>
              <th>Unit</th>
              <th>Package size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing) =>
              editingId === ing.id ? (
                <tr key={ing.id}>
                  <td>{ing.name}</td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={editValues.cost_price_cents}
                      onChange={(e) => setEditValues((v) => ({ ...v, cost_price_cents: e.target.value }))}
                      style={{ width: 90 }}
                    />
                    {' €'}
                  </td>
                  <td>
                    <select
                      value={editValues.cost_vat_rate}
                      onChange={(e) => setEditValues((v) => ({ ...v, cost_vat_rate: e.target.value }))}
                    >
                      <option value="">—</option>
                      <option value="4">4%</option>
                      <option value="10">10%</option>
                      <option value="22">22%</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={editValues.cost_unit}
                      onChange={(e) => setEditValues((v) => ({ ...v, cost_unit: e.target.value }))}
                    >
                      <option value="">—</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="mL">mL</option>
                      <option value="pz">pz</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="1"
                      value={editValues.cost_package_size}
                      onChange={(e) => setEditValues((v) => ({ ...v, cost_package_size: e.target.value }))}
                      style={{ width: 80 }}
                    />
                    {editValues.cost_unit ? ` ${editValues.cost_unit}` : ''}
                  </td>
                  <td>
                    <button onClick={() => saveEdit(ing.id)}>Save</button>
                    <button onClick={cancelEdit} className="btn-secondary">Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={ing.id}>
                  <td>{ing.name}</td>
                  <td>{formatEuros(ing.cost_price_cents)}</td>
                  <td>{ing.cost_vat_rate != null ? `${ing.cost_vat_rate}%` : '—'}</td>
                  <td>{ing.cost_unit ?? '—'}</td>
                  <td>{ing.cost_package_size != null ? `${ing.cost_package_size}${ing.cost_unit ? ' ' + ing.cost_unit : ''}` : '—'}</td>
                  <td>
                    <button onClick={() => startEdit(ing)}>Edit</button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

// ---- Recipe Cost Tab ----

function RecipeCostsTab() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [costData, setCostData] = useState<RecipeCostData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Yield editing
  const [editingYield, setEditingYield] = useState(false);
  const [yieldValue, setYieldValue] = useState('');
  const [yieldUnit, setYieldUnit] = useState('');

  // Quantity editing per ingredient
  const [editingQtyId, setEditingQtyId] = useState<number | null>(null);
  const [qtyValue, setQtyValue] = useState('');

  useEffect(() => {
    recipesApi.list(undefined, 1, 200).then((r) => setRecipes(r.data));
  }, []);

  const filteredRecipes = search
    ? recipes.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : recipes;

  const loadCost = useCallback(async (id: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await costsApi.getRecipeCost(id);
      setCostData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleRecipeChange(id: number | '') {
    setSelectedId(id);
    setCostData(null);
    setEditingYield(false);
    setEditingQtyId(null);
    if (id !== '') loadCost(id as number);
  }

  async function saveYield() {
    if (!costData || selectedId === '') return;
    setError('');
    try {
      const val = yieldValue !== '' ? parseFloat(yieldValue) : null;
      const unit = yieldUnit.trim() || null;
      await costsApi.updateRecipeYield(selectedId as number, val, unit);
      await loadCost(selectedId as number);
      setEditingYield(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function startEditYield() {
    if (!costData) return;
    setYieldValue(costData.recipe.cost_yield != null ? String(costData.recipe.cost_yield) : '');
    setYieldUnit(costData.recipe.cost_yield_unit ?? '');
    setEditingYield(true);
  }

  function startEditQty(item: RecipeCostItem) {
    setEditingQtyId(item.ingredient_id);
    setQtyValue(item.quantity != null ? String(item.quantity) : '');
  }

  async function saveQty(ingredientId: number) {
    if (selectedId === '') return;
    setError('');
    try {
      const qty = qtyValue !== '' ? parseFloat(qtyValue) : 0;
      await costsApi.upsertCostItem(selectedId as number, ingredientId, qty);
      await loadCost(selectedId as number);
      setEditingQtyId(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  // Calculate costs
  const itemsWithCost = costData?.items.map((item) => ({
    ...item,
    totalCents: calcIngredientCost(item),
  })) ?? [];

  const totalCents = itemsWithCost.reduce((sum, item) => sum + (item.totalCents ?? 0), 0);
  const yieldQty = costData?.recipe.cost_yield;
  const yieldUnitLabel = costData?.recipe.cost_yield_unit;
  const costPerUnit = yieldQty && yieldQty > 0 ? totalCents / yieldQty : null;

  return (
    <div>
      {error && <p className="error">{error}</p>}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="recipe-pick-list">
        {filteredRecipes.map((r) => (
          <button
            key={r.id}
            className={selectedId === r.id ? 'recipe-pick-item selected' : 'recipe-pick-item'}
            onClick={() => { handleRecipeChange(r.id); setSearch(''); }}
          >
            {r.name}
          </button>
        ))}
        {filteredRecipes.length === 0 && <p>No recipes found.</p>}
      </div>

      {loading && <p>Loading...</p>}

      {costData && !loading && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>{costData.recipe.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <strong>Yield per batch:</strong>
            {editingYield ? (
              <>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={yieldValue}
                  onChange={(e) => setYieldValue(e.target.value)}
                  style={{ width: 80 }}
                />
                <input
                  type="text"
                  placeholder="kg"
                  value={yieldUnit}
                  onChange={(e) => setYieldUnit(e.target.value)}
                  style={{ width: 60 }}
                />
                <button onClick={saveYield}>Save</button>
                <button onClick={() => setEditingYield(false)} className="btn-secondary">Cancel</button>
              </>
            ) : (
              <>
                <span>
                  {costData.recipe.cost_yield != null
                    ? `${costData.recipe.cost_yield}${costData.recipe.cost_yield_unit ? ' ' + costData.recipe.cost_yield_unit : ''}`
                    : '—'}
                </span>
                <button onClick={startEditYield}>Edit</button>
              </>
            )}
          </div>

          <div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Qty needed</th>
                  <th>Unit price (ex VAT)</th>
                  <th>VAT</th>
                  <th>Cost (inc VAT)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {itemsWithCost.map((item) => (
                  <tr key={item.ingredient_id}>
                    <td>{item.ingredient_name}</td>
                    <td>
                      {editingQtyId === item.ingredient_id ? (
                        <>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={qtyValue}
                            onChange={(e) => setQtyValue(e.target.value)}
                            style={{ width: 80 }}
                          />
                          {item.cost_unit ? ` ${item.cost_unit}` : ''}
                        </>
                      ) : (
                        item.quantity != null ? `${item.quantity}${item.cost_unit ? ' ' + item.cost_unit : ''}` : '—'
                      )}
                    </td>
                    <td>
                      {item.cost_price_cents != null && item.cost_package_size
                        ? `${(item.cost_price_cents / 100 / item.cost_package_size).toFixed(4)} €/${item.cost_unit ?? 'unit'}`
                        : '—'}
                    </td>
                    <td>{item.cost_vat_rate != null ? `${item.cost_vat_rate}%` : '—'}</td>
                    <td>
                      {item.totalCents != null ? formatEuros(Math.round(item.totalCents)) : '—'}
                    </td>
                    <td>
                      {editingQtyId === item.ingredient_id ? (
                        <>
                          <button onClick={() => saveQty(item.ingredient_id)}>Save</button>
                          <button onClick={() => setEditingQtyId(null)} className="btn-secondary">Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => startEditQty(item)}>Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}><strong>Total batch cost</strong></td>
                  <td><strong>{totalCents > 0 ? formatEuros(Math.round(totalCents)) : '—'}</strong></td>
                  <td></td>
                </tr>
                {costPerUnit != null && (
                  <tr>
                    <td colSpan={4}>
                      <strong>Cost per {yieldUnitLabel ?? 'unit'}</strong>
                    </td>
                    <td><strong>{formatEuros(Math.round(costPerUnit))}</strong></td>
                    <td></td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Scan Invoice Tab ----

function ScanInvoiceTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [assignments, setAssignments] = useState<Record<number, number | ''>>({});
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    costsApi.listIngredients().then(setIngredients);
  }, []);

  async function handleFile(file: File) {
    setError('');
    setSuccess('');
    setItems([]);
    setAssignments({});
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(',');
      const mediaType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

      setScanning(true);
      try {
        const result = await costsApi.scanInvoice(base64, mediaType);
        setItems(result);
        if (result.length === 0) {
          setError('No items could be extracted from this image.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function setAssignment(idx: number, ingredientId: number | '') {
    setAssignments((prev) => ({ ...prev, [idx]: ingredientId }));
  }

  async function applyAll() {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      let count = 0;
      for (let i = 0; i < items.length; i++) {
        const ingId = assignments[i];
        if (!ingId) continue;
        const item = items[i];
        await costsApi.updateIngredient(ingId as number, {
          cost_price_cents: item.price_cents,
          cost_vat_rate: item.vat_rate,
          cost_unit: item.unit || null,
          cost_package_size: item.package_size || null,
        });
        count++;
      }
      if (count === 0) {
        setError('No items assigned to ingredients.');
      } else {
        setSuccess(`Updated ${count} ingredient(s).`);
        const updated = await costsApi.listIngredients();
        setIngredients(updated);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <div
        className="drop-zone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
        {fileName ? (
          <p>{fileName}</p>
        ) : (
          <p>Tap to upload an invoice</p>
        )}
      </div>

      {scanning && <p>Scanning invoice...</p>}

      {items.length > 0 && (
        <div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice item</th>
                  <th>Price</th>
                  <th>VAT</th>
                  <th>Unit</th>
                  <th>Pkg size</th>
                  <th>Assign to ingredient</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>{formatEuros(item.price_cents)}</td>
                    <td>{item.vat_rate}%</td>
                    <td>{item.unit}</td>
                    <td>{item.package_size} {item.unit}</td>
                    <td>
                      <IngredientPicker
                        ingredients={ingredients}
                        value={assignments[idx] ?? ''}
                        onChange={(id) => setAssignment(idx, id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button onClick={applyAll} disabled={saving}>
              {saving ? 'Saving...' : 'Apply to ingredients'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main Page ----

export default function CostsPage() {
  const [tab, setTab] = useState<Tab>('ingredients');

  return (
    <div>
      <div className="page-header">
        <h2>Food Costs</h2>
      </div>
      <div className="tab-bar">
        <button
          className={tab === 'ingredients' ? 'tab-active' : 'tab'}
          onClick={() => setTab('ingredients')}
        >
          Ingredients
        </button>
        <button
          className={tab === 'recipes' ? 'tab-active' : 'tab'}
          onClick={() => setTab('recipes')}
        >
          Recipes
        </button>
        <button
          className={tab === 'scan' ? 'tab-active' : 'tab'}
          onClick={() => setTab('scan')}
        >
          Scan Invoice
        </button>
      </div>
      {tab === 'ingredients' && <IngredientCostsTab />}
      {tab === 'recipes' && <RecipeCostsTab />}
      {tab === 'scan' && <ScanInvoiceTab />}
    </div>
  );
}
