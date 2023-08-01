const SET_USER = "SET_USER"
const CHANGE_NAME = 'CHANGE_NAME'


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
      
        default:
            return state
    }
}   

export const setUser = (data) => ({type: SET_USER, payload: data})
export const changeName = (data) => ({type: CHANGE_NAME, payload: data})
