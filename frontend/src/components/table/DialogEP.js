import { $host } from '../../http';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { useEffect, useState } from "react";
import "./DialogEP.css"; 
import { Input } from '../../ui/input';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from "../../ui/command"

import { Button } from '../../ui/button';
import { useToast } from '../../hooks/use-toast';


const MyModalComponent = ({ isOpen, closeModal, codeOutside }) => {

    const [order, setOrder] = useState({})
    const [loading, setLoading] = useState(true);
    const [listOps, setListObs] = useState([])

    const [name1, setName1] = useState('')
    const [name2, setName2] = useState('')
    const [phone, setPhone] = useState('')
    const [ops, setOps] = useState('')
    const [opsID, setOpsID] = useState('')
    const [price, setPrice] = useState('')

    const { toast } = useToast()


    useEffect(()=>{
        const DataGet = async() =>{
            const data1 = { number: codeOutside}
            
            try {
                const {data} = await $host.post('/api/ep/checkOrder', data1);
                
                setName1(data.Table[0].Name1Reciever)
                setName2(data.Table[0].Name2Reciever)
                setPhone(data.Table[0].PhoneNumberReciever)
                setOps(data.Table[0].AddressReciever)
                setPrice(data.Table[0].CashOnDeliverySum)
                setOpsID(data.Table[0].WarehouseIdRouteFInish)

                setOrder(data.Table[0])
                setLoading(false)
            } catch (error) {
                console.error('Ошибка:', error);
            }
        }

        DataGet()

    },[])

    useEffect(()=>{
        const getListOps = async () => {
            try {
              const data1 = await $host.get('/api/ep/getListOps');
              setListObs(data1.data.Table)
            } catch (error) {
              console.error('Ошибка при получении JWT:', error);
            }
          };
  
        getListOps()
    },[])
    
    const ChangeOrderEP = async() =>{
        const dataSend = {
            name1, name2, phone, ops: opsID, price, number: order.Number
        }

        const {data} = await $host.post('/api/ep/changeOrderEP', dataSend)

        if(data.Table[0].Result){
            toast({
                    description: data.Table[0].Result
                })
            }else{
                toast({
                    description: 'ошибка',
                    variant: "destructive",
                    })
            }
        closeModal()
    }


  return (
    <div>
    {loading ? (
        <Dialog  open={isOpen} onOpenChange={closeModal}>
        <DialogContent>
            <DialogTitle  className="placeholder w-50" ></DialogTitle>
            <DialogDescription  className="placeholder mt-2" ></DialogDescription>
            <DialogDescription  className="placeholder" ></DialogDescription>
            <DialogDescription className="placeholder w-[30%] mr-[10%] h-[40px] mt-2" ></DialogDescription>
        </DialogContent>
        </Dialog>
      
    ):(
     
    <div>
      <Dialog  open={isOpen} onOpenChange={closeModal}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle className='flex justify-center'>{order.Number}</DialogTitle>
          <div className='flex flex-col gap-2 '>
            <Input className="w-[90%] m-auto" value={name1} onChange={e=>setName1(e.target.value)} />
            <Input className="w-[90%] m-auto" value={name2} onChange={e=>setName2(e.target.value)} />
            <Input className="w-[90%] m-auto" value={phone} onChange={e=>setPhone(e.target.value)} />
            <Input className="w-[90%] m-auto" value={ops} readOnly />

                <Command className="rounded-lg border shadow-md w-[80%] m-auto h-[200px]" >
                    <CommandInput placeholder="Выберите из списка..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        {listOps.map((el) => (
                                <CommandItem
                                    key={el.Address1Id}
                                    value={el.WarehouseName}
                                    className="p-2 hover:bg-gray-200 cursor-pointer"
                                    onSelect={() => {
                                        setOps(el.WarehouseName)
                                        setOpsID(el.WarehouseId)
                                    }}
                                >
                                    {el.WarehouseName}
                                </CommandItem>
                            ))}
                    </CommandList>
                </Command>     

            <Input className="w-[90%] m-auto" value={price} onChange={e=>setPrice(e.target.value)} />

          </div>

          <DialogFooter>
            <Button onClick={()=>ChangeOrderEP()} className="bg-cyan-700 text-slate-100 hover:bg-cyan-700/80 text-white py-2 px-4 rounded mt-10">
              Обновить 
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    )}
  </div>
    
  );
};

export default MyModalComponent;