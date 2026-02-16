import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {Provider} from 'react-redux'
import {store} from './store/root'
import './index.css';

// Дополнительная защита от перевода
const disableTranslation = () => {
  // Устанавливаем атрибуты
  document.documentElement.setAttribute('translate', 'no');
  document.documentElement.setAttribute('lang', 'ru');
  document.body.setAttribute('translate', 'no');
  
  // Добавляем класс для всего body
  document.body.classList.add('notranslate');
  
  // Блокировка если перевод уже начался
  const translatedAttr = document.documentElement.getAttribute('translated');
  if (translatedAttr === '' || translatedAttr === 'yes') {
    document.documentElement.removeAttribute('translated');
  }
  
  // Удаляем классы перевода
  document.documentElement.classList.remove('translated-rtl');
  document.body.classList.remove('translated-rtl');
};

// Вызываем сразу
disableTranslation();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
 
    <Provider store={store}>
        <App />
    </Provider>
 
);


