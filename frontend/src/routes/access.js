// ============================================================
// ЕДИНЫЙ ИСТОЧНИК ПРАВ ДОСТУПА
// Меняешь здесь — синхронно меняются и роуты, и меню.
// ============================================================

export const MENU_GROUPS = [
   {
        title: 'Меню',
        roles: ['GUEST'],
        items: [
            { label: 'Оформление заказа', path: '/web',  icon: 'bi-cart' },
            { label: 'Вход',         path: '/auth', icon: 'bi-box-arrow-in-right' },
        ],
    },
    {
        title: 'Работа',
        roles: ['ADMIN', 'WORKER'],
        items: [
            { label: 'Заказы',   path: '/table',    icon: 'bi-receipt' },
            { label: 'Редактор', path: '/redactor', icon: 'bi-image' },
            { label: 'Клиенты',  path: '/users',    icon: 'bi-people' },
            { label: 'Файлы',    path: '/cloud',    icon: 'bi-folder2-open' },
        ],
    },
    {
        title: 'Личный кабинет',
        roles: ['ADMIN', 'WORKER', 'PARTNER', 'USER'],
        items: [
            { label: 'История заказов', path: '/myOrders',  icon: 'bi-bag' },
            { label: 'Личные данные',   path: '/myProfile',  icon: 'bi-person-badge' },
            { label: 'Мои файлы',       path: '/myFiles',  icon: 'bi-folder' },
            { label: 'Оформить заказ',  path: '/web',      icon: 'bi-plus' },
        ],
    },
    {
        title: 'Root-доступ',
        roles: ['ADMIN'],
        items: [
            { label: 'Журнал расходов', path: '/expenses',  icon: 'bi-cash-stack' },
            { label: 'Статистика',      path: '/statistic', icon: 'bi-bar-chart' },
            { label: 'Настройки',       path: '/setting',   icon: 'bi-gear' },
            { label: 'Инструменты',       path: '/tools',   icon: 'bi-three-dots' },
            
        ],
    },

];

// Дополнительные страницы, которые нужны в роутере, но не показываются в меню.
// Например, /history — доступна всем авторизованным, но пункта в меню нет.
export const EXTRA_ROUTES = [
    { path: '/history', roles: ['ADMIN', 'WORKER', 'PARTNER', 'USER'] },
];

// Публичные роуты (когда не авторизован)
export const PUBLIC_ROUTES = [
    { path: '/web', roles: ['*'] },
    { path: '/auth', roles: ['*'] },
];


export const getMenuForRole = (role) => {
    // Если роль не передана — это гость
    const effectiveRole = role || 'GUEST';

    return MENU_GROUPS.filter(
        (group) => !group.roles || group.roles.includes(effectiveRole)
    );
};

/**
 * Получить список доступных путей (path) для роли.
 * Используется в AppRouter, чтобы построить маршруты.
 * @param {string} role
 */
export const getRoutesForRole = (role) => {
    const paths = new Set();

    MENU_GROUPS.forEach((group) => {
        if (!group.roles || group.roles.includes(role)) {
            group.items.forEach((item) => paths.add(item.path));
        }
    });

    EXTRA_ROUTES.forEach((route) => {
        if (!route.roles || route.roles.includes(role) || route.roles.includes('*')) {
            paths.add(route.path);
        }
    });

    return Array.from(paths);
};

/**
 * Получить публичные пути.
 */
export const getPublicRoutes = () => {
    return PUBLIC_ROUTES.map((r) => r.path);
};

/**
 * Получить читаемое имя раздела по пути.
 * Ищет по всем MENU_GROUPS — берёт label первого совпадающего пункта.
 */
export const getSectionTitle = (pathname) => {
    for (const group of MENU_GROUPS) {
        const item = group.items.find(
            (i) => pathname === i.path || pathname.startsWith(i.path + '/')
        );
        if (item) return item.label;
    }
    return null;
};