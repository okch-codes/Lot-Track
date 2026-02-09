import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { Lot } from '../types';
import { lotsApi } from '../services/api';
import LotList from '../components/LotList';
import LotForm from '../components/LotForm';

const PAGE_SIZE = 20;

export default function LotsPage() {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isNew = location.pathname === '/lots/new';
  const isEdit = location.pathname.endsWith('/edit') && !!id;
  const [lots, setLots] = useState<Lot[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (s?: string, f?: string, t?: string, p = 1) => {
    const result = await lotsApi.list(s, f, t, p, PAGE_SIZE);
    setLots(result.data);
    setTotal(result.total);
  }, []);

  useEffect(() => { load(); }, [load]);

  function triggerLoad(s: string, f: string, t: string, p = 1) {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(s || undefined, f || undefined, t || undefined, p);
    }, 300);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    triggerLoad(value, fromDate, toDate, 1);
  }

  function handleFromChange(value: string) {
    setFromDate(value);
    setPage(1);
    load(search || undefined, value || undefined, toDate || undefined, 1);
  }

  function handleToChange(value: string) {
    setToDate(value);
    setPage(1);
    load(search || undefined, fromDate || undefined, value || undefined, 1);
  }

  async function handleDelete(lotId: number) {
    if (!confirm('Delete this lot?')) return;
    try {
      await lotsApi.delete(lotId);
      await load(search || undefined, fromDate || undefined, toDate || undefined, page);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    load(search || undefined, fromDate || undefined, toDate || undefined, newPage);
  }

  if (isNew) return <LotForm />;
  if (isEdit) return <LotForm editId={Number(id)} />;

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
