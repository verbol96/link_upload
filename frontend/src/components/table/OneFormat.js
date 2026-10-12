import './DescRow.css'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getFilesPhotosId } from '../../http/cloudApi'

export const OneFormat = ({ el, setPhoto, index, DeleteFormat }) => {
    const settings = useSelector(state => state.order.settings) || []
    const typePhoto = ['photo', 'holst', 'magnit', 'poster']
    const formats = type => settings.filter(item => item.type === type)

    const Update = (event, prop) => {
        const value = event.target.value
        setPhoto(previous => previous.map((item, i) => {
            if (i !== index) return item
            if (prop !== 'type') return { ...item, [prop]: value }
            const defaults = { photo: 'а6', holst: '30x40', magnit: '5x8', poster: 'poster3040' }
            return { ...item, type: value, format: defaults[value] || 'а6', amount: '1', copies: 1, paper: 'glossy' }
        }))
    }

    const [checkAmount, setCheckAmount] = useState(-1)
    useEffect(() => {
        let cancelled = false
        if (!el.id) {
            setCheckAmount(0)
            return () => { cancelled = true }
        }
        setCheckAmount(-1)
        getFilesPhotosId(el.id)
            .then(data => {
                if (!cancelled) setCheckAmount(data.filter(item => item.size > 0).length)
            })
            .catch(error => {
                console.error('Ошибка получения файлов:', error)
                if (!cancelled) setCheckAmount(0)
            })
        return () => { cancelled = true }
    }, [el.id])

    return (
        <div className="format_group">
            <button style={{ background: '#f2f2f2', flex: 1, padding: '0px 5px', textAlign: 'center', width: 0, height: '30px', margin: '5px', color: 'lightgray' }} title="Проверить фото" disabled>
                {checkAmount === -1 ? <i className="bi bi-arrow-repeat animate-spin" /> : checkAmount}
            </button>
            <input type="text" value={el.amount} onChange={e => Update(e, 'amount')} />
            <select value={el.type} onChange={e => Update(e, 'type')}>
                {typePhoto.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <select value={el.format} onChange={e => Update(e, 'format')}>
                {formats(el.type).map(item => <option key={item.title} value={item.title}>{item.title}</option>)}
            </select>
            <input value={el.copies} onChange={e => Update(e, 'copies')} />
            <select value={el.paper} onChange={e => Update(e, 'paper')}>
                <option value="lustre">люстр</option>
                <option value="glossy">глянец</option>
            </select>
            <button type="button" onClick={() => DeleteFormat(index)}>удалить</button>
        </div>
    )
}
