import { Link } from 'react-router-dom';
import { Lot } from '../types';

interface Props {
  lots: Lot[];
  onDelete: (id: number) => void;
}

export default function LotList({ lots, onDelete }: Props) {
  if (lots.length === 0) return <p>No lots yet.</p>;

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Lot Number</th>
            <th>Recipe</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {lots.map((l) => (
            <tr key={l.id}>
              <td>
                <Link to={`/lots/${l.id}`}>{l.lot_number}</Link>
              </td>
              <td>{l.recipe_name}</td>
              <td>{new Date(l.created_at).toLocaleString()}</td>
              <td>
                <Link to={`/lots/${l.id}/edit`}><button>Edit</button></Link>
                <button onClick={() => onDelete(l.id)} className="btn-danger">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
