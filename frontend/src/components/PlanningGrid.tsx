import { useState, useRef, useEffect, useMemo } from 'react';
import { Order, PlanningColumn } from '../types';

interface Props {
  orders: Order[];
  columns: PlanningColumn[];
  onPatchOrder: (orderId: number, fields: Record<string, unknown>) => Promise<void>;
  onUpsertItem: (orderId: number, recipeId: number, size: string, quantity: number) => Promise<void>;
  onDeleteOrder: (orderId: number) => void;
  onDeleteColumn: (recipeId: number, size: string) => void;
}

type EditingCell = { orderId: number; field: string } | null;
type SortKey = 'client_name' | 'delivery_date' | 'price_cents' | 'is_ready' | 'is_delivered' | 'is_paid';
type SortDir = 'asc' | 'desc';

export default function PlanningGrid({ orders, columns, onPatchOrder, onUpsertItem, onDeleteOrder, onDeleteColumn }: Props) {
  const [editing, setEditing] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [sortKey, setSortKey] = useState<SortKey>('delivery_date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  }

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Group columns by recipe for colspan headers
  const recipeGroups = useMemo(() => {
    const groups: { recipe_id: number; recipe_name: string; sizes: string[] }[] = [];
    for (const col of columns) {
      const last = groups[groups.length - 1];
      if (last && last.recipe_id === col.recipe_id) {
        last.sizes.push(col.size);
      } else {
        groups.push({ recipe_id: col.recipe_id, recipe_name: col.recipe_name, sizes: [col.size] });
      }
    }
    return groups;
  }, [columns]);

  // Sort orders
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      let av: string | number | boolean | null;
      let bv: string | number | boolean | null;

      if (sortKey === 'client_name') {
        av = a.client_name.toLowerCase();
        bv = b.client_name.toLowerCase();
      } else if (sortKey === 'delivery_date') {
        // Primary: date, secondary: name
        const da = a.delivery_date ?? '';
        const db = b.delivery_date ?? '';
        if (da !== db) return da < db ? -dir : dir;
        return a.client_name.toLowerCase() < b.client_name.toLowerCase() ? -dir : dir;
      } else if (sortKey === 'price_cents') {
        av = a.price_cents ?? -Infinity;
        bv = b.price_cents ?? -Infinity;
      } else {
        // booleans
        av = a[sortKey] ? 1 : 0;
        bv = b[sortKey] ? 1 : 0;
      }
      if (av! < bv!) return -dir;
      if (av! > bv!) return dir;
      return 0;
    });
  }, [orders, sortKey, sortDir]);

  // Compute totals
  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const order of orders) {
      for (const item of order.items ?? []) {
        const key = `${item.recipe_id}_${item.size}`;
        t[key] = (t[key] ?? 0) + item.quantity;
      }
    }
    return t;
  }, [orders]);

  function getItemQuantity(order: Order, recipeId: number, size: string): number {
    return order.items?.find(i => i.recipe_id === recipeId && i.size === size)?.quantity ?? 0;
  }

  function startEdit(orderId: number, field: string, currentValue: string) {
    setEditing({ orderId, field });
    setEditValue(currentValue);
  }

  async function commitEdit() {
    if (!editing) return;
    const { orderId, field } = editing;
    setEditing(null);

    // Item cell: field format is "item_{recipeId}_{size}"
    if (field.startsWith('item_')) {
      const parts = field.split('_');
      const recipeId = parseInt(parts[1], 10);
      const size = parts.slice(2).join('_');
      const qty = parseInt(editValue, 10) || 0;
      await onUpsertItem(orderId, recipeId, size, qty);
      return;
    }

    // Price field: convert from euros to cents
    if (field === 'price_cents') {
      const cents = editValue ? Math.round(parseFloat(editValue) * 100) : null;
      await onPatchOrder(orderId, { price_cents: cents });
      return;
    }

    // Regular field
    const value = field === 'delivery_date' ? (editValue || null) : editValue;
    await onPatchOrder(orderId, { [field]: value });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditing(null);
    }
  }

  async function handleCheckbox(orderId: number, field: string, current: boolean) {
    await onPatchOrder(orderId, { [field]: !current });
  }

  function renderEditableCell(orderId: number, field: string, displayValue: string, inputType = 'text') {
    if (editing?.orderId === orderId && editing?.field === field) {
      return (
        <input
          ref={inputRef}
          type={inputType}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="cell-input"
        />
      );
    }
    return (
      <span
        className="cell-display"
        onClick={() => startEdit(orderId, field, displayValue)}
      >
        {displayValue || '\u00A0'}
      </span>
    );
  }

  function renderQuantityCell(order: Order, recipeId: number, size: string) {
    const qty = getItemQuantity(order, recipeId, size);
    const field = `item_${recipeId}_${size}`;
    if (editing?.orderId === order.id && editing?.field === field) {
      return (
        <input
          ref={inputRef}
          type="number"
          min="0"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="cell-input cell-input-qty"
        />
      );
    }
    return (
      <span
        className="cell-display cell-qty"
        onClick={() => startEdit(order.id, field, qty ? String(qty) : '')}
      >
        {qty || '\u00A0'}
      </span>
    );
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const [, m, d] = dateStr.split('-');
    return `${parseInt(d, 10)}/${parseInt(m, 10)}`;
  }

  function formatPrice(cents: number | null): string {
    if (cents == null) return '';
    return (cents / 100).toFixed(2);
  }

  return (
    <div className="planning-grid-wrapper">
      <table className="planning-grid">
        <thead>
          {/* Row 1: Recipe group headers */}
          <tr>
            <th className="sticky-col sortable" rowSpan={2} onClick={() => handleSort('client_name')}>Cliente{sortIndicator('client_name')}</th>
            {recipeGroups.map(g => (
              <th key={g.recipe_id} colSpan={g.sizes.length} className="recipe-header">
                {g.recipe_name}
              </th>
            ))}
            <th rowSpan={2}>Extra</th>
            <th className="sortable" rowSpan={2} onClick={() => handleSort('delivery_date')}>Data{sortIndicator('delivery_date')}</th>
            <th rowSpan={2}>Indirizzo</th>
            <th className="sortable" rowSpan={2} onClick={() => handleSort('price_cents')}>Prezzo{sortIndicator('price_cents')}</th>
            <th className="sortable" rowSpan={2} onClick={() => handleSort('is_ready')}>Pronto{sortIndicator('is_ready')}</th>
            <th className="sortable" rowSpan={2} onClick={() => handleSort('is_delivered')}>Consegnato{sortIndicator('is_delivered')}</th>
            <th className="sortable" rowSpan={2} onClick={() => handleSort('is_paid')}>Pagato{sortIndicator('is_paid')}</th>
            <th rowSpan={2}></th>
          </tr>
          {/* Row 2: Size sub-headers */}
          <tr>
            {columns.map(col => (
              <th key={`${col.recipe_id}_${col.size}`} className="size-header">
                {col.size}
                <button
                  className="col-delete-btn"
                  title={`Remove ${col.recipe_name} ${col.size}`}
                  onClick={() => onDeleteColumn(col.recipe_id, col.size)}
                >
                  &times;
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Totals row */}
          {columns.length > 0 && (
            <tr className="totals-row">
              <td className="sticky-col"><strong>Totale</strong></td>
              {columns.map(col => {
                const key = `${col.recipe_id}_${col.size}`;
                return <td key={key} className="cell-qty">{totals[key] || ''}</td>;
              })}
              <td></td><td></td><td></td><td></td>
              <td></td><td></td><td></td><td></td>
            </tr>
          )}
          {/* Order rows */}
          {sortedOrders.map(order => (
            <tr key={order.id}>
              <td className="sticky-col">
                {renderEditableCell(order.id, 'client_name', order.client_name)}
              </td>
              {columns.map(col => (
                <td key={`${col.recipe_id}_${col.size}`} className="qty-cell">
                  {renderQuantityCell(order, col.recipe_id, col.size)}
                </td>
              ))}
              <td>{renderEditableCell(order.id, 'extra', order.extra ?? '')}</td>
              <td>
                {editing?.orderId === order.id && editing?.field === 'delivery_date' ? (
                  <input
                    ref={inputRef}
                    type="date"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={handleKeyDown}
                    className="cell-input"
                  />
                ) : (
                  <span
                    className="cell-display"
                    onClick={() => startEdit(order.id, 'delivery_date', order.delivery_date ?? '')}
                  >
                    {formatDate(order.delivery_date) || '\u00A0'}
                  </span>
                )}
              </td>
              <td>{renderEditableCell(order.id, 'delivery_address', order.delivery_address ?? '')}</td>
              <td>
                {renderEditableCell(
                  order.id, 'price_cents',
                  formatPrice(order.price_cents),
                  'number'
                )}
              </td>
              <td className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={order.is_ready}
                  onChange={() => handleCheckbox(order.id, 'is_ready', order.is_ready)}
                />
              </td>
              <td className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={order.is_delivered}
                  onChange={() => handleCheckbox(order.id, 'is_delivered', order.is_delivered)}
                />
              </td>
              <td className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={order.is_paid}
                  onChange={() => handleCheckbox(order.id, 'is_paid', order.is_paid)}
                />
              </td>
              <td>
                <button className="btn-danger btn-sm" onClick={() => onDeleteOrder(order.id)}>
                  &times;
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
