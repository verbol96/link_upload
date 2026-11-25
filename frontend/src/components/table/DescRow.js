import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { OneFormat } from './OneFormat';
import { deleteOrder, getSettings } from '../../http/dbApi';
import { useDispatch, useSelector } from 'react-redux';
import { deleteOrderId, updateOrderAction, updateSmsAdd, updateSmsError, updateSmsPay, updateSmsSend } from '../../store/orderReducer';
import _ from 'lodash';
import Fuse from 'fuse.js';
import SearchBar from './SearchBar';
import SearchBarMain from './SearchBarMain';
import { deleteFile } from '../../http/cloudApi';
import { sendSms } from '../../http/authApi';
import { $host } from '../../http';
import { Button } from '../../ui/button';
import MyModalComponent from './DescRow-infoEP';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { toast } from 'sonner';
import {
    queueOrderSave,
    queueOrderOperation
} from '../../http/orderSaveQueue';
import { sendOrderEP, getListOpsEP, getLabelEP } from '../../http/epApi';

const preparePhotos = (photos = []) => {
    return photos.map(item => {
        if (item.id) {
            return {
                ...item,
                clientId: item.clientId ?? null
            }
        }
        if (item.clientId) {
            return item
        }
        return {
            ...item,
            clientId: crypto.randomUUID()
        }
    })
}
const buildHistorySnapshot = value => ({
    FIO: value.FIO || '', phone: value.phone || '', typePost: value.typePost || '',
    city: value.city || '', adress: value.adress || '', oblast: value.oblast || '',
    raion: value.raion || '', postCode: value.postCode || '',
    photo: preparePhotos(_.cloneDeep(value.photos || value.photo || [])), other: value.other || '',
    price: value.price || '', price_deliver: value.price_deliver || '',
    firstClass: value.firstClass || false,
    phoneUser: value.user?.phone || value.phoneUser || '', notes: value.notes || '',
    codeOutside: value.codeOutside || '', origin: value.origin || '', date_sent: value.date_sent || ''
})
export const DescRow = forwardRef(({
    orders, order, setSelectedOrder,
    handleDetailsClick, isChanged, setIsChanged
}, ref) => {
  const dispatch = useDispatch()
  const users = useSelector(state=>state.order.users)
  const [price, setPrice] = useState(order.price || '');
  const [price_deliver, setPriceDeliver] = useState(order.price_deliver || '');
  const [typePost, setTypePost] = useState(order.typePost)
  const [FIO, setFIO] = useState(order.FIO || '')
  const [phone, setPhone] = useState(order.phone || '')
  const [city, setCity] = useState(order.city || '')
  const [adress, setAdress] = useState(order.adress || '')
  const [oblast, setOblast] = useState(order.oblast || '')
  const [raion, setRaion] = useState(order.raion || '')
  const [postCode, setPostCode] = useState(order.postCode || '')
  const [firstClass] = useState(order.firstClass || false)
  const [other, setOther] =useState(order.other || '')
  const [photo, setPhotoState] = useState(() =>
      preparePhotos(order.photos || [])
  )
  const setPhoto = useCallback((value) => {
      setPhotoState(previous => {
          const next = typeof value === 'function'
              ? value(previous)
              : value
          return preparePhotos(next)
      })
  }, [])
  const [phoneUser, setPhoneUser] = useState(order.user?.phone || order.phoneUser || '');
  const [notes, setNotes] = useState(order.notes || '')
  const [codeOutside, setCodeOutside] = useState(order.codeOutside || '')
  const [origin] = useState(order.origin || '');
  const [is_sms_add, setIs_sms_add] = useState(order.is_sms_add || false);
  const [is_sms_send, setIs_sms_send] = useState(order.is_sms_send || false);
  const [is_sms_error, setIs_sms_error] = useState(order.is_sms_error || false);
  const [is_sms_pay, setIs_sms_pay] = useState(order.is_sms_pay || false);
  const [date_sent, setDate_sent] = useState(order.date_sent || '')
  const [numRows, setNumRows] = useState(2);
  const [numRows1, setNumRows1] = useState(2);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Функция для открытия модального окна
  const openModal = () => {
    setIsModalOpen(true);
  };
  // Функция для закрытия модального окна
  const closeModal = () => {
    setIsModalOpen(false);
  };
  const defaultSale = useCallback(() => {
    const count = photo.reduce((sum, photo) => {
      return sum + Number(photo.amount*photo.copies);
    }, 0);
    if(count > 499) return 0.85;
    if(count > 199) return 0.9;
    return 1;
  }, [photo]);
  const [sale, setSale] = useState(defaultSale());
  useEffect(() => {
    setSale(defaultSale());
  }, [defaultSale]);
  useEffect(() => {
    const lineCount = other.split('\n').length;
    setNumRows(lineCount < 2 ? 2 : lineCount+1);
    const lineCount1 = notes.split('\n').length;
    setNumRows1(lineCount1 < 2 ? 2 : lineCount1+1);
  }, [other, notes]);
    const [saveStatus, setSaveStatus] = useState('saved')
    const [history, setHistory] = useState(() => [_.cloneDeep(buildHistorySnapshot(order))])
    const [historyIndex, setHistoryIndex] = useState(0)
    const historyRef = useRef({ entries: [_.cloneDeep(buildHistorySnapshot(order))], index: 0 })
    const navigatingRef = useRef(false)
    const navigationTargetRef = useRef(null)
    const previousDataRef = useRef(null)
  const saveTimer = useRef(null)
  const latestData = useRef(null)
  const lastSavedData = useRef(null)
  const lastQueuedData = useRef(null)
  const saveVersion = useRef(0)
  const saveProcessRef = useRef(null)
const mountedRef = useRef(true)
const savedPhotosRef = useRef(null)
const photoRef = useRef(photo)
  const data = useMemo(() => ({
    FIO, phone, typePost, city, adress, oblast, raion,
    postCode, photo, other, price, price_deliver,
    firstClass, phoneUser, notes, codeOutside,
    origin, date_sent
  }), [
    FIO, phone, typePost, city, adress, oblast, raion,
    postCode, photo, other, price, price_deliver,
    firstClass, phoneUser, notes, codeOutside,
    origin, date_sent
  ])
  const buildInitialData = (value) => ({
    FIO: value.FIO || '',
    phone: value.phone || '',
    typePost: value.typePost || '',
    city: value.city || '',
    adress: value.adress || '',
    oblast: value.oblast || '',
    raion: value.raion || '',
    postCode: value.postCode || '',
    photo: photo,
    other: value.other || '',
    price: value.price || '',
    price_deliver: value.price_deliver || '',
    firstClass: value.firstClass || false,
    phoneUser: value.user?.phone || value.phoneUser || '',
    notes: value.notes || '',
    codeOutside: value.codeOutside || '',
    origin: value.origin || '',
    date_sent: value.date_sent || ''
  })
  if (lastSavedData.current === null) {
    lastSavedData.current = buildInitialData(order)
  }
if (savedPhotosRef.current === null) {
    savedPhotosRef.current = _.cloneDeep(photo)
}
 // Публикуем только зафиксированное React-состояние.
// До первого эффекта ref содержит исходные данные заказа.
if (latestData.current === null) latestData.current = data
useLayoutEffect(() => {
    photoRef.current = photo
    latestData.current = data
    if (previousDataRef.current && !_.isEqual(previousDataRef.current, data)) {
        if (navigatingRef.current) {
            navigatingRef.current = false
        } else {
            const timeline = historyRef.current
            if (timeline.index < timeline.entries.length - 1) {
                const entries = timeline.entries.slice(0, timeline.index + 1)
                historyRef.current = { entries, index: timeline.index }
                setHistory(entries)
            }
        }
    }
    previousDataRef.current = _.cloneDeep(data)
}, [data, photo])
const saveNow = useCallback(() => {
    clearTimeout(saveTimer.current)
    // Если сохранение уже запущено,
    // возвращаем тот же Promise.
    if (saveProcessRef.current) {
        return saveProcessRef.current
    }
    const process = (async () => {
        while (true) {
            const current = _.cloneDeep(latestData.current)
            if (!current) return
            // Нет новых изменений — всё сохранено.
            if (_.isEqual(current, lastSavedData.current)) {
                if (mountedRef.current) {
                    setIsChanged(false)
                    setSaveStatus('saved')
                }
                navigationTargetRef.current = null
                return
            }
            const snapshot = _.cloneDeep(current)
            const version = ++saveVersion.current
            lastQueuedData.current = snapshot
            const photosChanged = !_.isEqual(
                snapshot.photo,
                savedPhotosRef.current
            )
            const requestData = _.cloneDeep(snapshot)
            if (!photosChanged) {
                delete requestData.photo
            }
            if (mountedRef.current) {
                setSaveStatus('saving')
            }
            try {
                const result = await queueOrderSave(order.id, requestData)
            const savedSnapshot = _.cloneDeep(snapshot)
            if (photosChanged) {
                if (!Array.isArray(result.photos)) {
                    throw new Error('Сервер не вернул сохранённые фотографии')
                }
                const serverPhotos = preparePhotos(_.cloneDeep(result.photos))
                savedPhotosRef.current = _.cloneDeep(serverPhotos)
                savedSnapshot.photo = _.cloneDeep(serverPhotos)
                // Проставляем серверные ID, не меняя параметры позиций.
                // Обновляем refs сразу: следующий проход цикла не должен
                // ждать, пока React выполнит setPhotoState.
                if (mountedRef.current) {
                    const applyIds = photos => preparePhotos(photos.map(item => {
                        const match = serverPhotos.find(saved =>
                            item.id
                                ? String(saved.id) === String(item.id)
                                : item.clientId && saved.clientId === item.clientId
                        )
                        if (!match) return item
                        return {
                            ...item,
                            id: match.id,
                            clientId: match.clientId ?? item.clientId ?? null
                        }
                    }))
                    const updatedPhotos = applyIds(photoRef.current)
                    if (!_.isEqual(photoRef.current, updatedPhotos)) {
                        photoRef.current = updatedPhotos
                        latestData.current = {
                            ...latestData.current,
                            photo: updatedPhotos
                        }
                        // Functional update preserves edits made while request was pending.
                        setPhotoState(previous => applyIds(previous))
                    }
                }
            }
            if (mountedRef.current && !_.isEqual(navigationTargetRef.current, savedSnapshot)) {
                const timeline = historyRef.current
                const entries = timeline.entries.slice(0, timeline.index + 1)
                if (!_.isEqual(entries[entries.length - 1], savedSnapshot)) {
                    entries.push(_.cloneDeep(savedSnapshot))
                    const limited = entries.slice(-31)
                    historyRef.current = { entries: limited, index: limited.length - 1 }
                    setHistory(limited)
                    setHistoryIndex(limited.length - 1)
                }
            }
            lastSavedData.current = savedSnapshot
            navigationTargetRef.current = null
                const savedUser = users.find(
                    user => user.id === result.userId
                )
                const {
                    photo: ignoredPhoto,
                    ...savedFields
                } = snapshot
                const photosForRedux = photosChanged
                    ? savedSnapshot.photo
                    : savedPhotosRef.current
                dispatch(updateOrderAction(order.id, {
                    ...savedFields,
                    photos: _.cloneDeep(photosForRedux),
                    phone: snapshot.phone.replace(/[^0-9+]/g, ''),
                    userId: result.userId,
                    ...(savedUser ? { user: savedUser } : {})
                }))
                if (
                    mountedRef.current &&
                    version === saveVersion.current
                ) {
                  const stillChanged = !_.isEqual(
                      latestData.current,
                      savedSnapshot
                  )
                    setIsChanged(stillChanged)
                    setSaveStatus(
                        stillChanged ? 'pending' : 'saved'
                    )
                }
            } catch (error) {
                console.error('Ошибка автосохранения:', error)
                lastQueuedData.current = null
                if (mountedRef.current) {
                    setSaveStatus('error')
                    setIsChanged(true)
                }
                throw error
            }
            // Если за время запроса появились изменения,
            // цикл отправит новую версию.
        }
    })()
    saveProcessRef.current = process
    // Освобождаем ссылку после завершения.
    process.then(
        () => {
            if (saveProcessRef.current === process) {
                saveProcessRef.current = null
            }
        },
        () => {
            if (saveProcessRef.current === process) {
                saveProcessRef.current = null
            }
        }
    )
    return process
}, [order.id, dispatch, users, setIsChanged])
  useImperativeHandle(ref, () => ({
    saveNow
}), [saveNow])
useEffect(() => {
    const changed = !_.isEqual(
        data,
        lastSavedData.current
    )
    setIsChanged(changed)
    if (!changed) {
        clearTimeout(saveTimer.current)
        if (!saveProcessRef.current) setSaveStatus('saved')
        return
    }
    setSaveStatus('pending')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
        saveNow().catch(error => {
            console.error('Ошибка автосохранения:', error)
        })
    }, 1000)
    return () => {
        clearTimeout(saveTimer.current)
    }
}, [data, saveNow, setIsChanged])
useEffect(() => {
    mountedRef.current = true
    return () => {
        mountedRef.current = false
        clearTimeout(saveTimer.current)
    }
}, [])
const navigateHistory = direction => {
    if (saveStatus === 'saving' || saveProcessRef.current) return
    const timeline = historyRef.current
    const nextIndex = timeline.index + direction
    if (nextIndex < 0 || nextIndex >= timeline.entries.length) return
    const previous = _.cloneDeep(timeline.entries[nextIndex])
    navigatingRef.current = true
    navigationTargetRef.current = _.cloneDeep(previous)
    historyRef.current = { ...timeline, index: nextIndex }
    setHistoryIndex(nextIndex)
    clearTimeout(saveTimer.current)
    setFIO(previous.FIO)
    setPhone(previous.phone)
    setTypePost(previous.typePost)
    setCity(previous.city)
    setAdress(previous.adress)
    setOblast(previous.oblast)
    setRaion(previous.raion)
    setPostCode(previous.postCode)
    setPhoto(previous.photo)
    setOther(previous.other)
    setPrice(previous.price)
    setPriceDeliver(previous.price_deliver)
    setPhoneUser(previous.phoneUser)
    setNotes(previous.notes)
    setCodeOutside(previous.codeOutside)
    setDate_sent(previous.date_sent)
    setSaveStatus(_.isEqual(previous, lastSavedData.current) ? 'saved' : 'pending')
}
const SaveData = async () => {
    try {
        await saveNow()
        toast.success('Изменения сохранены')
    } catch (error) {
        console.error('Ошибка сохранения заказа:', error)
        toast.error('Не удалось сохранить заказ', {
            description: 'Изменения остались в форме. Попробуйте ещё раз.'
        })
    }
}
  const DeleteOrder = async() => {
    const userConfirmation = window.confirm("Вы уверены, что хотите удалить этот заказ?");
    if (userConfirmation) {
      await deleteOrder(order.id);
      dispatch(deleteOrderId(order.id));
      if(order.origin === 'website'){
        const userConfirmation1 = window.confirm("Удалить файлы заказа с сервера?");
        if (userConfirmation1) {
          await deleteFile(order.main_dir_id)
        }
      }
    }
  };
  const SmsError = async() =>{
    const userConfirmation = window.confirm(`Отправить смс: "Ошибка в заказе. Подробнее в личном кабинете: www.link1.by"`);
    if (userConfirmation) {
      const code = `Ошибка в заказе. Подробнее в личном кабинете: www.link1.by`
      await sendSms(phone, code)
      setPrice(0)
      setIs_sms_error(true)
      dispatch(updateSmsError(order.id))
      await queueOrderSave(order.id, { is_sms_error: true })
    }
  }
  const SmsAdd = async() =>{
    const userConfirmation = window.confirm(`Отправить смс: "Заказ принят. Проверить статус можно в личном кабинете www.link1.by"`);
    if (userConfirmation) {
      const code = `Заказ принят. Проверить статус можно в личном кабинете www.link1.by`
      await sendSms(phone, code)
      setIs_sms_add(true)
      dispatch(updateSmsAdd(order.id))
      await queueOrderSave(order.id, { is_sms_add: true })
    }
  }
  const SmsSend = async() =>{
    const userConfirmation = window.confirm(`Отправить смс: "Заказ отправлен. Код посылки: ${codeOutside}. Подробнее: www.link1.by"`);
    if (userConfirmation) {
      const code = `Заказ отправлен. Код посылки: ${codeOutside}. Подробнее: www.link1.by`
      await sendSms(phone, code)
      setIs_sms_send(true)
      dispatch(updateSmsSend(order.id))
      await queueOrderSave(order.id, { is_sms_send: true })
    }
  }
  const SmsPay = async () => {
    try {
      // Проверка наличия необходимых данных
      if (!order || typeof order !== 'object') {
        throw new Error('Неверный формат данных заказа');
      }
      // Проверка и преобразование цен
      const price = Number(order.price) || 0;
      const priceDeliver = Number(order.price_deliver) || 0;
      // Проверка номера заказа
      if (!order.order_number) {
        throw new Error('Отсутствует номер заказа');
      }
      // Проверка номера телефона
      if (!phone || typeof phone !== 'string') {
        throw new Error('Неверный формат номера телефона');
      }
      // Вычисление суммы с округлением
      const total = (price + priceDeliver).toFixed(2);
      // Формирование сообщения
      const code = `Оплата заказа.

  ЕРИП -> E-POS.

  Номер счета: 27307-1-${order.order_number}.

  Сумма: ${total}р`;
      // Подтверждение отправки
      const userConfirmation = window.confirm(`Отправить SMS:\n\n${code}`);
      if (userConfirmation) {
        // Отправка SMS
        await sendSms(phone, code);
        // Обновление состояния
        setIs_sms_pay(true);
        // Обновление данных в хранилище
        dispatch(updateSmsPay(order.id));
        // Обновление заказа
        await queueOrderSave(order.id, { is_sms_pay: true });
        // Уведомление об успехе
        alert('SMS успешно отправлено');
      }
    } catch (error) {
      console.error('Ошибка при отправке SMS:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };
  const AddFormat = () =>{
    const data = {
        type: "photo",
        format: "а6",
        amount: "1",
        copies: 1,
        paper: 'glossy'
    }
    setPhoto(previous => [...previous, data])
  }
  const DeleteFormat = (index) =>{
    setPhoto(previous => previous.filter((_, i) => i !== index))
  }
  const [settings, setSettings] = useState([])
    useEffect(()=>{
        async function getPriceList (){
            let value = await getSettings()
            setSettings(value)
        }
        getPriceList()
    }, [])
  const PriceList = (format) =>{
    let price = 0
    settings.forEach(el=>{
        if(el.title === format) {
            price = el.price
        }
    })
    return price
  }
  const SumTeor =()=> {
    const pr = photo.reduce((sum, el)=>{
      return sum+PriceList(el.format)*el.amount*el.copies
  },0 )
  return pr.toFixed(2)
  }
  const showFIO = () =>{
    const pretend = users.find(user => user.phone === phoneUser)
    if(pretend){
      return pretend.FIO
    }else return ''
  }
  const isUser = () =>{
    const pretend = users.find(user => user.phone === phoneUser)
    if(pretend){
        return pretend.role  === 'USER'
    }else return false
  }
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisibleMain, setModalVisibleMain] = useState(false);
  const handleModalMouseEnter = () => {
    setModalVisible(true);
  };
  const handleModalMouseLeave = () => {
    setModalVisible(false);
  };
  const handleModalMouseEnterMain = () => {
    setModalVisibleMain(true);
  };
  const handleModalMouseLeaveMain = () => {
    setModalVisibleMain(false);
  };
  const [listOps, setListObs] = useState([]);
  const [opsLoading, setOpsLoading] = useState(false);
  const needsOPS = ['E', 'E1'].includes(typePost) && !codeOutside?.trim();
  useEffect(() => {
      if (!needsOPS) return;
      let active = true;
      setOpsLoading(true);
      getListOpsEP().then(items => {
          if (active) setListObs(items);
      }).catch(error => {
          if (active) console.error('Ошибка загрузки отделений:', error);
      }).finally(() => { if (active) setOpsLoading(false); });
      return () => { active = false; };
  }, [needsOPS]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef  = useRef(null)
  const [inputOPS, setInputOPS] = useState('')
  const [manualOPS, setManualOPS] = useState(null);
  const normalizeOPS = value => String(value ?? '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^а-яa-z0-9]+/gi, ' ')
      .split(/\s+/)
      .filter(word => word && !['г', 'город', 'ул', 'улица', 'пр', 'кт', 'проспект', 'д', 'дом', 'отделение', 'опс'].includes(word))
      .join(' ');

  const opsIndex = useMemo(() => listOps.map(item => ({
      item,
      city: normalizeOPS(item.city),
      street: normalizeOPS(item.street),
      address: normalizeOPS(`${item.street ?? ''} ${item.house ?? ''}`),
      name: normalizeOPS(item.ops_name),
      number: String(item.ops_number ?? '')
  })), [listOps]);

  const addressKey = JSON.stringify([order.id, city, adress]);
  const suggestedOPS = useMemo(() => {
      if (!needsOPS || !opsIndex.length) return null;
      const cityQuery = normalizeOPS(city);
      let query = normalizeOPS(adress);
      if (!query) return null;
      let candidates = opsIndex;
      if (cityQuery) {
          candidates = opsIndex.filter(el => el.city === cityQuery);
          if (!candidates.length) {
              const cities = [...new Set(opsIndex.map(el => el.city).filter(Boolean))];
              const match = new Fuse(cities, { threshold: 0.4, ignoreLocation: true }).search(cityQuery)[0];
              if (!match) return null;
              candidates = opsIndex.filter(el => el.city === match.item);
          }
          query = query.replace(cityQuery, '').trim();
      }
      if (!query) return null;
      const explicitNumber = String(adress).match(/(?:№|отделение|опс)\s*(\d+)/i)?.[1];
      const branchNumber = explicitNumber || (/^\d+$/.test(query) ? query : null);
      if (branchNumber) return candidates.find(el => el.number === branchNumber)?.item ?? null;
      const words = query.split(' ');
      const streetWords = words.filter(word => !/^\d/.test(word));
      const house = words.find(word => /^\d+[а-яa-z]?$/.test(word));
      if (!streetWords.length) return null;
      const streetQuery = streetWords.join(' ');
      const fuse = new Fuse(candidates, {
          keys: ['street', 'address', 'name'],
          threshold: 0.5,
          ignoreLocation: true,
          includeScore: true
      });
      const results = fuse.search(streetQuery);
      if (!results.length) return null;
      const matchingHouse = house && results.find(el => normalizeOPS(el.item.item.house) === house);
      return (matchingHouse || results[0]).item.item;
  }, [opsIndex, city, adress, needsOPS]);

  const nameOPS = manualOPS?.key === addressKey ? manualOPS.item : suggestedOPS;
  useEffect(()=>{
        if (isOpen) {
            // Если dropdown открыт, устанавливаем фокус на input
            inputRef.current?.focus();
          }
    }, [isOpen])
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const filterOPS = useMemo(() => {
      if (!isOpen) return [];
      const search = normalizeOPS(inputOPS);
      const words = search.split(' ').filter(Boolean);
      const matches = opsIndex.filter(el => words.every(word =>
          `${el.city} ${el.address} ${el.name} ${el.number}`.includes(word)
      ));
      const selected = matches.find(el => el.item.id === nameOPS?.id);
      const rest = matches.filter(el => el.item.id !== nameOPS?.id);
      return [...(selected ? [selected] : []), ...rest].map(el => el.item);
  }, [isOpen, inputOPS, opsIndex, nameOPS]);
  const putNameOPS =(name)=>{
    setManualOPS({ key: addressKey, item: name })
    setIsOpen(false)
    setInputOPS('')
  }
  const phoneWithoutPlus = () =>{
      const newPhone = phone.replace('+', '');
      return newPhone
  }
  const nameSplit = (i) =>{
      const splitResalt = FIO.split(' ')
      return splitResalt[i]
  }
  const sendOrderEp = async () => {
      if (!nameOPS?.id) {
          toast.error('Выберите отделение Европочты');
          return;
      }
      const dataSend = {
          sum: price,
          OPS: nameOPS.id,
          phone: phoneWithoutPlus(),
          name1: nameSplit(0),
          name2: nameSplit(1)
      };

      const sendConfirmation = window.confirm(
          `Сумма: ${dataSend.sum} руб.\n` +
          `Отделение: ${nameOPS.ops_name}\n` +
          `Телефон: ${dataSend.phone}\n` +
          `Получатель: ${dataSend.name1} ${dataSend.name2}`
      );

      if (!sendConfirmation) return;

      try {
          const data = await sendOrderEP(dataSend);
          setCodeOutside(data.number);
      } catch (error) {
          console.error('Ошибка создания отправления:', error);
      }
  };  
  const [printingEP, setPrintingEP] = useState(false);
  const printLabelEP = async () => {
    if (!codeOutside?.trim() || printingEP) return;
    setPrintingEP(true);
    try {
      const pdf = await getLabelEP(codeOutside.trim());
      const url = URL.createObjectURL(pdf);
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;width:0;height:0;border:0';
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } catch {
            window.open(url, '_blank');
          }
        }, 500);
      };
      iframe.src = url;
      document.body.appendChild(iframe);
      setTimeout(() => {
        iframe.remove();
        URL.revokeObjectURL(url);
      }, 300000);
    } catch (error) {
      toast.error('Не удалось получить ярлык');
    } finally {
      setPrintingEP(false);
    }
  };
  const checkOrderEp = async() =>{
    if(!codeOutside) {
      window.alert('нету штрихкода')
      return;
    }
    openModal()
  }
  const handlePrint = () =>{
    const printContent = `

        <div style=" margin-top:180px; font-size: 32px; transform: rotate(90deg); ">

            <div style="display: flex; flex-direction: row; border-bottom: 1px solid black; height: 74px">

                <div style="flex: 1;font-size: 25px; margin: auto">кому: </div>

                <div style="flex: 6; text-align: center; margin: auto;  font-family: 'Roboto Mono', monospace;">${order.FIO}</div>

            </div>



            <div style="display: flex; flex-direction: row; border-bottom: 1px solid black; height: 74px"> </div>



            <div style="display: flex; flex-direction: row; border-bottom: 1px solid black; height: 74px">

                <div style="flex: 1;font-size: 25px; margin: auto">куда: </div>

                <div style="flex: 6; text-align: center; margin: auto;  font-family: 'Roboto Mono', monospace;">${order.adress}</div>

            </div>



            <div style="display: flex; flex-direction: row; border-bottom: 1px solid black; height: 74px">

                <div style="flex: 1; border-left: 1px solid black;border-right: 1px solid black; font-size: 40px ; text-align: center; padding-top: 10px; font-family: 'Roboto Mono', monospace; ">${order.postCode} </div>

                <div style="flex: 3; text-align: center;  margin: auto;  font-family: 'Roboto Mono', monospace;">${order.city}</div>

            </div>



            <div style="display: flex; flex-direction: row; border-bottom: 1px solid black; height: 74px">

                <div style=" margin: auto;  font-family: 'Roboto Mono', monospace;">${order.raion}</div>

            </div>



            <div style="display: flex; flex-direction: row; ; border-bottom: 1px solid black; height: 74px">

                <div style="flex: 1; text-align: center; margin: auto;   font-family: 'Roboto Mono', monospace;">${order.oblast}</div>

            </div>



            <div style="display: flex; flex-direction: row;  height: 74px">

                <div style="flex: 1;font-size: 25px; margin: auto">телефон: </div>

                <div style="flex: 1; text-align: center; margin: auto;  font-family: 'Roboto Mono', monospace;;">${order.phone}</div>

            </div>

        </div>`;
    const printWindow = window.open('', '', 'height=800px,width=600px');
    printWindow.document.write(printContent);
    printWindow.onafterprint = function() {
        printWindow.close();
    };
    printWindow.print();
}
const ShowBtnSms = (smsType, fanc, text) => {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={smsType}
      onClick={smsType ? undefined : fanc}
      className={`min-w-0 flex-1 basis-0 gap-1 px-1.5 text-[11px] sm:px-2 sm:text-xs
        ${smsType
          ? 'border-slate-300 bg-slate-100 text-slate-500 opacity-100'
          : 'border-[#274C77] bg-[#274C77] text-white hover:border-[#1E3A5D] hover:bg-[#1E3A5D] hover:text-white'}`}
      title={text}
    >
      <i className={`shrink-0 bi ${smsType ? 'bi-check-all' : 'bi-telephone-forward'}`} />
      <span className="min-w-0 truncate">{text}</span>
    </Button>
  );
};
const AddInvoices = async () => {
    const price = Number(order.price) || 0;
    const priceDeliver = Number(order.price_deliver) || 0;
    const totalAmount = (price + priceDeliver).toFixed(2);
    const sendConfirmation = window.confirm(
        `Подтвердите:\n` +
        `Номер заказа: ${order.order_number}\n` +
        `Цена: ${totalAmount}р\n` +
        `Info: Заказ ${order.FIO}`
    );
    if (sendConfirmation) {
        const dataInvoices = {
            AccountNo: order.order_number,
            Amount: totalAmount,
            Info: `Заказ ${order.FIO}`,
        };
        try {
            const { data } = await $host.post('api/ep/addInvoicesPay', dataInvoices);
            if (data) {
                // Обновляем Redux — синхронизируем с бэком
                dispatch(updateOrderAction(order.id, {
                    ...order,
                    isPayment: 'wait',
                }));
                toast.success('Счёт выставлен');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            toast.error('Не удалось создать счёт', {
                description: 'Попробуйте ещё раз',
            });
        }
    }
};
const CancelInvoices = async () => {
    const info = window.confirm('Отменить счёт?');
    if (info) {
        try {
            const dataAPI = {
                InvoiceNo: order.order_number,
            };
            const { data } = await $host.post('api/ep/delInvoicesPay', dataAPI);
            if (data) {
                // Обновляем Redux — синхронизируем с бэком
                dispatch(updateOrderAction(order.id, {
                    ...order,
                    isPayment: 'none',
                }));
                toast.success('Счёт отменён');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            toast.error('Не удалось отменить счёт');
        }
    }
};
const CheckInvoices = async () => {
    try {
        const { data } = await $host.post('api/ep/getInvoicesPay', {
            No: order.order_number,
        });
        const descStatus = {
            '1': 'Ожидает оплату',
            '2': 'Просрочен',
            '3': 'Оплачен',
            '4': 'Оплачен частично',
            '5': 'Отменён',
            '6': 'Оплачен банковской картой',
            '7': 'Платёж возвращён',
        };
        const status = String(data.Status);
        const statusText = descStatus[status] || 'Неизвестный статус';
        // ===== Оплачен =====
        if (status === '3' || status === '6') {
            if (order.isPayment === 'paid') {
                toast.info(`Статус: ${statusText}`);
                return;
            }
await queueOrderSave(order.id, {
    isPayment: 'paid'
});
dispatch(updateOrderAction(order.id, {
    isPayment: 'paid'
}));
            toast.success('Заказ оплачен', { description: statusText });
            return;
        }
        // ===== Другие статусы =====
        toast.info(`Статус: ${statusText}`);
    } catch (error) {
        console.error('Ошибка:', error);
        toast.error('Счёт не найден', {
            description: 'Проверьте номер заказа',
        });
    }
};
const [isOpen1, setIsOpen1] = useState(false)
const [ordersModal, setOrdersModal] = useState([])
const openModalOrders = async() =>{
  const {data} = await $host.get(`api/order/ordersUser/${order.userId}`)
  setOrdersModal(data)
  setIsOpen1(true)
}
const photoLine = (data) =>{
      return data.reduce((sum, el)=>{
        if(el.paper==='lustre'){
            return sum+el.amount*el.copies+"шт("+el.format+")ЛЮСТР "
        }else{
            return sum+el.amount*el.copies+"шт("+el.format+") "
        }
    }, '')
}
const regions = [
  'Брестская область', 'Витебская область', 'Гомельская область',
  'Гродненская область', 'Минская область', 'Могилёвская область'
];
const [aboutUser, setAboutUser] = useState(order.user.aboutUser || '');
const [smsText, setSmsText] = useState('');
const saveAboutUser = async () => {
  try {
    await $host.put(`api/order/changeAboutUser/${order.userId}`, { aboutUser });
    alert('Сохранено');
  } catch (error) {
    console.error(error);
    alert('Ошибка сохранения');
  }
};
const sendSmsNew = async () => {
  if (!smsText.trim()) {
    alert('Введите текст SMS');
    return;
  }
  try {
    const userConfirmation = window.confirm(`Отправить смс?`);
    if (userConfirmation) {
      await sendSms(order.user.phone, smsText)
      alert('смс успешно отправлено');
    }
    setSmsText('');
  } catch (error) {
    console.error(error);
    alert('Ошибка отправки');
  }
};
    const duplicateOrders = useMemo(() => {
        const ACTIVE_STATUSES = [0, 1, 2, 3, 4, 7, 8];
        const pretend = orders.filter(el => ACTIVE_STATUSES.includes(el.status));
        const samePhone = pretend.filter(el => el.phone === order.phone);
        return samePhone
            .filter(el => el.id !== order.id)
            .map(el => ({
                id: el.id,
                order_number: el.order_number,
            }));
    }, [orders, order.phone, order.id]);
    const toJoinOrder = async (duplicateId) => {
        const second = orders.find(item => item.id === duplicateId);
        if (!second) return;
        const confirmed = window.confirm(
            `Объединить заказ №${order.order_number} с заказом №${second.order_number}?\n\n` +
            `Фото, заметки и примечания из заказа №${second.order_number} перейдут в текущий.\n` +
            `Заказ №${second.order_number} будет удалён.\n\nПродолжить?`
        );
        if (!confirmed) return;
        try {
            // Сначала фиксируем изменения текущего заказа, чтобы объединение их не перезаписало.
            await saveNow();
            const current = latestData.current || {};
            const appendText = (first, incoming) => {
                const existing = String(first ?? '').trim();
                const addition = String(incoming ?? '').trim();
                if (!addition) return existing;
                return [existing, `(№${second.order_number}) ${addition}`].filter(Boolean).join('\n');
            };
            const mergedOther = appendText(current.other, second.other);
            const mergedNotes = appendText(current.notes, second.notes);
            const mergedPrice = (Number(current.price || 0) + Number(second.price || 0)).toFixed(2);
            const payload = {
                id: order.id,
                idJoin: duplicateId,
                other: mergedOther,
                notes: mergedNotes,
                price: mergedPrice
            };
            const response = await queueOrderOperation(
                order.id,
                () => queueOrderOperation(duplicateId, () => $host.put('api/order/toJoinOrder', payload))
            );
            const updatedOrder = response.data;
            // Явно сохраняем оба текстовых поля: endpoint объединения может их игнорировать.
            await queueOrderSave(order.id, { other: mergedOther, notes: mergedNotes });
            const finalOther = mergedOther;
            const finalNotes = mergedNotes;
            const finalPrice = updatedOrder.price ?? mergedPrice;
            const mergedPhotos = preparePhotos(updatedOrder.photos || updatedOrder.photo || []);
            setOther(finalOther);
            setNotes(finalNotes);
            setPrice(finalPrice);
            setPhoto(mergedPhotos);
            photoRef.current = mergedPhotos;
            latestData.current = {
                ...latestData.current,
                other: finalOther,
                notes: finalNotes,
                price: finalPrice,
                photo: mergedPhotos
            };
            savedPhotosRef.current = _.cloneDeep(mergedPhotos);
            lastSavedData.current = _.cloneDeep(latestData.current);
            dispatch(updateOrderAction(order.id, {
                other: finalOther,
                notes: finalNotes,
                price: finalPrice,
                photos: _.cloneDeep(mergedPhotos)
            }));
            dispatch(deleteOrderId(duplicateId));
            setIsChanged(false);
            setSaveStatus('saved');
            toast.success('Заказы объединены', {
                description: `Заказ №${second.order_number} → №${order.order_number}`,
                duration: 4000
            });
        } catch (err) {
            console.error('Ошибка объединения:', err);
            toast.error('Не удалось объединить заказы', {
                description: err.response?.data?.error || 'Попробуйте ещё раз'
            });
        }
    };
  return (
    <>
    <Dialog open={isOpen1} onOpenChange={setIsOpen1}>
      <DialogContent
       onOpenAutoFocus={(e) => e.preventDefault()}
        aria-describedby={undefined}
        className="max-w-[80vw] max-h-[90vh] w-[80vw] h-[90vh] p-3"
        style={{ maxWidth: '90vw', maxHeight: '90vh' }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base">
            Все заказы от{' '}
            <span className="text-[#274C77] font-bold text-xl">
              {order.user.FIO} {' '}
            </span>
            ({order.user.phone})
          </DialogTitle>
         <DialogDescription className='h-full overflow-hidden' asChild>
          <div>
              <div className='flex h-[calc(100%-50px)] flex-col justify-between gap-10'>
                <div className="flex-[3] max-h-[400px] overflow-auto mt-4 ">
                                <table className="w-full text-sm">
                                  <thead className="sticky top-0 bg-gray-50">
                                    <tr className="border-b">
                                      <th className="text-left py-2">Дата</th>
                                      <th className="text-left py-2">ФИО</th>
                                      <th className="text-left py-2">Город</th>
                                      <th className="text-left py-2">Адрес</th>
                                      <th className="text-left py-2">Тип</th>
                                      <th className="text-left py-2">Заказ</th>
                                      <th className="text-left py-2">Сумма</th>
                                      <th className="text-left py-2">Источник</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ordersModal.map((el) => (
                                      <tr key={el.order_number} className="border-b hover:bg-gray-50">
                                        <td className="py-2">
                                          {new Date(el.createdAt).toLocaleDateString('ru-RU')}
                                        </td>
                                        <td className="py-2 px-2">
                                          <div className="truncate block max-w-[200px]" title={el.FIO}>
                                            {el.FIO}
                                          </div>
                                        </td>
                                        <td className="py-2">{el.city}</td>
                                        <td className="py-2 px-2">
                                          <div className="truncate block max-w-[200px]" title={el.adress}>
                                            {el.adress}
                                          </div>
                                        </td>
                                        <td className="py-2">{el.typePost}</td>
                                        <td className="py-2 px-2">
                                          <div className="truncate block max-w-[200px]" title={photoLine(el.photos)}>
                                            {photoLine(el.photos)}
                                          </div>
                                        </td>
                                        <td className="py-2">{el.price}</td>
                                        <td className="py-2 pl-2">{el.origin}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                </div>
                <div className='flex-[2] flex flex-row justify-between gap-10 '>
                  {/* Поле "О клиенте" */}
                  <div className="flex-1 flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">О клиенте</label>
                    <textarea
                      value={aboutUser}
                      onChange={(e) => setAboutUser(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                      rows={3}
                      placeholder="Дополнительная информация о клиенте..."
                    />
                    <div className="flex justify-center">
                      <button
                        onClick={saveAboutUser}
                        className={`px-4 py-2 ${order.user.aboutUser === aboutUser ? 'bg-slate-400' : 'bg-[#274C77] hover:bg-[#1E3A5D]'} text-white rounded-lg text-sm transition`}
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                  {/* Поле для SMS */}
                  <div className="flex-1 flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Текст SMS</label>
                    <textarea
                      value={smsText}
                      onChange={(e) => setSmsText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                      rows={2}
                      placeholder="Введите текст SMS..."
                    />
                    <div className="flex justify-center">
                      <button
                        onClick={sendSmsNew}
                        className="px-4 py-2 bg-[#274C77] hover:bg-[#1E3A5D] text-white rounded-lg text-sm transition"
                      >
                        Отправить SMS
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Нижняя часть — фиксирована */}
              <div className='h-[50px] mt-4 flex flex-row justify-end gap-3 text-[#274C77] '>
                <label>Всего заказов: {order.user.orderCount} шт</label>
                <label>Сумма заказов: {order.user.totalOrderSum} р</label>
              </div>
           </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
    
    <div className="bg-white flex justify-between px-[10px] py-[10px]">
      {isModalOpen && <MyModalComponent isOpen={isModalOpen} closeModal={closeModal} codeOutside={codeOutside} />}
      <div className="flex gap-[10px] w-full">
        <div className="bg-white border border-slate-200 rounded-[5px] p-[20px] flex flex-col flex-1 min-w-0 [&>div:first-child]:mb-[25px]">
          <div>
            <div className='flex justify-between [&>label]:flex-1 [&>label]:my-[3px] [&>label]:font-medium [&>label]:font-[Montserrat,sans-serif] [&>input]:flex-[2] [&>input]:my-[3px] [&>input]:rounded-[3px] [&>input]:border [&>input]:border-slate-300 [&>input]:px-[5px] [&>input]:py-[2px] [&>input]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>input[type=checkbox]]:h-[20px] [&>select]:flex-1 [&>select]:appearance-none [&>select]:bg-white [&>select]:border-[1.7px] [&>select]:border-slate-300 [&>select]:rounded-[3px] [&>select]:px-[5px] [&>select]:py-[2px] [&>select]:mt-[20px] [&>select]:mb-[3px] [&>select]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>select:focus]:outline-none [&>select:focus]:shadow-none'>
              <label>ФИО:</label>
              <input  style={{marginLeft: 5}} value={FIO} onChange={(e) => setFIO(e.target.value)} />
            </div>
            <div className='flex justify-between [&>label]:flex-1 [&>label]:my-[3px] [&>label]:font-medium [&>label]:font-[Montserrat,sans-serif] [&>input]:flex-[2] [&>input]:my-[3px] [&>input]:rounded-[3px] [&>input]:border [&>input]:border-slate-300 [&>input]:px-[5px] [&>input]:py-[2px] [&>input]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>input[type=checkbox]]:h-[20px] [&>select]:flex-1 [&>select]:appearance-none [&>select]:bg-white [&>select]:border-[1.7px] [&>select]:border-slate-300 [&>select]:rounded-[3px] [&>select]:px-[5px] [&>select]:py-[2px] [&>select]:mt-[20px] [&>select]:mb-[3px] [&>select]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>select:focus]:outline-none [&>select:focus]:shadow-none'>
              <label>Телефон:</label>
              <div className='flex-[2] relative flex flex-col items-stretch [&>input]:outline-none [&>input]:border [&>input]:border-slate-300 [&>input]:my-[3px] [&>input]:rounded-[3px] [&>input]:px-[5px] [&>input]:py-[2px] [&>input]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>input:hover]:rounded-t-[3px] [&>input:hover]:rounded-b-none [&>input:hover]:border-x-[1.5px] [&>input:hover]:border-t-[1.5px] [&>input:hover]:border-b-0'
                onMouseEnter={handleModalMouseEnterMain}
                onMouseLeave={handleModalMouseLeaveMain}
              >
                <input
                  style={{}}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <SearchBarMain phone={phone} modalVisibleMain={modalVisibleMain} setModalVisibleMain={setModalVisibleMain} users={users}
                          setFIO={setFIO} setTypePost={setTypePost} setCity={setCity} setPhone={setPhone}
                          setAdress={setAdress} setPostCode={setPostCode} setRaion={setRaion} setOblast={setOblast} />
              </div>
            </div>
            <div className='flex justify-between [&>label]:flex-1 [&>label]:my-[3px] [&>label]:font-medium [&>label]:font-[Montserrat,sans-serif] [&>input]:flex-[2] [&>input]:my-[3px] [&>input]:rounded-[3px] [&>input]:border [&>input]:border-slate-300 [&>input]:px-[5px] [&>input]:py-[2px] [&>input]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>input[type=checkbox]]:h-[20px] [&>select]:flex-1 [&>select]:appearance-none [&>select]:bg-white [&>select]:border-[1.7px] [&>select]:border-slate-300 [&>select]:rounded-[3px] [&>select]:px-[5px] [&>select]:py-[2px] [&>select]:mt-[20px] [&>select]:mb-[3px] [&>select]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>select:focus]:outline-none [&>select:focus]:shadow-none'>
              <select value={typePost} onChange={(e)=>setTypePost(e.target.value)}>
                  <option value={"E"}>Европочта(наложенный)</option>
                  <option value={"E1"}>Европочта(ЕРИП)</option>
                  <option value={"R"}>Белпочта(наложенный)</option>
                  <option value={"R2"}>Белпочта(ЕРИП)</option>
                  <option value={"R1"}>Письмо(ЕРИП)</option>
              </select>
              <label></label>
            </div>
            <div className='flex justify-between [&>label]:flex-1 [&>label]:my-[3px] [&>label]:font-medium [&>label]:font-[Montserrat,sans-serif] [&>input]:flex-[2] [&>input]:my-[3px] [&>input]:rounded-[3px] [&>input]:border [&>input]:border-slate-300 [&>input]:px-[5px] [&>input]:py-[2px] [&>input]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>input[type=checkbox]]:h-[20px] [&>select]:flex-1 [&>select]:appearance-none [&>select]:bg-white [&>select]:border-[1.7px] [&>select]:border-slate-300 [&>select]:rounded-[3px] [&>select]:px-[5px] [&>select]:py-[2px] [&>select]:mt-[20px] [&>select]:mb-[3px] [&>select]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>select:focus]:outline-none [&>select:focus]:shadow-none'>
              <label>Город:</label>
              <input value={city} onChange={(e)=>setCity(e.target.value)} />
            </div>
            <div className='flex justify-between [&>label]:flex-1 [&>label]:my-[3px] [&>label]:font-medium [&>label]:font-[Montserrat,sans-serif] [&>input]:flex-[2] [&>input]:my-[3px] [&>input]:rounded-[3px] [&>input]:border [&>input]:border-slate-300 [&>input]:px-[5px] [&>input]:py-[2px] [&>input]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>input[type=checkbox]]:h-[20px] [&>select]:flex-1 [&>select]:appearance-none [&>select]:bg-white [&>select]:border-[1.7px] [&>select]:border-slate-300 [&>select]:rounded-[3px] [&>select]:px-[5px] [&>select]:py-[2px] [&>select]:mt-[20px] [&>select]:mb-[3px] [&>select]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>select:focus]:outline-none [&>select:focus]:shadow-none'>
              <label>
                {typePost === 'R' || typePost === 'R1' || typePost === 'R2' ? 'Адрес:' : 'Отделение:'}
              </label>
              <input value={adress} onChange={(e)=>setAdress(e.target.value)} />
            </div>

                        {typePost === 'R' || typePost === 'R1' || typePost === 'R2'?
            <>
            <div className='flex justify-between [&>label]:flex-1 [&>label]:my-[3px] [&>label]:font-medium [&>label]:font-[Montserrat,sans-serif] [&>input]:flex-[2] [&>input]:my-[3px] [&>input]:rounded-[3px] [&>input]:border [&>input]:border-slate-300 [&>input]:px-[5px] [&>input]:py-[2px] [&>input]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>input[type=checkbox]]:h-[20px] [&>select]:flex-1 [&>select]:appearance-none [&>select]:bg-white [&>select]:border-[1.7px] [&>select]:border-slate-300 [&>select]:rounded-[3px] [&>select]:px-[5px] [&>select]:py-[2px] [&>select]:mt-[20px] [&>select]:mb-[3px] [&>select]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>select:focus]:outline-none [&>select:focus]:shadow-none'>
              <label>Индекс:</label>
              <input value={postCode} onChange={(e)=>setPostCode(e.target.value)} />
            </div>
            <div className='flex justify-between [&>label]:flex-1 [&>label]:my-[3px] [&>label]:font-medium [&>label]:font-[Montserrat,sans-serif] [&>input]:flex-[2] [&>input]:my-[3px] [&>input]:rounded-[3px] [&>input]:border [&>input]:border-slate-300 [&>input]:px-[5px] [&>input]:py-[2px] [&>input]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>input[type=checkbox]]:h-[20px] [&>select]:flex-1 [&>select]:appearance-none [&>select]:bg-white [&>select]:border-[1.7px] [&>select]:border-slate-300 [&>select]:rounded-[3px] [&>select]:px-[5px] [&>select]:py-[2px] [&>select]:mt-[20px] [&>select]:mb-[3px] [&>select]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>select:focus]:outline-none [&>select:focus]:shadow-none'>
              <label>Район:</label>
              <input value={raion} onChange={(e)=>setRaion(e.target.value)} />
            </div>
            <div className='flex justify-between [&>label]:flex-1 [&>label]:my-[3px] [&>label]:font-medium [&>label]:font-[Montserrat,sans-serif] [&>input]:flex-[2] [&>input]:my-[3px] [&>input]:rounded-[3px] [&>input]:border [&>input]:border-slate-300 [&>input]:px-[5px] [&>input]:py-[2px] [&>input]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>input[type=checkbox]]:h-[20px] [&>select]:flex-1 [&>select]:appearance-none [&>select]:bg-white [&>select]:border-[1.7px] [&>select]:border-slate-300 [&>select]:rounded-[3px] [&>select]:px-[5px] [&>select]:py-[2px] [&>select]:mt-[20px] [&>select]:mb-[3px] [&>select]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>select:focus]:outline-none [&>select:focus]:shadow-none'>
              <label style={{flex:1}}>Область:</label>
              <select
                style={{appearance: 'none', padding: '0px 10px', margin: '0px', flex: 2}}
                value={oblast}
                onChange={(e) => setOblast(e.target.value)}
                >
                <option value=""></option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            </>
            : null}
              {(typePost==='R' || typePost==='R1' || typePost==='R2') &&
                <div className='flex justify-end mt-2'>
                <Button className='bg-[#274C77] text-white hover:bg-[#1E3A5D] hover:text-white' variant='secondary' onClick={()=>{handlePrint()}}><i style={{color: 'white', marginRight: 10}} className="bi bi-printer"></i> печать </Button>
                </div>
              }



{(typePost === 'E' || typePost === 'E1') && (
    <div className="mt-3">
        {codeOutside?.trim() ? (
            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    className="bg-[#274C77] text-white hover:bg-[#1E3A5D] hover:text-white"
                    variant="secondary"
                    size="sm"
                    onClick={printLabelEP}
                    disabled={printingEP}
                    title="Печать ярлыка"
                    aria-label="Печать ярлыка"
                >
                    <i className={`bi ${printingEP ? 'bi-arrow-repeat animate-spin' : 'bi-printer'}`} />
                </Button>
                <Button
                    className="gap-2 bg-[#274C77] text-white hover:bg-[#1E3A5D] hover:text-white"
                    variant="secondary"
                    size="sm"
                    onClick={checkOrderEp}
                >
                    <i className="bi bi-search" />
                    Проверить
                </Button>
            </div>
        ) : (
            <>
                <div className="flex items-center gap-2">
                <div className="relative flex min-w-0 flex-1 flex-col" ref={dropdownRef}>
                    <button
                        type="button"
                        className="relative h-8 w-full text-left pl-2 overflow-hidden text-ellipsis whitespace-nowrap rounded-[3px] border border-slate-300 bg-white pr-[30px] before:pointer-events-none before:absolute before:right-[10px] before:top-1/2 before:-translate-y-[65%] before:border-[5px] before:border-transparent before:text-[13px] before:content-['⏶'] after:pointer-events-none after:absolute after:right-[10px] after:top-1/2 after:-translate-y-[35%] after:border-[5px] after:border-transparent after:text-[13px] after:content-['⏷']"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {nameOPS?.ops_name || (opsLoading ? 'Загрузка отделений...' : 'Выберите отделение')}
                    </button>

                    {isOpen && (
                        <div className="absolute top-full left-0 z-50 max-h-[300px] w-full overflow-auto shadow-lg rounded-b-[3px] border border-t-0 border-slate-300 bg-white p-[10px]">
                            <input
                                className="h-[30px] w-full border border-slate-400"
                                ref={inputRef}
                                value={inputOPS}
                                onChange={e => setInputOPS(e.target.value)}
                            />

                            {filterOPS.map(el => (
                                <div
                                    key={el.id}
                                    onClick={() => putNameOPS(el)}
                                    className={`flex cursor-pointer items-center justify-between gap-2 px-2 py-1 hover:bg-slate-100 ${nameOPS?.id === el.id ? 'bg-blue-50 font-medium text-[#274C77]' : ''}`}
                                >
                                    <span>{el.ops_name}</span>
                                    {nameOPS?.id === el.id && <i className="bi bi-check-lg shrink-0" />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 justify-end">
                    <Button
                        className="h-8 gap-2 bg-[#274C77] text-white hover:bg-[#1E3A5D] hover:text-white"
                        variant="secondary"
                        size="sm"
                        onClick={sendOrderEp}
                        disabled={!nameOPS?.id}
                    >
                        <i className="bi bi-plus-lg" />
                        Оформить
                    </Button>
                </div>
                </div>
            </>
        )}
    </div>
)}

                          <div className='flex justify-between mt-4 [&>label]:flex-1 [&>label]:my-[3px] [&>label]:font-medium [&>label]:font-[Montserrat,sans-serif] [&>input]:flex-[2] [&>input]:my-[3px] [&>input]:rounded-[3px] [&>input]:border [&>input]:border-slate-300 [&>input]:px-[5px] [&>input]:py-[2px] [&>input]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>input[type=checkbox]]:h-[20px] [&>select]:flex-1 [&>select]:appearance-none [&>select]:bg-white [&>select]:border-[1.7px] [&>select]:border-slate-300 [&>select]:rounded-[3px] [&>select]:px-[5px] [&>select]:py-[2px] [&>select]:mt-[20px] [&>select]:mb-[3px] [&>select]:shadow-[0_6px_6px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.14)] [&>select:focus]:outline-none [&>select:focus]:shadow-none'>
              <label>Штрихкод:</label>
              <input style={{marginLeft: 5}} value={codeOutside} onChange={e=>setCodeOutside(e.target.value)} />
            </div>


          </div>
<div className="flex justify-between items-center mt-auto">
    <button
        type="button"
        onClick={SaveData}
        disabled={
            saveStatus === 'saving' ||
            saveStatus === 'saved'
        }
        className={`inline-flex items-center justify-center gap-[9px] w-[36px] min-w-[36px] h-[36px] p-0 rounded-full border text-[12px] font-medium cursor-pointer transition-[background,color,border-color,transform] duration-[250ms] hover:enabled:-translate-y-px disabled:opacity-100 [&>i]:text-[17px] ${{
            saved: 'bg-[#edf8f1] text-[#27834d] border-[#ccebd7] cursor-default hover:transform-none',
            pending: 'bg-[#fff8e6] text-[#a87813] border-[#f3e3b8]',
            saving: 'bg-[#edf4ff] text-[#3975bc] border-[#d4e5ff] cursor-wait',
            error: 'bg-[#fff0f0] text-[#c44343] border-[#f5cccc]'
        }[saveStatus]}`}
        title={{
            saved: 'Сохранено',
            pending: 'Сохранить изменения',
            saving: 'Сохраняется...',
            error: 'Ошибка. Повторить сохранение'
        }[saveStatus]}
        aria-label={{
            saved: 'Сохранено',
            pending: 'Сохранить изменения',
            saving: 'Сохраняется...',
            error: 'Ошибка. Повторить сохранение'
        }[saveStatus]}
    >
        {saveStatus === 'saving' ? (
            <span className="w-[15px] h-[15px] border-2 border-[#bdd4f3] border-t-[#3975bc] rounded-full animate-spin motion-reduce:animate-none" />
        ) : saveStatus === 'pending' ? (
            <i className="bi bi-cloud-arrow-up" />
        ) : saveStatus === 'error' ? (
            <i className="bi bi-exclamation-circle" />
        ) : (
            <i className="bi bi-check-circle-fill" />
        )}
    </button>
        <div className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-1 py-0.5" aria-label="История изменений заказа">
        <button type="button" onClick={() => navigateHistory(-1)} disabled={historyIndex === 0 || saveStatus === 'saving'} title="Назад — предыдущая сохранённая версия" aria-label="Назад по истории" className="flex h-8 w-8 items-center justify-center rounded-md text-stone-700 transition hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30">
            <i className="bi bi-arrow-left text-base" />
        </button>
        <span className="min-w-[36px] text-center text-[11px] font-medium tabular-nums text-stone-500" title="Текущая версия / всего версий">{historyIndex + 1}/{history.length}</span>
        <button type="button" onClick={() => navigateHistory(1)} disabled={historyIndex >= history.length - 1 || saveStatus === 'saving'} title="Вперёд — следующая сохранённая версия" aria-label="Вперёд по истории" className="flex h-8 w-8 items-center justify-center rounded-md text-stone-700 transition hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30">
            <i className="bi bi-arrow-right text-base" />
        </button>
    </div>
</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-[5px] p-[20px] flex flex-col flex-1 min-w-0 [&>div:first-child]:mb-[25px]">
          <div>
            {/* для обьеденения*/}
            {duplicateOrders.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-1 mb-8">
                    {duplicateOrders.map((el) => (
                        <button
                            key={el.id}
                            onClick={() => toJoinOrder(el.id)}
                            className="group inline-flex items-center gap-1.5
                                    px-2.5 py-1 rounded-md
                                    bg-stone-50 border border-stone-200
                                    text-[12px] font-medium text-stone-700
                                    transition-all
                                    hover:bg-[#274C77] hover:border-[#274C77] hover:text-white
                                    active:scale-95"
                            title={`Объединить с заказом №${el.order_number}`}
                        >
                            <i className="bi bi-plus-circle text-[11px] opacity-70 group-hover:opacity-100" />
                            №{el.order_number}
                        </button>
                    ))}
                </div>
            )}
{photo.map((el, index) => (
    <OneFormat
        key={el.clientId || el.id}
        index={index}
        setPhoto={setPhoto}
        photo={photo}
        el={el}
        DeleteFormat={DeleteFormat}
    />
))}
              <button style={{marginLeft: '50px', marginTop: '10px'}} type="button" onClick={()=>{AddFormat()}}>добавить</button>
            </div>
          <div className="flex justify-between items-center mt-auto">
            <button className='px-[8px] py-[4px] w-[40%] text-[13px] border border-slate-300 text-[#274C77] rounded-[5px] cursor-pointer bg-slate-100 hover:bg-slate-200'  onClick={()=>{setPrice((SumTeor()*sale).toFixed(2))}}>{SumTeor()}р</button>
            <div  style={{transform: 'scale(0.85)'}}>
            <select style={{appearance: 'none', padding: '0px 10px'}}
                    value={sale}
                    onChange={(e)=>setSale(e.target.value)}>
              <option value={1}>0%</option>
              <option value={0.9}>10%</option>
              <option value={0.85}>15%</option>
              <option value={0.8}>20%</option>
            </select>
            </div>
            <input
              className='px-[8px] py-[4px] w-[40%] text-[13px] text-center border-[1.5px] border-slate-300 rounded-[5px]'
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <input
              className='px-[8px] py-[4px] w-[40%] text-[13px] text-center border-[1.5px] border-slate-300 rounded-[5px]'
              style={{width: '20%', height: '75%', marginLeft: 2}}
              type="text"
              value={price_deliver}
              onChange={(e) => setPriceDeliver(e.target.value)}
            />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-[5px] p-[20px] flex flex-col flex-1 min-w-0 [&>div:first-child]:mb-[25px]">
          <div className="space-y-4 !mb-0">
            <section className="space-y-2">
              <div className="flex items-start gap-2">
                <button type="button" onClick={() => setPhoneUser(phone)} title="Владелец — подставить телефон получателя" className="shrink-0 text-sm text-[#274C77]">
                  <i className="bi bi-person-circle" /> Владелец:
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-sm font-medium ${isUser() ? 'text-slate-800' : 'text-red-600'}`} title={showFIO()}>{showFIO() || 'Владелец не найден'}</div>
                  <div className="relative mt-1 min-w-0" onMouseEnter={handleModalMouseEnter} onMouseLeave={handleModalMouseLeave}>
                    <input className="h-7 w-full rounded-md border border-slate-300 px-2 text-xs outline-none focus:border-[#274C77]" value={phoneUser} onChange={e => setPhoneUser(e.target.value)} />
                    <SearchBar users={users} modalVisible={modalVisible} setModalVisible={setModalVisible} phoneUser={phoneUser} setPhoneUser={setPhoneUser} />
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3 whitespace-nowrap text-xs text-slate-600">
                  <span className="inline-flex shrink-0 items-center gap-1" title="Количество заказов">
                    <i className="bi bi-box-seam text-[#274C77]" />
                    {order.user.orderCount}
                  </span>

                  <span className="inline-flex shrink-0 items-center gap-1" title="Общая сумма заказов">
                    <i className="bi bi-wallet2 text-[#274C77]" />
                    {order.user.totalOrderSum} р
                  </span>

                  <span
                    className="inline-flex min-w-0 flex-1 items-center gap-1"
                    title={users.find(user => user.phone === phoneUser)?.aboutUser || 'Нет заметок'}
                  >
                    <i className="bi bi-person-lines-fill shrink-0 text-[#274C77]" />
                    <span className="truncate text-slate-500">
                      {users.find(user => user.phone === phoneUser)?.aboutUser || 'Нет заметок'}
                    </span>
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-auto h-7 w-7 shrink-0 p-0 text-[#274C77]"
                    title="История заказов"
                    aria-label="История заказов"
                    onClick={openModalOrders}
                  >
                    <i className="bi bi-list-ul" />
                  </Button>
                </div>
            </section>
            <section className="space-y-4">
  <div className="relative mt-8">
    <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-slate-600">
      Заметки
    </label>
    <textarea
      className="block w-full rounded-md border border-slate-300 px-2 py-2 text-sm outline-none focus:border-[#274C77]"
      rows={numRows1}
      value={notes}
      onChange={e => setNotes(e.target.value)}
    />
  </div>

  <div className="relative">
    <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-slate-600">
      Примечания клиента
    </label>
    <textarea
      className="block w-full rounded-md border border-slate-300 px-2 py-2 text-sm outline-none focus:border-[#274C77]"
      rows={numRows}
      value={other}
      onChange={e => setOther(e.target.value)}
    />
  </div>
</section>
          </div>
          <section className="mt-4">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700"><i className="bi bi-calendar-event text-[#274C77]" /> Отправка ожидается</label>
              <input className="h-8 rounded-md border border-slate-300 px-2 text-xs outline-none focus:border-[#274C77]" type="date" value={date_sent} onChange={e => setDate_sent(e.target.value)} />
            </div>
          {/* === СМС — только для USER === */}
          {order.user?.role === 'USER' && (
              [0, 8].includes(Number(order.status)) ? (
                  <div className="mt-2 gap-1 flex justify-start">
                      {ShowBtnSms(is_sms_error, SmsError, is_sms_error ? 'Ошибка отправлена' : 'Ошибка')}
                  </div>
              ) : (
                  <div className="relative mt-2 pt-1">
                      {/* Подпись «СМС» на рамке */}
                      <span className="absolute -top-2 left-3 px-1.5 bg-white
                                      text-[10px] uppercase tracking-wider font-semibold
                                      text-stone-400 select-none">
                          Смс
                      </span>
                      {/* Внутренний блок с рамкой */}
                      <div className="flex items-center gap-1.5 px-3 py-2
                                      border border-stone-200 rounded-lg
                                      whitespace-nowrap">
                          {ShowBtnSms(is_sms_add, SmsAdd, 'принят')}
                          {ShowBtnSms(is_sms_send, SmsSend, 'отправлен')}
                          {(order.typePost === 'R1' || order.typePost === 'E1' || order.typePost === 'R2') &&
                              ShowBtnSms(is_sms_pay, SmsPay, 'оплата')}
                      </div>
                  </div>
              )
          )}
          </section>
          {/* === Блок оплаты — для всех типов ЕРИП, вне зависимости от роли === */}
          {(order.typePost === 'R1' || order.typePost === 'E1' || order.typePost === 'R2') &&
          [1, 2, 3, 4, 5, 7].includes(Number(order.status)) && (
              <div className="relative mt-4 pt-1">
                  {/* Подпись «ОПЛАТА» на рамке */}
                  <span className="absolute -top-2 left-3 px-1.5 bg-white
                                  text-[10px] uppercase tracking-wider font-semibold
                                  text-stone-400 select-none">
                      Оплата
                  </span>
                  {/* Внутренний блок с рамкой */}
                  <div className="flex items-center gap-1.5 px-3 py-2
                                  border border-stone-200 rounded-lg
                                  whitespace-nowrap">
                      {/* Статус оплаты — 3 варианта */}
                      {order.isPayment === 'paid' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
                                          text-[12px] font-medium whitespace-nowrap
                                          bg-green-50 text-green-700 border border-green-200">
                              <i className="bi bi-check-circle-fill text-[11px]" />
                              Оплачен
                          </div>
                      )}
                      {order.isPayment === 'wait' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
                                          text-[12px] font-medium whitespace-nowrap
                                          bg-amber-50 text-amber-700 border border-amber-200">
                              <i className="bi bi-clock-fill text-[11px]" />
                              Ожидает оплаты
                          </div>
                      )}
                      {order.isPayment === 'none' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
                                          text-[12px] font-medium whitespace-nowrap
                                          bg-stone-50 text-stone-500 border border-stone-200">
                              <i className="bi bi-dash-circle text-[11px]" />
                              Счёт не выставлен
                          </div>
                      )}
                      {/* Кнопки — в зависимости от состояния */}
                      {order.isPayment === 'none' && (
                          <Button className='border-slate-300 text-[#274C77] hover:bg-slate-100 hover:text-[#1E3A5D]' variant='outline' size='sm' onClick={() => AddInvoices()}>
                              <i className="bi bi-receipt text-[12px] mr-1" />
                              Выставить счёт
                          </Button>
                      )}
                      {order.isPayment === 'wait' && (
                          <>
                              <Button className='border-slate-300 text-[#274C77] hover:bg-slate-100 hover:text-[#1E3A5D]' variant='outline' size='sm' onClick={() => CancelInvoices()}>
                                  <i className="bi bi-x-circle text-[12px] mr-1" />
                                  отменить
                              </Button>
                              <Button className='border-slate-300 text-[#274C77] hover:bg-slate-100 hover:text-[#1E3A5D]' variant='outline' size='sm' onClick={() => CheckInvoices()}>
                                  <i className="bi bi-arrow-clockwise text-[12px] mr-1" />
                                  проверить
                              </Button>
                          </>
                      )}
                      {order.isPayment === 'paid' && (
                          <Button className='border-slate-300 text-[#274C77] hover:bg-slate-100 hover:text-[#1E3A5D]' variant='outline' size='sm' onClick={() => CheckInvoices()}>
                              <i className="bi bi-arrow-clockwise text-[12px] mr-1" />
                              проверить
                          </Button>
                      )}
                  </div>
              </div>
          )}
          <div className='flex justify-end mt-auto pt-4 gap-1' >
            <Button className='w-[25%] bg-slate-100 text-slate-700 border border-slate-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300' variant='outline' size='sm' onClick={()=>DeleteOrder()}>удалить</Button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
});
