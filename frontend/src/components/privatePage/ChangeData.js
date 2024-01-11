import { useState } from 'react';
import { useSelector,useDispatch } from 'react-redux';
import { getOneUser, updateUserAdress } from '../../http/dbApi';
import style from './ChangeData.module.css'
import { setUser } from '../../store/privatePageReducer';

export const ChangeData = () => {
  const user = useSelector((state) => state.private.user);
  const dispatch = useDispatch();

  const [FIO, setFIO] = useState(user.FIO);
  const [typePost, setTypePost] = useState(user.typePost);
  const [city, setCity] = useState(user.city);
  const [adress, setAdress] = useState(user.adress);
  const [postCode, setPostCode] = useState(user.postCode);

  const [isEdit, setIsEdit] = useState(false)
 
  const ClickBtn = async() =>{

    if(isEdit){
      const data = {
        FIO, typePost, city, adress, postCode
      }
      updateUserAdress(user.id, data)

      let data1 = await getOneUser(user.phone)
      dispatch(setUser(data1))
    }
    setIsEdit(prev=>!prev)
  }

  const ShowTypePost = () =>{
    if(user.typePost==='R') return 'Белпочта'
    else return 'Европочта'
  }


  return ( 
    <div className={style.cardForm}>
      <div className={style.formGroup} style={{marginBottom: 40}}>
        <label className={style.formLabel}>ФИО:</label>
        {isEdit?
         <input 
         spellCheck="false"
         className={style.formInput}
         placeholder="ФИО"
         value={FIO}
         onChange={(e) => setFIO(e.target.value)}
        />
        :
        <label  className={style.formLabel1}>{user.FIO}</label>
        }
        
       
      </div>
      <div className={style.formGroup}>
        <label className={style.formLabel}> Тип отправки:</label>
        {isEdit?
        <div className={style.formForSelect}>
          <select
            disabled={isEdit?false:true}
            className={style.formSelect}
            value={typePost}
            onChange={(e) => setTypePost(e.target.value)}
            >
            <option value={'E'}>Европочта</option>
            <option value={'R'}>Белпочта</option>
          </select>
        </div>
        :
        <label  className={style.formLabel1}>{ShowTypePost()}</label>
        }
      </div>

      {typePost === 'E' ? (
        <>
          <div className={style.formGroup}>
            <label className={style.formLabel}> Город:</label>
            {isEdit?
            <input
              disabled={isEdit?false:true}
              spellCheck="false"
              className={style.formInput}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            :
            <label  className={style.formLabel1}>{user.city}</label>
            }
          </div>
          <div className={style.formGroup}>
            <label className={style.formLabel}>Отделение:</label>
            {isEdit?
            <input
              disabled={isEdit?false:true}
              className={style.formInput}
              value={adress}
              onChange={(e) => setAdress(e.target.value)}
            />
            :
            <label  className={style.formLabel1}>{user.adress}</label>
            }
          </div>
        </>
      ) : (
        <>
          <div className={style.formGroup}>
            <label className={style.formLabel}> Индекс:</label>
            {isEdit?
            <input
              className={style.formInput}
              value={postCode}
              onChange={(e) => setPostCode(e.target.value)}
            />
            :
            <label  className={style.formLabel1}>{user.postCode}</label>
            }
          </div>
          <div className={style.formGroup}>
            <label className={style.formLabel}> Город:</label>
            {isEdit?
            <input
              className={style.formInput}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            :
            <label  className={style.formLabel1}>{user.city}</label>
            }
          </div>
          <div className={style.formGroup}>
            <label className={style.formLabel}> Адрес:</label>
            {isEdit?
            <input
              className={style.formInput}
              value={adress}
              onChange={(e) => setAdress(e.target.value)}
            />
            :
            <label  className={style.formLabel1}>{user.adress}</label>
            }
          </div>
        </>
      )}
 
      <div className={style.buttonGroup}>
        <button className={isEdit? style.btnSave:style.btnEdit} onClick={ClickBtn}>
           {isEdit? 'Сохранить изменения': 'Редактировать'}
        </button>
      </div>
    </div>
  );
};