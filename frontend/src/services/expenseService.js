import api from './api';

// filters: { search, category_id, month, from, to, sort } - empty values are not sent
export const getExpenses = async (filters = {}) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
  return (await api.get('/expenses', { params })).data; // { count, total, expenses }
};
export const createExpense = async (data) => (await api.post('/expenses', data)).data;
export const updateExpense = async (id, data) => (await api.put(`/expenses/${id}`, data)).data;
export const deleteExpense = async (id) => (await api.delete(`/expenses/${id}`)).data;
