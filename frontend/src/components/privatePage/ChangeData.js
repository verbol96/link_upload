import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { dataChange } from '../../http/authApi';
import { whoAmI } from '../../http/authApi';
import { changeName } from '../../store/privatePageReducer';
import './Settings.css';

export const ChangeData = ({ ShowToast }) => {
  const [FIO, setFIO] = useState('');
  const [phone, setPhone] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    async function getUser() {
      let value = await whoAmI();
      setFIO(value.FIO);
      setPhone(value.phone);
    }
    getUser();
  }, []);

  const handleChangeData = async () => {
    await dataChange(phone, FIO);
    dispatch(changeName(FIO));
    ShowToast('success', 'данные изменены');
  };

  return (
    <div className="card_form">
      <div className="form_group"
          onMouseEnter={() => setShowMessage(true)}
          onMouseLeave={() => setShowMessage(false)}>
        <label className="form_label"><i className="bi bi-telephone"></i> Телефон</label>
        <input
          className="form_control"
          placeholder="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled
        />
        {showMessage && <div className='messagePhone'><i className="bi bi-exclamation-triangle"></i> Действие заблокировано. Для изменеия номера обратитесь к сотруднику LINK в телеграм или инстаграм </div>}
      </div>
      <div className="form_group">
        <label className="form_label"><i className="bi bi-person"></i> ФИО</label>
        <input
          className="form_control"
          placeholder="ФИО"
          value={FIO}
          onChange={(e) => setFIO(e.target.value)}
        />
      </div>

      <button className="btn btn_save" onClick={handleChangeData}>
        <i className="bi bi-check2-square"></i> сохранить изменения
      </button>

    </div>
  );
};