import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    items: [],
    // status: 'pending' | 'downloading' | 'done' | 'error'
};

const downloadsSlice = createSlice({
    name: 'downloads',
    initialState,
    reducers: {
        addDownload: (state, action) => {
            const { id, name, type } = action.payload;
            if (state.items.some(d => d.id === id)) return;
            state.items.push({
                id,
                name,
                type,
                progress: 0,
                status: 'pending',
                error: null,
                part: 1,
                totalParts: 1,
                loadedMB: null,
            });
        },

        setProgress: (state, action) => {
            const { id, progress, part, totalParts, loadedMB } = action.payload;
            const item = state.items.find(d => d.id === id);
            if (!item) return;

            // Если задача уже завершена — не трогаем прогресс
            if (item.status === 'done' || item.status === 'error') return;

            item.status = 'downloading';

            if (progress !== null && progress !== undefined) {
                item.progress = progress;
                item.loadedMB = null;
            } else {
                item.progress = 0;
                item.loadedMB = loadedMB || null;
            }

            if (part !== undefined) item.part = part;
            if (totalParts !== undefined) item.totalParts = totalParts;
        },

        setDone: (state, action) => {
            const { id, part, totalParts } = action.payload;
            const item = state.items.find(d => d.id === id);
            if (!item) return;

            if (part !== undefined && totalParts !== undefined && part < totalParts) {
                item.part = part;
                item.totalParts = totalParts;
                item.progress = 0;
                item.loadedMB = null;
                item.status = 'downloading';
            } else {
                item.progress = 100;
                item.status = 'done';
                item.loadedMB = null;
                item.part = totalParts || 1;
                item.totalParts = totalParts || 1;
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
            state.items = state.items.filter(
                d => d.status !== 'done' && d.status !== 'error'
            );
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