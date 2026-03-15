import axios from "axios";

export let showGlobalToast = null;

export function registerToastHandler(fn) {
  showGlobalToast = fn;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4001/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || "Something went wrong.";

    if (showGlobalToast) {
      if (message.toLowerCase().includes("locked")) {
        showGlobalToast({
          type: "warning",
          title: "Month Locked",
          message
        });
      } else {
        showGlobalToast({
          type: "error",
          title: "Action Failed",
          message
        });
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Download a CSV export from an authenticated API path.
 * Uses the axios instance so the JWT token is included automatically.
 * @param {string} path   e.g. "/export/allocations/2026-03"
 * @param {string} filename  e.g. "allocations-2026-03.csv"
 */
export async function downloadExport(path, filename) {
  const response = await api.get(path, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default api;