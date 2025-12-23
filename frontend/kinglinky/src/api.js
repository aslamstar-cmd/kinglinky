import axios from "axios";

const API_BASE = axios.create({
  baseURL: "https://kinglinky.onrender.com",
});

// AUTO TOKEN ATTACH
API_BASE.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  },
  (error) => Promise.reject(error)
);

export { API_BASE };