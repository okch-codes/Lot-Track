import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import RecipesPage from './pages/RecipesPage';
import IngredientsPage from './pages/IngredientsPage';
import LotsPage from './pages/LotsPage';
import LotDetailPage from './pages/LotDetailPage';
import UpdateBanner from './components/UpdateBanner';
import { useVersionCheck } from './hooks/useVersionCheck';

export default function App() {
  const updateAvailable = useVersionCheck();
  return (
    <>
      <UpdateBanner updateAvailable={updateAvailable} />
      <Layout>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/ingredients" element={<IngredientsPage />} />
          <Route path="/lots" element={<LotsPage />} />
          <Route path="/lots/new" element={<LotsPage />} />
          <Route path="/lots/:id/edit" element={<LotsPage />} />
          <Route path="/lots/:id" element={<LotDetailPage />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
    </>
  );
}
