import axios from "axios";

const API_URL = process.env.BEDS24_API;

const axiosClient = axios.create({ baseURL: API_URL });

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.token = token;
  }
  return config;
});

export default axiosClient;
