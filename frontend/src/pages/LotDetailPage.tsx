import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lot } from '../types';
import { lotsApi } from '../services/api';
import LotLabel from '../components/LotLabel';

export default function LotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lot, setLot] = useState<Lot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    lotsApi.get(Number(id)).then(setLot).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!lot) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header no-print">
        <button onClick={() => navigate('/lots')} className="btn-secondary">
          Back to List
        </button>
        <div className="card-actions">
          <button onClick={() => navigate(`/lots/${id}/edit`)}>Edit</button>
          <button onClick={() => window.print()}>Print Label</button>
        </div>
      </div>
      <LotLabel lot={lot} />
    </div>
  );
}
