import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { planningApi, recipesApi } from '../services/api';
import { PlanningGridData, Recipe, Order } from '../types';
import PlanningGrid from '../components/PlanningGrid';

export default function PlanningGridPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PlanningGridData | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Add-column state
  const [showAddCol, setShowAddCol] = useState(false);
  const [newColRecipe, setNewColRecipe] = useState('');
  const [newColSize, setNewColSize] = useState('');

  // Filter state: null = show all, true = only checked, false = only unchecked
  const [filterReady, setFilterReady] = useState<boolean | null>(null);
  const [filterDelivered, setFilterDelivered] = useState<boolean | null>(null);
  const [filterPaid, setFilterPaid] = useState<boolean | null>(null);

  // Add-order state
  const [newClient, setNewClient] = useState('');

  const id = Number(eventId);

  const reload = useCallback(async () => {
    try {
      const grid = await planningApi.getEventGrid(id);
      setData(grid);
    } catch (err: any) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    Promise.all([
      planningApi.getEventGrid(id),
      recipesApi.list('', 1, 500),
    ])
      .then(([grid, recipeResult]) => {
        setData(grid);
        setRecipes(recipeResult.data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handlePatchOrder(orderId: number, fields: Record<string, unknown>) {
    try {
      await planningApi.patchOrder(id, orderId, fields);
      await reload();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleUpsertItem(orderId: number, recipeId: number, size: string, quantity: number) {
    try {
      await planningApi.upsertItem(id, orderId, { recipe_id: recipeId, size, quantity });
      await reload();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeleteOrder(orderId: number) {
    if (!confirm('Delete this order?')) return;
    try {
      await planningApi.deleteOrder(id, orderId);
      await reload();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeleteColumn(recipeId: number, size: string) {
    if (!confirm(`Remove this product column? All quantities for it will be deleted.`)) return;
    try {
      await planningApi.deleteColumn(id, recipeId, size);
      await reload();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleAddOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!newClient.trim()) return;
    try {
      await planningApi.createOrder(id, newClient.trim());
      setNewClient('');
      await reload();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleAddColumn(e: React.FormEvent) {
    e.preventDefault();
    if (!newColRecipe || !newColSize.trim()) return;
    const recipeId = parseInt(newColRecipe, 10);
    try {
      await planningApi.createColumn(id, recipeId, newColSize.trim());
      setShowAddCol(false);
      setNewColRecipe('');
      setNewColSize('');
      await reload();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function getFilteredOrders() {
    if (!data) return [];
    return data.orders.filter(o => {
      if (filterReady !== null && o.is_ready !== filterReady) return false;
      if (filterDelivered !== null && o.is_delivered !== filterDelivered) return false;
      if (filterPaid !== null && o.is_paid !== filterPaid) return false;
      return true;
    });
  }

  function cycleFilter(current: boolean | null): boolean | null {
    if (current === null) return false; // show unchecked only
    if (current === false) return true; // show checked only
    return null; // show all
  }

  function filterLabel(name: string, value: boolean | null): string {
    if (value === null) return name;
    if (value === false) return `${name}: No`;
    return `${name}: Si`;
  }

  function exportCsv() {
    if (!data) return;
    const { columns, event } = data;
    const orders = getFilteredOrders();

    function esc(val: string): string {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    }

    function formatDate(d: string | null): string {
      if (!d) return '';
      const [, m, day] = d.split('-');
      return `${parseInt(day, 10)}/${parseInt(m, 10)}`;
    }

    function formatPrice(cents: number | null): string {
      if (cents == null) return '';
      return (cents / 100).toFixed(2);
    }

    function getQty(order: Order, recipeId: number, size: string): string {
      const qty = order.items?.find(i => i.recipe_id === recipeId && i.size === size)?.quantity;
      return qty ? String(qty) : '';
    }

    // Group columns by recipe for merged header row
    const recipeGroups: { name: string; count: number }[] = [];
    for (const col of columns) {
      const last = recipeGroups[recipeGroups.length - 1];
      if (last && last.name === col.recipe_name) {
        last.count++;
      } else {
        recipeGroups.push({ name: col.recipe_name, count: 1 });
      }
    }

    const rows: string[] = [];

    // Header row 1: recipe names spanning their sizes
    const h1: string[] = ['Cliente'];
    for (const g of recipeGroups) {
      h1.push(esc(g.name));
      for (let i = 1; i < g.count; i++) h1.push('');
    }
    h1.push('Extra', 'Data', 'Indirizzo', 'Prezzo', 'Pronto', 'Consegnato', 'Pagato');
    rows.push(h1.join(','));

    // Header row 2: sizes
    const h2: string[] = [''];
    for (const col of columns) h2.push(esc(col.size));
    h2.push('', '', '', '', '', '', '');
    rows.push(h2.join(','));

    // Totals row
    const totalsRow: string[] = ['Totale'];
    for (const col of columns) {
      const sum = orders.reduce((s, o) => {
        const qty = o.items?.find(i => i.recipe_id === col.recipe_id && i.size === col.size)?.quantity ?? 0;
        return s + qty;
      }, 0);
      totalsRow.push(sum ? String(sum) : '');
    }
    totalsRow.push('', '', '', '', '', '', '');
    rows.push(totalsRow.join(','));

    // Data rows
    for (const order of orders) {
      const row: string[] = [esc(order.client_name)];
      for (const col of columns) {
        row.push(getQty(order, col.recipe_id, col.size));
      }
      row.push(
        esc(order.extra ?? ''),
        formatDate(order.delivery_date),
        esc(order.delivery_address ?? ''),
        formatPrice(order.price_cents),
        order.is_ready ? 'TRUE' : 'FALSE',
        order.is_delivered ? 'TRUE' : 'FALSE',
        order.is_paid ? 'TRUE' : 'FALSE',
      );
      rows.push(row.join(','));
    }

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p>Loading...</p>;
  if (!data) return <p className="error">{error || 'Event not found'}</p>;

  return (
    <div className="planning-grid-page">
      <div className="page-header">
        <h2>{data.event.name}</h2>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={exportCsv}>Export CSV</button>
          <button className="btn-secondary" onClick={() => navigate('/planning')}>&larr; Back</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="planning-toolbar">
        <form onSubmit={handleAddOrder} className="planning-add-order">
          <input
            type="text"
            value={newClient}
            onChange={e => setNewClient(e.target.value)}
            placeholder="Client name"
          />
          <button type="submit">+ Add Order</button>
        </form>

        {!showAddCol ? (
          <button className="btn-secondary" onClick={() => setShowAddCol(true)}>
            + Add Product Column
          </button>
        ) : (
          <form onSubmit={handleAddColumn} className="planning-add-col">
            <select value={newColRecipe} onChange={e => setNewColRecipe(e.target.value)}>
              <option value="">Select recipe...</option>
              {recipes.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={newColSize}
              onChange={e => setNewColSize(e.target.value)}
              placeholder="Size (e.g. 500g, 1kg)"
              list="common-sizes"
            />
            <datalist id="common-sizes">
              <option value="500g" />
              <option value="1kg" />
            </datalist>
            <button type="submit">Add</button>
            <button type="button" className="btn-secondary" onClick={() => setShowAddCol(false)}>
              Cancel
            </button>
          </form>
        )}
      </div>

      <div className="planning-filters">
        {(['is_ready', 'is_delivered', 'is_paid'] as const).map(field => {
          const labels = { is_ready: 'Pronto', is_delivered: 'Consegnato', is_paid: 'Pagato' };
          const state = field === 'is_ready' ? filterReady : field === 'is_delivered' ? filterDelivered : filterPaid;
          const setter = field === 'is_ready' ? setFilterReady : field === 'is_delivered' ? setFilterDelivered : setFilterPaid;
          return (
            <label key={field} className={`filter-chip${state !== null ? ' filter-chip-active' : ''}`}>
              <input
                type="checkbox"
                ref={el => { if (el) el.indeterminate = state === null; }}
                checked={state === true}
                onChange={() => setter(cycleFilter(state))}
              />
              {labels[field]}
            </label>
          );
        })}
        <span className="filter-count">
          {getFilteredOrders().length}/{data.orders.length} ordini
        </span>
      </div>

      <PlanningGrid
        orders={getFilteredOrders()}
        columns={data.columns}
        onPatchOrder={handlePatchOrder}
        onUpsertItem={handleUpsertItem}
        onDeleteOrder={handleDeleteOrder}
        onDeleteColumn={handleDeleteColumn}
      />
    </div>
  );
}
