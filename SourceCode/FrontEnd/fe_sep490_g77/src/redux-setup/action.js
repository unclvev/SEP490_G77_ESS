// actions.js
export const SET_TOKEN = 'SET_TOKEN';

export const setToken = (token) => ({
    type: SET_TOKEN,
    payload: token,
});

export const UPDATE_TOKEN = "UPDATE_TOKEN";
export const LOGOUT = "LOGOUT";

export const updateToken = ({ token, refreshToken }) => ({
  type: UPDATE_TOKEN,
  payload: { token, refreshToken },
});

export const logout = () => {
    // Clear localStorage
    localStorage.clear();
    // Clear sessionStorage
    sessionStorage.clear();
    return {
        type: LOGOUT
    };
};