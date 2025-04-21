// reducers.js
import { combineReducers } from 'redux';
import { SET_TOKEN, UPDATE_TOKEN, LOGOUT } from './action.js'

const tokenReducer = (state = null, action) => {
    switch (action.type) {
        case SET_TOKEN:
            return action.payload;
        case UPDATE_TOKEN:
            return {
                token: action.payload.token,
                refreshToken: action.payload.refreshToken
            };
        case LOGOUT:
            return null;
        default:
            return state;
    }
};

const rootReducer = combineReducers({
    token: tokenReducer,
});

export default rootReducer;