import axios from "axios";
import store from "../redux-setup/store";
import { BASE_API_LOCAL } from "../share/urlbase";

const Http = axios.create({
    baseURL: BASE_API_LOCAL,
});

Http.interceptors.request.use(
    async (config) => {
        const token = store.getState().token?.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default Http;
