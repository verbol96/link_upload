const UPDATE_ORDER_STATUS = 'UPDATE_ORDER_STATUS';
const SAVE_ORDERS = 'SAVE_ORDERS'
const SAVE_SETTINGS = 'SAVE_SETTINGS'
const ADD_ORDER = 'ADD_ORDER'
const UPDATE_ORDER = 'UPDATE_ORDER'
const DELETE_ORDER = 'DELETE_ORDER'
const SAVE_USERS = 'SAVE_USERS'
const UPDATE_SMS_ADD = 'UPDATE_SMS_ADD'
const UPDATE_SMS_SEND = 'UPDATE_SMS_SEND'
const UPDATE_SMS_ERROR = 'UPDATE_SMS_ERROR'
const UPDATE_SMS_PAY = 'UPDATE_SMS_PAY'

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
        
        case UPDATE_SMS_ADD:
            return {
                ...state,
                order: state.order.map((el) => {
                if (el.id === action.payload) {
                    return {
                    ...el,
                    is_sms_add: true,
                    };
                } else {
                    return el; // Вернуть элемент без изменений
                }
                }),
            };
        
        case UPDATE_SMS_SEND:
            return {
                ...state,
                order: state.order.map((el) => {
                if (el.id === action.payload) {
                    return {
                    ...el,
                    is_sms_send: true,
                    };
                } else {
                    return el; // Вернуть элемент без изменений
                }
                }),
            };

        case UPDATE_SMS_ERROR:
            return {
                ...state,
                order: state.order.map((el) => {
                if (el.id === action.payload) {
                    return {
                    ...el,
                    is_sms_error: true,
                    };
                } else {
                    return el; // Вернуть элемент без изменений
                }
                }),
            };

            case UPDATE_SMS_PAY:
                return {
                    ...state,
                    order: state.order.map((el) => {
                    if (el.id === action.payload) {
                        return {
                        ...el,
                        is_sms_pay: true,
                        };
                    } else {
                        return el; // Вернуть элемент без изменений
                    }
                    }),
                };

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

export const updateSmsAdd  = (id) =>({type: 'UPDATE_SMS_ADD', payload: id})
export const updateSmsSend  = (id) =>({type: 'UPDATE_SMS_SEND', payload: id})
export const updateSmsError  = (id) =>({type: 'UPDATE_SMS_ERROR', payload: id})
export const updateSmsPay  = (id) =>({type: 'UPDATE_SMS_PAY', payload: id})
  