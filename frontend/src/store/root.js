import {legacy_createStore as createStore, combineReducers, applyMiddleware} from 'redux'
import {composeWithDevTools } from 'redux-devtools-extension'
import thunk from "redux-thunk";
import { orderReducer } from './orderReducer'
import { authReducer } from './authReducer'
import fileReducer from './fileReducer'
import privatePageReducer from './privatePageReducer'
import downloadsReducer from './downloadsReducer';


const rootReducer = combineReducers({
    order: orderReducer,
    auth: authReducer,
    files: fileReducer,
    private: privatePageReducer,
    downloads: downloadsReducer,
})

export const store = createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk)))