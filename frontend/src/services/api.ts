import { Recipe, Ingredient, Lot, LotHistoryEntry } from '../types';

const BASE = '/api';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const recipesApi = {
  list: (search?: string, page = 1, limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return request<PaginatedResponse<Recipe>>(`/recipes?${params}`);
  },
  get: (id: number) => request<Recipe>(`/recipes/${id}`),
  create: (data: { name: string; ingredients: string[] }) =>
    request<Recipe>('/recipes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { name: string; ingredients: string[] }) =>
    request<Recipe>(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/recipes/${id}`, { method: 'DELETE' }),
  getIngredientsWithLots: (id: number) =>
    request<Ingredient[]>(`/recipes/${id}/ingredients-with-lots`),
};

export const ingredientsApi = {
  list: (search?: string, page = 1, limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return request<PaginatedResponse<Ingredient>>(`/ingredients?${params}`);
  },
  getLotHistory: (id: number) =>
    request<LotHistoryEntry[]>(`/ingredients/${id}/lot-history`),
  updateLotNumber: (id: number, last_lot_number: string) =>
    request<Ingredient>(`/ingredients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ last_lot_number }),
    }),
};

export const lotsApi = {
  list: (search?: string, from?: string, to?: string, page = 1, limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return request<PaginatedResponse<Lot>>(`/lots?${params}`);
  },
  get: (id: number) => request<Lot>(`/lots/${id}`),
  nextNumber: () => request<{ next_number: string }>('/lots/next-number', { method: 'POST' }),
  create: (data: {
    recipe_id: number;
    ingredients: { ingredient_id: number; lot_number: string }[];
    notes?: string;
  }) => request<Lot>('/lots', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: {
    ingredients: { ingredient_id: number; lot_number: string }[];
    notes?: string;
  }) => request<Lot>(`/lots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/lots/${id}`, { method: 'DELETE' }),
};
