// reducers.js
import { combineReducers } from 'redux';
import { SET_TOKEN } from '../redux-setup/action.jsx';

const tokenReducer = (state = null, action) => {
    switch (action.type) {
        case SET_TOKEN:
            return action.payload;
        default:
            return state;
    }
};



const rootReducer = combineReducers({
    token: tokenReducer,
});

export default rootReducer;