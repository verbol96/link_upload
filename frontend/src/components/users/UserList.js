import { useEffect, useState } from "react"
import { $host } from "../../http";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,DialogDescription
} from "../../ui/dialog";
import {Input} from "../../ui/input"
import {Button} from "../../ui/button"

export const UserList = () => {

    const [data, setData] = useState([])
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [totalPage, setTotalPage] = useState(0)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [limit, setLimit] = useState(100)
    const [loading, setLoading] = useState(false);
    const [sort, setSort] = useState('FIO-asc')
 
    const fetchData = async() =>{
        setLoading(true);
        try {
            const params = {
                page, 
                limit,
                search: debouncedSearch || undefined, 
                sortBy: sort.split('-')[0],
                sortDir:  sort.split('-')[1]
            };
            const response = await $host.get('api/auth/clients', { params });
            setData(response.data.data);
            setTotal(response.data.total)
            setTotalPage(response.data.totalPage)
        } catch (error) {
            console.error('Ошибка загрузки:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(()=>{
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[page, debouncedSearch, sort, limit])

    // Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
        setDebouncedSearch(search.toLowerCase());
        setPage(1);
        }, 800);

        return () => clearTimeout(timer);
    }, [search]);

    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});

    const handleRowDoubleClick = (user) => {
        setSelectedUser(user);
        setFormData(user);
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
        await $host.put(`/api/auth/clientUpdate/${selectedUser.id}`, formData);
        // Обновить данные
        const updatedData = data.map(user => 
            user.id === selectedUser.id ? formData : user
        );
        setData(updatedData);
        setIsModalOpen(false);
        } catch (error) {
        console.error('Ошибка сохранения:', error);
        }
    };

    const DeleteVoid = async() => {
        const confirmDelete = window.confirm('Хотите удалить клиентов без заказов? ');
        
        if (!confirmDelete) {
            return; // Если отмена - выходим
        }

        try {
            const {data} = await $host.get('/api/auth/deleteUsersWithoutOrders');
            window.alert("Удалено " + data.deletedUsersCount + " клиентов");
        } catch(error) {
            console.log('error delete void');
            window.alert('Ошибка при удалении клиентов');
        }
    }

    const [isOpen1, setIsOpen1] = useState(false)
    const [ordersModal, setOrdersModal] = useState([])
    
    const openModalOrders = async() =>{
      
      const {data} = await $host.get(`/api/order/ordersUser/${selectedUser.id}`)
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
    
    

    return(
        <>
         <div className="h-full flex flex-col p-4 mx-auto">
            {/* Шапка */}
            <div className="flex gap-5 justify-between items-center mb-6 flex-shrink-0">
                <h1 className="text-base font-semibold">Клиентов: {total}</h1>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2">
                        
                        <h1 className="text-sm font-medium text-gray-600">Отоброжать по:</h1>
                        
                        {/* Выпадающий список */}
                        <select className="px-3 py-1.5 border border-gray-300 rounded-base text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            style={{appearance: 'none',
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none'}}
                            value={limit} onChange={e=>setLimit(e.target.value)}        
                        >
                            <option value="10">10</option>
                            <option value="18">18</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-1">
                        <h1 className="text-sm font-medium text-gray-600">Сортировать по:</h1>
                        
                        {/* Выпадающий список */}
                        <select className="px-3 py-1.5 border border-gray-300 rounded-base text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            style={{appearance: 'none',
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none'}}
                                    value={sort} onChange={e=>setSort(e.target.value)}
                        >
                            <option value="FIO-asc">Имени ↑</option>
                            <option value="createdAt-asc">Дате регистрации ↑</option>
                            <option value="orderCount-asc">Количеству заказов ↑</option>
                            <option value="totalOrderSum-asc">Сумме заказов ↑</option>
                            <option value="FIO-desc">Имени ↓</option>
                            <option value="createdAt-desc">Дате регистрации ↓</option>
                            <option value="orderCount-desc">Количеству заказов ↓</option>
                            <option value="totalOrderSum-desc">Сумме заказов ↓</option>
                        </select>
                    </div>
                    
                    <input 
                        className="px-4 py-1.5 border rounded-lg w-64 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" 
                        placeholder="Поиск..."
                        onChange={e=>setSearch(e.target.value)}
                    />

                    <button  title="Удалить клиентов без заказов" className="border px-3 rounded-lg border-gray-300" onClick={()=>DeleteVoid()}><i className="bi bi-trash"></i></button>
                </div>
            </div>
            
            <div className="flex-1 min-h-0 overflow-auto  border-t border-b border-gray-200  rounded-sm p-1">
                    <table className="w-full">
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-1 text-center text-gray-500">
                                Загрузка...
                                </td>
                            </tr>
                            ) : (
                            data.map(client => (
                                <tr key={client.id} className="hover:bg-gray-50" onDoubleClick={() => handleRowDoubleClick(client)}>
                                <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px]">{client.FIO}</td>
                                <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px]">{client.phone}</td>
                                <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px]">{client.role}</td>
                                <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px]">{client.orderCount}</td>
                                <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px]">{client.totalOrderSum}</td>
                                <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px]">{client.city}</td>
                                <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px]">{client.adress}</td>
                                <td className="px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px] text-gray-600">
                                    {new Date(client.createdAt).toLocaleDateString('ru-RU')}
                                </td>
                                </tr>
                            ))
                            )}
                        </tbody>
                    </table>
            </div>
            
            {/* Пагинация */}
            <div className="flex items-center justify-between mt-6 flex-shrink-0">
                <div className="text-sm text-gray-600">
                Страница {page} из {totalPage}
                </div>
                
                <div className="flex gap-2">
                <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    ← Назад
                </button>
                
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === totalPage}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    Вперед →
                </button>
                </div>
            </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()} >
          <DialogHeader>
            <DialogTitle>Редактирование клиента</DialogTitle>
            <DialogDescription className="sr-only">
                Форма редактирования данных клиента
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ФИО</label>
              <Input
                name="FIO"
                value={formData.FIO || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Телефон</label>
              <Input
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Роль</label>
              <Input
                name="role"
                value={formData.role || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Тип почты</label>
              <Input
                name="typePost"
                value={formData.typePost || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Индекс</label>
              <Input
                name="postCode"
                value={formData.postCode || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Город</label>
              <Input
                name="city"
                value={formData.city || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Адрес</label>
              <Input
                name="adress"
                value={formData.adress || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex flex-row justify-between">
            <div>
                <Button  variant="outline" onClick={()=>openModalOrders()}>
                    Показать все заказы
                </Button>
            </div>
            <div className="flex  gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Отмена
                </Button>
                <Button onClick={handleSave}>
                Сохранить
                </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  <span className="text-teal-700 font-bold text-xl">
                    {selectedUser?.FIO || ''}
                  </span>
                </DialogTitle>
              </DialogHeader>
              
              {/* Прокручиваемая область */}
              <div className="flex-1 overflow-auto mt-4">
                <table className="w-full text-sm ">
                  <thead className="sticky top-0 bg-gray-50 ">
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
                  <tbody >
                    {ordersModal.map((el) => (
                      <tr key={el.order_number} className="border-b hover:bg-gray-50 ">
                        <td className="py-2 ">
                          {new Date(el.createdAt).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="py-2 px-2">
                          <div 
                            className="truncate block max-w-[200px]" 
                            title={el.FIO}
                          >
                            {el.FIO}
                          </div>
                        </td>
                        <td className="py-2">{el.city}</td>
                        <td className="py-2  px-2">
                          <div 
                            className="truncate block max-w-[200px]" 
                            title={el.adress}
                          >
                            {el.adress}
                          </div>
                        </td>
                        <td className="py-2">{el.typePost}</td>
                        <td className="py-2  px-2">
                          <div 
                            className="truncate max-w-[200px]" 
                            title={photoLine(el.photos)}
                          >
                            {photoLine(el.photos)}
                          </div>
                        </td>
                        <td className="py-2">{el.price} </td>
                        <td className="py-2  pl-2">{el.origin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className='flex flex-row justify-end gap-3 m-3 text-teal-800'>
                <label className=''> Всего заказов: {selectedUser?.orderCount  || ''} шт</label>
                <label className=''>Сумма заказов: {selectedUser?.totalOrderSum || ''} р</label>
                </div>
             
            </DialogContent>
          </Dialog>


      </>

           

    )
}