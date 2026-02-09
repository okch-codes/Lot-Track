import { Lot } from '../types';

interface Props {
  lot: Lot;
}

export default function LotLabel({ lot }: Props) {
  return (
    <div className="lot-label">
      <div className="label-header">
        <h2>Lot {lot.lot_number}</h2>
        <p className="recipe-name">{lot.recipe_name}</p>
        <p className="date">{new Date(lot.created_at).toLocaleString()}</p>
      </div>

      <table className="label-table">
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Lot Number</th>
          </tr>
        </thead>
        <tbody>
          {lot.ingredients?.map((ing) => (
            <tr key={ing.id}>
              <td>{ing.ingredient_name}</td>
              <td>{ing.lot_number || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {lot.notes && (
        <div className="label-notes">
          <strong>Notes:</strong> {lot.notes}
        </div>
      )}
    </div>
  );
}
