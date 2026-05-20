import api from "./api";

export const productAPI = {
  getAll: (params) =>
    api.get("/products", {
      params,
    }),

  getStats: () =>
    api.get(
      "/products/dashboard/stats"
    ),

  create: (data) =>
    api.post(
      "/products",
      data
    ),

  update: (id, data) =>
    api.put(
      `/products/${id}`,
      data
    ),

  delete: (id) =>
    api.delete(
      `/products/${id}`
    ),
};