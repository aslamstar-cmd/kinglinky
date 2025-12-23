import axios from "axios";

const API_BASE = axios.create({
  baseURL: "https://kinglinky.onrender.com",
});

// 🔐 AUTO TOKEN ATTACH (admin + user)
API_BASE.interceptors.request.use(
  (req) => {
    const adminToken = localStorage.getItem("adminToken");
    const userToken = localStorage.getItem("userToken");

    if (adminToken) {
      req.headers.Authorization = `Bearer ${adminToken}`;
    } else if (userToken) {
      req.headers.Authorization = `Bearer ${userToken}`;
    }

    return req;
  },
  (error) => Promise.reject(error)
);

export { API_BASE };