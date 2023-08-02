import './TableFooter.css'

export const TableFooter = ({filteredOrders}) =>{

    const SumPrice = () =>{
        const pr =  filteredOrders.reduce((sum,el)=>{
            return sum+Number(el.price)
        },0)
       
        return pr
    }

    const SumFormat = () =>{
        const pr =  filteredOrders.reduce((sum,el)=>{
            return sum+ 
                el.photos.reduce((sum1,el1)=>{
                return sum1+Number(el1.amount)
                },0)
        },0)
        return pr
    }
    

    return(
        <div className='card_footer'>
            <div className='card_footer_1'>N={filteredOrders.length}</div>
            <div className='card_footer_2'>{SumFormat()}шт</div>
            <div className='card_footer_3'>{SumPrice().toFixed(2)}р</div>
        </div>
    )
}