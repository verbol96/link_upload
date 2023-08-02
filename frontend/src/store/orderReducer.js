const UPDATE_ORDER_STATUS = 'UPDATE_ORDER_STATUS';
const SAVE_ORDERS = 'SAVE_ORDERS'
const SAVE_SETTINGS = 'SAVE_SETTINGS'
const ADD_ORDER = 'ADD_ORDER'
const UPDATE_ORDER = 'UPDATE_ORDER'
const DELETE_ORDER = 'DELETE_ORDER'
const SAVE_USERS = 'SAVE_USERS'

const defaultState = {
    settings: [],
    order: [],
    users: [],
    leftMenu: false
}

export const orderReducer = (state = defaultState, action) =>{
    switch(action.type){
        case 'showLeftMenu': return {...state, leftMenu: true}
        case 'closeLeftMenu': return {...state, leftMenu: false}

        case UPDATE_ORDER_STATUS:
            const updatedOrders = state.order.map(el => {
                
                if (el.id === action.payload.orderId) {
                return { ...el, status: action.payload.newStatus };
                }
                return el;
            });
            return { ...state, order: updatedOrders };

        case SAVE_ORDERS: 
            return {...state, order: action.payload}

        case SAVE_SETTINGS:
            return {...state, settings: action.payload}

        case SAVE_USERS:
            return {...state, users: action.payload}


        case ADD_ORDER: 
            return {...state, order: [...state.order, action.payload]}
        

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

        case DELETE_ORDER: 
            return {...state, order: state.order.filter(el=>el.id!==action.payload)}

        default: return state
    }
}

export const updateOrderStatus = (orderId, newStatus) => ({
    type: UPDATE_ORDER_STATUS,
    payload: { orderId, newStatus }
  });

export const saveOrders = (orders) => ({type: SAVE_ORDERS, payload: orders});
export const saveSettings = (settings) => ({type: SAVE_SETTINGS, payload: settings});
export const saveUsers = (users) => ({type: SAVE_USERS, payload: users});

export const addOrder = (orderNew)=>({type: 'ADD_ORDER', payload: orderNew})
export const updateOrderAction = (orderId, data) =>({type: 'UPDATE_ORDER', payload: {orderId, data}})
export const deleteOrderId = (id) =>({type:'DELETE_ORDER', payload: id})
  