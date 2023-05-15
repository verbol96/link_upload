const defaultState = {
    auth: false
}

export const authReducer = (state = defaultState, action) =>{
    switch(action.type){
       case 'authStatus': return {...state, auth: action.paylods}
       default: return state
    }
}