import axios from "axios";

export const API_BASE = "https://api.kinglinky.com";

const api = axios.create({
  baseURL: API_BASE,
});

export default api;