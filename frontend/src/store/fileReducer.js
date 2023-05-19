const SET_FILES = "SET_FILES"
const SET_CURRENT_DIR = "SET_CURRENT_DIR"
const ADD_FILE = "ADD_FILE"
const PUSH_STACK = 'PUSH_STACK'
const DELETE_FILE = 'DELETE_FILE'

const defaultState = {
    files: [],
    currentDir: null,
    stackDir: [ ],
    TypePhoto: [
        'фотографии',
        'холсты',
        'магниты'
    ],
    FormatPhoto: [
        'стандарт(10x15)',
        'квадрат(10x10)',
        'полароид(10х12)',
        'полароид(7х9)',
        'А5(15х20)',
        'А4(20х30)',
        'другой до 7х10',
        'другой до 10х15',
        'другой до 15х20',
        'другой до 20х30'
    ],
    FormatHolst: [
        '30x40',
        '40x40',
        '40x55',
        '55x55',
        '50x70',
        '55x80'
    ],
    FormatMagnit: [
        '5x8',
        '10x10'
    ]
}

export default function fileReducer(state = defaultState, action) {
    switch (action.type) {
        case SET_FILES: return {...state, files: action.payload}
        case SET_CURRENT_DIR: return {...state, currentDir: action.payload}
        case ADD_FILE: return {...state, files:[...state.files, action.payload]}
        case PUSH_STACK: return {...state, stackDir: [...state.stackDir, action.payload]}
        case DELETE_FILE: return {...state, files: [...state.files.filter(file=>file.id!==action.payload)]}
        default:
            return state
    }
}   

export const setFiles = (files) => ({type: SET_FILES, payload: files})
export const setCurrentDir= (dir) => ({type: SET_CURRENT_DIR, payload: dir})
export const addFile = (file)=>({type: ADD_FILE, payload: file})
export const pushStack = (dir)=>({type: PUSH_STACK, payload: dir})
export const deleteFileStore = (fileId)=>({type: DELETE_FILE, payload: fileId})