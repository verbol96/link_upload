import { useState } from 'react';
import { useSelector } from 'react-redux';
import { updateUserAdress } from '../../http/dbApi';
import './Settings.css';

export const ProfileAdress = () => {
  const user = useSelector((state) => state.private.user);

  const [typePost, setTypePost] = useState(user.typePost);
  const [city, setCity] = useState(user.city);
  const [adress, setAdress] = useState(user.adress);
  const [postCode, setPostCode] = useState(user.postCode);

  const handleSaveChanges = () => {
    const data = {
      typePost,city, adress,postCode
    }
    updateUserAdress(user.id, data)
  };

  return (
    <div className="card_form">
      <div className="form_group">
        <label className="form_label"><i className="bi bi-code-square"></i> Тип отправки:</label>
        <div className="containerSelect">
            <select
            className={`form_control-select`}
            value={typePost}
            onChange={(e) => setTypePost(e.target.value)}
            >
            <option value={'E'}>Европочта</option>
            <option value={'R'}>Белпочта</option>
          </select>
        </div>
      </div>

      {typePost === 'E' ? (
        <>
          <div className="form_group">
            <label className="form_label"><i className="bi bi-houses"></i> Город:</label>
            <input
              className="form_control"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="form_group">
            <label className="form_label"><i className="bi bi-house"></i> Номер отделения (адрес):</label>
            <input
              className="form_control"
              value={adress}
              onChange={(e) => setAdress(e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <div className="form_group">
            <label className="form_label"><i className="bi bi-123"></i> Индекс:</label>
            <input
              className="form_control"
              value={postCode}
              onChange={(e) => setPostCode(e.target.value)}
            />
          </div>
          <div className="form_group">
            <label className="form_label"><i className="bi bi-houses"></i> Город:</label>
            <input
              className="form_control"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="form_group">
            <label className="form_label"><i className="bi bi-house"></i> Адрес:</label>
            <input
              className="form_control"
              value={adress}
              onChange={(e) => setAdress(e.target.value)}
            />
          </div>
        </>
      )}
 
      <div className="button_group">
        <button className="btn btn_save" onClick={handleSaveChanges}>
          <i className="bi bi-check2-square"></i> сохранить изменения
        </button>
      </div>
    </div>
  );
};