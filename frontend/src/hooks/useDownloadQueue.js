import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { downloadFiles } from '../http/cloudApi';
import { setProgress, setDone, setError } from '../store/downloadsReducer';

export const useDownloadQueue = () => {
    const dispatch = useDispatch();
    const items = useSelector(state => state.downloads.items);

    // Актуальный список в ref
    const itemsRef = useRef(items);
    itemsRef.current = items;

    const isRunningRef = useRef(false);
    const runRef = useRef(null);

    const runQueue = async () => {
        if (isRunningRef.current) return;
        isRunningRef.current = true;

        try {
            while (true) {
                const next = itemsRef.current.find(d => d.status === 'pending');
                if (!next) break;

                try {
                    await downloadFiles(
                        { id: next.id, name: next.name, type: next.type },
                        (progress) => {
                            dispatch(setProgress({ id: next.id, progress }));
                        }
                    );
                    dispatch(setDone(next.id));
                } catch (err) {
                    console.error('Ошибка загрузки:', err);
                    dispatch(setError({ id: next.id, error: err.message }));
                }
            }
        } finally {
            isRunningRef.current = false;
        }
    };

    runRef.current = runQueue;

    useEffect(() => {
        const hasPending = items.some(d => d.status === 'pending');
        if (hasPending) {
            runRef.current();
        }
    }, [items]);
};