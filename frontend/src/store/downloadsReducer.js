import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    items: [], // [{ id, name, type, progress, status, error }]
    // status: 'pending' | 'downloading' | 'done' | 'error'
};

const downloadsSlice = createSlice({
    name: 'downloads',
    initialState,
    reducers: {
        addDownload: (state, action) => {
            const { id, name, type } = action.payload;
            // Если уже есть — не добавляем дубликат
            if (state.items.some(d => d.id === id)) return;
            state.items.push({
                id,
                name,
                type,
                progress: 0,
                status: 'pending',
                error: null,
            });
        },
        setProgress: (state, action) => {
            const { id, progress } = action.payload;
            const item = state.items.find(d => d.id === id);
            if (item) {
                item.progress = progress;
                item.status = 'downloading';
            }
        },
        setDone: (state, action) => {
            const item = state.items.find(d => d.id === action.payload);
            if (item) {
                item.progress = 100;
                item.status = 'done';
            }
        },
        setError: (state, action) => {
            const { id, error } = action.payload;
            const item = state.items.find(d => d.id === id);
            if (item) {
                item.status = 'error';
                item.error = error;
            }
        },
        removeDownload: (state, action) => {
            state.items = state.items.filter(d => d.id !== action.payload);
        },
        clearFinished: (state) => {
            state.items = state.items.filter(d => d.status !== 'done' && d.status !== 'error');
        },
    },
});

export const {
    addDownload,
    setProgress,
    setDone,
    setError,
    removeDownload,
    clearFinished,
} = downloadsSlice.actions;

export default downloadsSlice.reducer;