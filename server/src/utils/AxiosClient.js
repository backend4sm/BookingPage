import axios from "axios";

const API_URL = process.env.BEDS24_API;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const axiosClient = axios.create({ baseURL: API_URL });

let token = null;
let refreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

// Function to refresh token
const refreshToken = async () => {
  if (!refreshing) {
    refreshing = true;
    try {
      const response = await axios.get(`${API_URL}authentication/token`, {
        headers: { refreshToken: REFRESH_TOKEN },
      });

      token = response.data.token;
      onTokenRefreshed(token);
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    } finally {
      refreshing = false;
    }
  }

  return new Promise((resolve) => {
    subscribeTokenRefresh(resolve);
  });
};

// Request interceptor to add token to headers
axiosClient.interceptors.request.use(
  async (config) => {
    console.log(token);
    if (!token) {
      token = await refreshToken();
    }
    config.headers.token = token;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        token = await refreshToken();
        error.config.headers.token = token;
        return axiosClient(error.config);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
