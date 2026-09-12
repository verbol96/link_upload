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
import { Textarea } from "../../ui/textarea";

export const UserList = () => {

    const [data, setData] = useState([])
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [totalPage, setTotalPage] = useState(0)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [limit, setLimit] = useState(100)
    const [loading, setLoading] = useState(false);
    const [sort, setSort] = useState('createdAt-desc')
 
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
    const [ordersModal, setOrdersModal] = useState([]);
    

    const handleRowDoubleClick = async(user) => {
        const {data} = await $host.get(`/api/order/ordersUser/${user.id}`)
        setOrdersModal(data)
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

    
    const photoLine = (data) =>{
          return data.reduce((sum, el)=>{
            if(el.paper==='lustre'){
                return sum+el.amount*el.copies+"шт("+el.format+")ЛЮСТР "
            }else{
                return sum+el.amount*el.copies+"шт("+el.format+") "
            }
        }, '')
    }

    
const [expandedOrder, setExpandedOrder] = useState(null);

const toggleOrder = (orderNumber) => {
  setExpandedOrder(expandedOrder === orderNumber ? null : orderNumber);
  //console.log(ordersModal)
};

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
                                  <td className={`px-6 py-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-[150px] ${
                                    client.lastOrderDate?.split('.')[2] === '2026' ? 'text-blue-600' : 'text-gray-600'
                                  }`}>
                                    {client.lastOrderDate}
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
        <DialogContent className="max-w-[90%] h-[90vh] " onOpenAutoFocus={(e) => e.preventDefault()} >
          <DialogHeader>
            <DialogTitle className='h-[20px]'>Редактирование клиента</DialogTitle>
            <DialogDescription className="sr-only">
                Форма редактирования данных клиента
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-row gap-5 overflow-auto">
            <div className=" flex flex-col flex-[30%] bg-gray-100 p-3 rounded-md">
              <div className="">
                <label className="text-sm font-medium">ФИО</label>
                <Input
                  name="FIO"
                  value={formData.FIO || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="">
                <label className="text-sm font-medium">Телефон</label>
                <Input
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="">
                <label className="text-sm font-medium">Роль</label>
                <Input
                  name="role"
                  value={formData.role || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="">
                <label className="text-sm font-medium">Тип почты</label>
                <Input
                  name="typePost"
                  value={formData.typePost || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="">
                <label className="text-sm font-medium">Индекс</label>
                <Input
                  name="postCode"
                  value={formData.postCode || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="s">
                <label className="text-sm font-medium">Город</label>
                <Input
                  name="city"
                  value={formData.city || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="">
                <label className="text-sm font-medium">Адрес</label>
                <Input
                  name="adress"
                  value={formData.adress || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium">О клиенте</label>
                <Textarea
                  name="aboutUser"
                  value={formData.aboutUser || ''}
                  onChange={handleInputChange}
                />         
              </div>
              <div>
                <Button className='mt-4' onClick={handleSave}>
                Сохранить
                </Button>
              </div>
               
            </div>
            
            <div className="flex flex-[70%]  h-full ">
                  <div className="flex flex-col w-full h-full">
                    
                    <div className="flex-1 overflow-auto">
                        <div className="w-full text-sm">
                        {/* Заголовки */}
                        <div className="sticky bg-white top-0 border-b flex font-semibold  z-10">
                          <div className="flex-1 py-2 px-2">Дата</div>
                          <div className="flex-1 py-2 px-2">ФИО</div>
                          <div className="flex-1 py-2 px-2">Город</div>
                          <div className="flex-1 py-2 px-2">Тип</div>
                          <div className="flex-1 py-2 px-2">Заказ</div>
                          <div className="flex-1 py-2 px-2">Сумма</div>
                          <div className="flex-1 py-2 px-2">Источник</div>
                        </div>

                        {ordersModal.map((el) => (
                          <div key={el.order_number}>
                            {/* Строка */}
                            <div 
                             className={`flex border-b hover:bg-gray-200 cursor-pointer ${expandedOrder === el.order_number ? 'bg-gray-200' : ''}`}
                              onClick={() => toggleOrder(el.order_number)}
                            >
                              <div className="flex-1 py-2 px-2">{new Date(el.createdAt).toLocaleDateString('ru-RU')}</div>
                              <div className="flex-1 py-2 px-2 truncate">{el.FIO}</div>
                              <div className="flex-1 py-2 px-2 truncate">{el.city}</div>
                              <div className="flex-1 py-2 px-2">{el.typePost}</div>
                              <div className="flex-1 py-2 px-2 truncate">{photoLine(el.photos)}</div>
                              <div className="flex-1 py-2 px-2">{el.price}</div>
                              <div className="flex-1 py-2 px-2">{el.origin}</div>
                            </div>

                            {/* Раскрывающийся блок */}
                            {expandedOrder === el.order_number && (
                              <div className="bg-gray-200 p-4 border-b">
                                  <div><strong>ФИО:</strong> {el.FIO}</div>
                                  <div><strong>телефон:</strong> {el.phone}</div>

                                  <div><strong>Город:</strong> {el.city}</div>
                                  <div><strong>Адрес:</strong> {el.adress}</div>
                                  <div><strong>Код:</strong> {el.codeOutside}</div>
                                  <div><strong>заметки:</strong> {el.notes}</div>
                                  <div><strong>причениания:</strong> {el.other}</div>
                                  <div><strong>фото:</strong> {photoLine(el.photos)}</div>
                                  <div><strong>цена:</strong> {el.price}р + {el.price_deliver}р</div>
                                  
                                  
                                
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                      
                    <div className='flex flex-row justify-end gap-5 mt-3 text-sm bg-gray-100 w-full py-1 px-5'>
                      <label className=''> Всего заказов: {selectedUser?.orderCount  || ''} шт</label>
                      <label className=''>Сумма заказов: {selectedUser?.totalOrderSum || ''} р</label>
                    </div>


                  </div>
            </div>
          </div>

        </DialogContent>
      </Dialog>



      </>

           

    )
}