import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
});

// Attach the app's JWT (issued after Firebase login) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("appToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token expires, bounce the user back to the login screen.
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
