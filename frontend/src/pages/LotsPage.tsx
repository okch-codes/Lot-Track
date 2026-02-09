import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { Lot } from '../types';
import { lotsApi } from '../services/api';
import LotList from '../components/LotList';
import LotForm from '../components/LotForm';

export default function LotsPage() {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isNew = location.pathname === '/lots/new';
  const isEdit = location.pathname.endsWith('/edit') && !!id;
  const [lots, setLots] = useState<Lot[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (s?: string, f?: string, t?: string) => {
    setLots(await lotsApi.list(s, f, t));
  }, []);

  useEffect(() => { load(); }, [load]);

  function triggerLoad(s: string, f: string, t: string) {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(s || undefined, f || undefined, t || undefined);
    }, 300);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    triggerLoad(value, fromDate, toDate);
  }

  function handleFromChange(value: string) {
    setFromDate(value);
    load(search || undefined, value || undefined, toDate || undefined);
  }

  function handleToChange(value: string) {
    setToDate(value);
    load(search || undefined, fromDate || undefined, value || undefined);
  }

  async function handleDelete(lotId: number) {
    if (!confirm('Delete this lot?')) return;
    try {
      await lotsApi.delete(lotId);
      await load(search || undefined, fromDate || undefined, toDate || undefined);
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (isNew) return <LotForm />;
  if (isEdit) return <LotForm editId={Number(id)} />;

  return (
    <div>
      <div className="page-header">
        <h2>Lots</h2>
        <Link to="/lots/new"><button>New Lot</button></Link>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search lots..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => handleFromChange(e.target.value)}
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => handleToChange(e.target.value)}
        />
      </div>
      <LotList lots={lots} onDelete={handleDelete} />
    </div>
  );
}
