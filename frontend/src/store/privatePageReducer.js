const SET_USER = "SET_USER"
const CHANGE_NAME = 'CHANGE_NAME'
const UPDATE_ORDER = 'UPDATE_ORDER'


const defaultState = {
    user: [],
    order: []
}

export default function privatePageReducer(state = defaultState, action) {
    switch (action.type) {
        case SET_USER: return {...state,   user: action.payload.user, 
                                            order: action.payload.user.orders
                                          }
        case CHANGE_NAME: return {...state, user: {...state.user, FIO: action.payload}}

        case UPDATE_ORDER:
            return {
                ...state,
                order: state.order.map(el => {
                    if (el.id === action.payload.orderId) {
                        return { 
                            ...el, 
                            ...action.payload.data
                        };
                    }
                    return el;
                }),
            };
      
        default:
            return state
    }
}   

export const setUser = (data) => ({type: SET_USER, payload: data})
export const changeName = (data) => ({type: CHANGE_NAME, payload: data})
export const updateOrderPrivate = (orderId, data) =>({type: 'UPDATE_ORDER', payload: {orderId, data}})
