import api from './api';

export const getCategories = async () => (await api.get('/categories')).data.categories;
export const createCategory = async (category_name) =>
  (await api.post('/categories', { category_name })).data;
export const updateCategory = async (id, category_name) =>
  (await api.put(`/categories/${id}`, { category_name })).data;
// reassignTo: id of the category that should receive the expenses (needed when the category is not empty)
export const deleteCategory = async (id, reassignTo) =>
  (await api.delete(`/categories/${id}`, { params: reassignTo ? { reassign_to: reassignTo } : {} })).data;
