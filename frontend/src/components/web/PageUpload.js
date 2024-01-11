import {ProgressBar} from 'react-bootstrap'
import style from './PageUpload.module.css'

export const PageUpload = ({current, amountPhoto}) =>{

    return(
        <div className={style.pageUpload}>
            <h5>Пожалуйста, подождите. Идет загрузка фотографий...</h5>
            <ProgressBar animated now={100} label={`Загружено фото: ${current} из ${amountPhoto}`} />

            <div className='pageUpload_info'>
                <h6>* не закрывайте и не обновляйте страницу до окончания загрузки!</h6>
                <h6>** скорость загрузки зависит от скорости вашего интернета</h6>
            </div>
            
        </div>
    )
}