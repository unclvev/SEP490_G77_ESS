// store.js
import rootReducer from './reducers';
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { createStore } from "redux";
const persistConfig = {
    key: "redux-store",
    storage: storage,
    keyPrefix: "key"
}

const store = createStore(persistReducer(persistConfig, rootReducer));
persistStore(store);
export default store;