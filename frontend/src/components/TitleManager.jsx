import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Соответствие маршрута и заголовка вкладки
const ROUTE_TITLES = {
    '/table':     'Заказы',
    '/redactor':  'Редактор',
    '/cloud':     'Файлы',
    '/expenses':  'Журнал расходов',
    '/users':     'Клиенты',
    '/statistic': 'Статистика',
    '/material':  'Учёт бумаги',
    '/private':   'Личный кабинет',
    '/web':       'Форма заказа',
    '/setting':   'Настройки',
    '/auth':      'Вход',
    '/history':   'История обновлений',
};

const BASE_TITLE = 'LINK';

export const TitleManager = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Ищем точное совпадение или маршрут, с которого начинается текущий путь
        // (для вложенных путей вроде /users/123)
        const match = Object.entries(ROUTE_TITLES).find(([path]) =>
            pathname === path || pathname.startsWith(path + '/')
        );

        const title = match ? match[1] : null;
        document.title = title ? `${BASE_TITLE} - ${title}` : BASE_TITLE;
    }, [pathname]);

    return null; // компонент ничего не рендерит, только меняет title
};