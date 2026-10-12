import { updateOrder } from './dbApi'

const queues = new Map()

export const queueOrderOperation = (id, operation) => {
    const key = String(id)
    const previous = queues.get(key) || Promise.resolve()
    const current = previous.catch(() => {}).then(operation)
    queues.set(key, current)
    current.then(
        () => { if (queues.get(key) === current) queues.delete(key) },
        () => { if (queues.get(key) === current) queues.delete(key) }
    )
    return current
}

export const queueOrderSave = (orderId, data) =>
    queueOrderOperation(orderId, () => updateOrder(orderId, data))