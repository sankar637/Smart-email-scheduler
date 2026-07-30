import axios from "axios";

const api = axios.create({
  baseURL: "https://smart-email-scheduler-backend.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("appToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("appToken");
      localStorage.removeItem("appUser");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;