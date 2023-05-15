const defaultState = {
    editRow: 0,
    order: [],
    user: [],
    photo: [],
    adress: [],
    printList: [],
    leftMenu: false
}

export const orderReducer = (state = defaultState, action) =>{
    switch(action.type){
        case 'editRow': return {...state, editRow: action.payload}
        case 'saveOrder': return {...state, order: action.payload}
        case 'saveUser': return {...state, user: action.payload}
        case 'savePhoto': return {...state, photo: action.payload}
        case 'saveAdress': return {...state, adress: action.payload}
        case 'getPrintList': return {...state, printList: [...state.printList, action.payload]}
        case 'setPrintList': return {...state, printList: state.printList.filter(el=>el!==action.payload)}
        case 'showLeftMenu': return {...state, leftMenu: true}
        case 'closeLeftMenu': return {...state, leftMenu: false}
        default: return state
    }
}