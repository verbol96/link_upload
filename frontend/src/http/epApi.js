import { $host } from './index';

let opsCache = null;
let opsCacheTime = 0;
let opsRequest = null;

export const getListOpsEP = () => {
    if (opsCache && Date.now() - opsCacheTime < 30 * 60 * 1000) {
        return Promise.resolve(opsCache);
    }

    if (!opsRequest) {
        opsRequest = $host.get('api/ep/getListOps')
            .then(({ data }) => {
                if (!Array.isArray(data)) {
                    throw new Error('Неверный формат списка отделений');
                }

                opsCache = data;
                opsCacheTime = Date.now();

                return data;
            })
            .finally(() => {
                opsRequest = null;
            });
    }

    return opsRequest;
};

export const sendOrderEP = async (params) => {
    const { data } = await $host.post('api/ep/sendOrder', params);
    return data;
};

export const checkOrderEP = async (number) => {
    const { data } = await $host.post('api/ep/checkOrder', { number });
    return data;
};

export const getOrderHistoryEP = async (number) => {
    const { data } = await $host.get('api/ep/history', {
        params: { number }
    });

    return data;
};

export const getLabelEP = async (number) => {
    const { data } = await $host.get(
        `api/ep/label/${encodeURIComponent(number)}`,
        { responseType: 'blob' }
    );

    return data;
};