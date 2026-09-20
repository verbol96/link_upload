// ============ КАТЕГОРИИ РАСХОДОВ ============

export const EXPENSE_CATEGORIES = {
    // ===== Производственные (себестоимость) =====
    photopaper: {
        name: 'Фотобумага',
        group: 'production',
        color: '#0D9488',
        icon: 'bi-image',
    },
    chemistry: {
        name: 'Химия',
        group: 'production',
        color: '#8b5cf6',
        icon: 'bi-droplet',
    },
    water: {
        name: 'Вода',
        group: 'production',
        color: '#06b6d4',
        icon: 'bi-water',
    },
    ink: {
        name: 'Чернила',
        group: 'production',
        color: '#6366f1',
        icon: 'bi-droplet-half',
    },
    canvas: {
        name: 'Холст',
        group: 'production',
        color: '#f59e0b',
        icon: 'bi-brush',
    },
    plotter_paper: {
        name: 'Бумага плоттер',
        group: 'production',
        color: '#14b8a6',
        icon: 'bi-file-earmark',
    },
    stretchers: {
        name: 'Подрамники',
        group: 'production',
        color: '#a16207',
        icon: 'bi-bounding-box',
    },
    photo_frames: {
        name: 'Фоторамки',
        group: 'production',
        color: '#a3a3a3',
        icon: 'bi-border-outer',
    },
    packaging: {
        name: 'Упаковка',
        group: 'production',
        color: '#84cc16',
        icon: 'bi-box',
    },
    other_materials: {
        name: 'Другие материалы',
        group: 'production',
        color: '#a8a29e',
        icon: 'bi-three-dots',
    },

    // ===== Административные (накладные) =====
    shipping: {
        name: 'Отправка',
        group: 'admin',
        color: '#0ea5e9',
        icon: 'bi-truck',
    },
    taxes: {
        name: 'Налоги',
        group: 'admin',
        color: '#dc2626',
        icon: 'bi-receipt-cutoff',
    },
    rent: {
        name: 'Аренда',
        group: 'admin',
        color: '#3b82f6',
        icon: 'bi-house-door',
    },
    ads: {
        name: 'Реклама',
        group: 'admin',
        color: '#ec4899',
        icon: 'bi-megaphone',
    },
    site: {
        name: 'Сайт',
        group: 'admin',
        color: '#6366f1',
        icon: 'bi-globe',
    },
    salary: {
        name: 'ЗП',
        group: 'admin',
        color: '#ef4444',
        icon: 'bi-people',
    },
    equipment: {
        name: 'Оборудование',
        group: 'admin',
        color: '#6b7280',
        icon: 'bi-tools',
    },
    household: {
        name: 'Быт',
        group: 'admin',
        color: '#14b8a6',
        icon: 'bi-house-heart',
    },
    other_expenses: {
        name: 'Другие расходы',
        group: 'admin',
        color: '#a8a29e',
        icon: 'bi-three-dots',
    },
};

// ============ ГРУППЫ КАТЕГОРИЙ ============

export const CATEGORY_GROUPS = {
    production: {
        name: 'Производственные',
        icon: 'bi-gear',
        color: '#0D9488',
    },
    admin: {
        name: 'Административные',
        icon: 'bi-building',
        color: '#6366f1',
    },
};

// ============ УТИЛИТЫ ============

// Список ключей категорий (для валидации и селектов)
export const CATEGORY_KEYS = Object.keys(EXPENSE_CATEGORIES);

// Получить категории по группе
export const getCategoriesByGroup = (group) =>
    Object.entries(EXPENSE_CATEGORIES)
        .filter(([, cat]) => cat.group === group)
        .map(([key, cat]) => ({ key, ...cat }));

// Быстрый доступ к категории
export const getCategory = (key) => EXPENSE_CATEGORIES[key] || null;