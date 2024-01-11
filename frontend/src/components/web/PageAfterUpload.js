import style from './PageAfterUpload.module.css'
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../http/authApi';

export const PageAfterUpload = ({amountPhoto, phone}) =>{

    const navigate = useNavigate();
    const dispatch = useDispatch()
    const isAuth = useSelector(state=>state.auth.auth)
    const user = useSelector(state=>state.private.user)

    const removeNonNumeric = (phoneNumber) => phoneNumber.replace(/[^0-9+]/g, '');

    const ToPrivate = async() =>{

        let phoneLogin=phone
        if(isAuth) phoneLogin = user.phone
        const data = await login(removeNonNumeric(phoneLogin));

        if (typeof data === 'object') {
        navigate('/PrivatePage');
        dispatch({ type: 'authStatus', paylods: true });
        }
    }

    return(
        <div className={style.pageAfterUpload}>
            <div className={style.title}>
                <div>
                    <h4>Заказ успешно отправлен!</h4>
                    <h6 style={{color: 'green'}}>Загружено {amountPhoto} фото.</h6>
                </div>
            </div>
            <div>
                <div>
                    <h6>Проверить заказ и его статус можете в{' '}
                    <button 
                        style={{ textDecoration: 'underline', backgroundColor: 'transparent', border: 'none' }} 
                        onClick={()=>ToPrivate()}
                    >
                            личном кабинете <i style={{color: 'black'}} className="bi bi-house-door"></i>
                        </button>
                        
                    </h6>

                    <h6 style={{fontSize: 12, marginTop: 50}}>* Так же получить любую информацию о заказе можно написав нам в 
                        <a style={{color: 'black'}} href="https://www.instagram.com/link.belarus" target="_blank"  rel="noopener noreferrer"> Instagram </a>
                        либо 
                        <a style={{color: 'black'}} href="https://www.t.me/link_belarus" target="_blank"  rel="noopener noreferrer">  Telegram</a>.
                    </h6>
                        
                </div>
            </div>
        </div>
    )
}