import axios from "axios";
import { BASE_API_LOCAL } from "../share/urlbase";
import store from "../redux-setup/store";
import { setToken } from "../redux-setup/action";


const Http = axios.create({
    baseURL: BASE_API_LOCAL,
});


let isRefreshing = false;
let failedQueue = [];


const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};


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


Http.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;


        // Prevent infinite refresh loops
        if (error.response?.status === 401 && originalRequest._retry) {
            // If we already tried to refresh, just logout
            store.dispatch(setToken(null));
            console.log("TOken hết hạn");
            return Promise.reject(error);
        }


        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                        return Http(originalRequest);
                    })
                    .catch(err => {
                        // If refresh fails, redirect to login
                        store.dispatch(setToken(null));
                        console.log("TOken hết hạn");
                        return Promise.reject(err);
                    });
            }


            originalRequest._retry = true;
            isRefreshing = true;


            try {
                const refreshToken = store.getState().token?.refreshToken;
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }


                const response = await axios.post(`${BASE_API_LOCAL}/Login/refresh`, refreshToken);


                if (!response.data.accessToken) {
                    throw new Error('Invalid refresh token response');
                }


                const newToken = response.data.accessToken;
               
                // Update token in store
                store.dispatch({
                    type: 'UPDATE_TOKEN',
                    payload: {
                        token: newToken,
                        refreshToken: refreshToken
                    }
                });


                // Update Authorization header
                Http.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;


                processQueue(null, newToken);
                return Http(originalRequest);
            } catch (error) {
                processQueue(error, null);
                // Clear tokens and logout user
                store.dispatch(setToken(null));
                console.log("TOken hết hạn");
                return Promise.reject(error);
            } finally {
                isRefreshing = false;
            }
        }


        return Promise.reject(error);
    }
);


export default Http;
