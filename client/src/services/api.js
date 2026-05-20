import axios from "axios";

const BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5219/api";

const api = axios.create({
  baseURL: BASE_URL,

  headers: {
    "Content-Type":
      "application/json",
  },

  timeout: 30000,
});

// REQUEST INTERCEPTOR

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "token"
      );

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  }
);

// RESPONSE INTERCEPTOR

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const responseType =
      error.response?.headers?.[
        "content-type"
      ] || "";

    const isBinaryPayload =
      error.response?.data instanceof
      ArrayBuffer;

    // HANDLE JSON RESPONSE INSIDE ARRAY BUFFER

    if (
      isBinaryPayload &&
      responseType.includes(
        "application/json"
      )
    ) {
      try {
        const decoded =
          new TextDecoder(
            "utf-8"
          ).decode(
            new Uint8Array(
              error.response.data
            )
          );

        error.response.data =
          JSON.parse(decoded);
      } catch {
        // ignore
      }
    }

    // HANDLE TOKEN EXPIRE

    if (
      error.response?.status ===
      401
    ) {
      const requestUrl =
        String(
          error.config?.url || ""
        );

      const isAuthAttempt =
        requestUrl.includes(
          "/auth/login"
        ) ||
        requestUrl.includes(
          "/auth/register"
        );

      if (!isAuthAttempt) {
        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        alert(
          "Session expired. Please login again."
        );

        if (
          window.location
            .pathname !== "/login"
        ) {
          window.location.href =
            "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

// AUTH API

export const authAPI = {
  register: (data) =>
    api.post(
      "/auth/register",
      data
    ),

  login: (data) =>
    api.post(
      "/auth/login",
      data
    ),

  getMe: () =>
    api.get("/auth/me"),

  updateMe: (data) =>
    api.put(
      "/auth/me",
      data
    ),
};

// INVOICE API

export const invoiceAPI = {
  create: (data) =>
    api.post(
      "/invoices",
      data
    ),

  getAll: (params) =>
    api.get("/invoices", {
      params,
    }),

  getById: (id) =>
    api.get(
      `/invoices/${id}`
    ),

  updateStatus: async (
    id,
    data
  ) => {
    try {
      return await api.patch(
        `/invoices/${id}/status`,
            data
      );
    } catch (err) {
      if (
        err.response?.status ===
          404 ||
        err.response?.status ===
          405
      ) {
        return api.put(
          `/invoices/${id}/status`,
                data
        );
      }

      throw err;
    }
  },

  delete: (id) =>
    api.delete(
      `/invoices/${id}`
    ),

  downloadPDF: (id) =>
    api.get(
      `/invoices/${id}/pdf`,
      {
        responseType:
          "arraybuffer",
      }
    ),
};

export default api;