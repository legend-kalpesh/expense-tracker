import api from './api';

export const getSummary = async () => (await api.get('/dashboard/summary')).data;
export const getMonthly = async () => (await api.get('/dashboard/monthly')).data;
export const getCategoryBreakdown = async () => (await api.get('/dashboard/categories')).data;
export const saveBudget = async (monthly_budget) =>
  (await api.put('/dashboard/budget', { monthly_budget })).data;
