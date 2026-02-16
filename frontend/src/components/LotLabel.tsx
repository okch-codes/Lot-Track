import { Lot } from '../types';

interface Props {
  lot: Lot;
}

export default function LotLabel({ lot }: Props) {
  return (
    <>
      {/* Screen version */}
      <div className="lot-label lot-label-screen">
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
                <td>{ing.is_highlighted ? <u>{ing.ingredient_name}</u> : ing.ingredient_name}</td>
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
        {lot.ingredients?.some((ing) => ing.is_highlighted) && (
          <p className="allergen-note"><u>Sottolineato</u> = contiene allergeni</p>
        )}
      </div>

      {/* Print version */}
      <div className="lot-label lot-label-print">
        <div>
          <div className="print-title">
            <span className="print-recipe">{lot.recipe_name}</span>
            <span className="print-lot">Lotto {lot.lot_number}</span>
          </div>
          <p>{(lot.ingredients || []).map((ing, idx) => (
            <span key={ing.id}>{idx > 0 ? ', ' : ''}{ing.is_highlighted ? <u>{ing.ingredient_name}</u> : ing.ingredient_name}</span>
          ))}</p>
          {lot.notes && <div className="print-notes">{lot.notes}</div>}
        </div>
      </div>
    </>
  );
}
