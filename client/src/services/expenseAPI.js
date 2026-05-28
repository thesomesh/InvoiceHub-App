import api from "./api";

export const expenseAPI = {
  getAll: () => api.get("/expenses"),

  create: (expenseData) =>
    api.post("/expenses", expenseData),

  delete: (id) =>
    api.delete(`/expenses/${id}`),
};