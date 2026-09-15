import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './store/root';
import './index.css';

// Дополнительная защита от перевода
const disableTranslation = () => {
    document.documentElement.setAttribute('translate', 'no');
    document.documentElement.setAttribute('lang', 'ru');
    document.body.setAttribute('translate', 'no');
    document.body.classList.add('notranslate');

    const translatedAttr = document.documentElement.getAttribute('translated');
    if (translatedAttr === '' || translatedAttr === 'yes') {
        document.documentElement.removeAttribute('translated');
    }

    document.documentElement.classList.remove('translated-rtl');
    document.body.classList.remove('translated-rtl');
};

disableTranslation();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Provider store={store}>
        <App />
    </Provider>
);

// ============================================================
// ОДНОРАЗОВАЯ ЗАЧИСТКА SERVICE WORKER'ОВ
// Снимает регистрацию всех SW и чистит их кэши у всех клиентов.
// После того как все клиенты зайдут хотя бы раз (~2-4 недели),
// этот блок можно удалить.
// ============================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();

            if (registrations.length > 0) {
                // Снимаем регистрацию всех SW
                await Promise.all(registrations.map((r) => r.unregister()));

                // Чистим все кэши, которые они создали
                if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                }

                console.log('SW cleanup: unregistered', registrations.length, 'service worker(s)');

                // Однократная перезагрузка, чтобы страница загрузилась уже без SW
                window.location.reload();
            }
        } catch (err) {
            console.warn('SW cleanup failed:', err);
        }
    });
}