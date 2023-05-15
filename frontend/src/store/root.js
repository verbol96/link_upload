import {legacy_createStore as createStore, combineReducers, applyMiddleware} from 'redux'
import {composeWithDevTools } from 'redux-devtools-extension'
import thunk from "redux-thunk";
import { orderReducer } from './orderReducer'
import { authReducer } from './authReducer'
import fileReducer from './fileReducer'


const rootReducer = combineReducers({
    order: orderReducer,
    auth: authReducer,
    files: fileReducer
})

export const store = createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk)))