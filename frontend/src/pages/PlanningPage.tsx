import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { planningApi } from '../services/api';
import { PlanningEvent } from '../types';

export default function PlanningPage() {
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    planningApi.listEvents()
      .then(setEvents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const event = await planningApi.createEvent(newName.trim());
      setEvents(prev => [event, ...prev]);
      setNewName('');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this planning event and all its orders?')) return;
    try {
      await planningApi.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h2>Planning</h2>
      </div>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleCreate} className="planning-create-form">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New event name (e.g. Natale 2026)"
        />
        <button type="submit">Create</button>
      </form>

      {events.length === 0 ? (
        <p>No planning events yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id}>
                <td>
                  <a
                    href="#"
                    onClick={e => { e.preventDefault(); navigate(`/planning/${event.id}`); }}
                  >
                    {event.name}
                  </a>
                </td>
                <td>{new Date(event.created_at).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => navigate(`/planning/${event.id}`)}>Open</button>
                  {' '}
                  <button className="btn-danger" onClick={() => handleDelete(event.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
