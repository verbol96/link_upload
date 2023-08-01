import { useState } from 'react';
import { useSelector } from 'react-redux';

export const ProfileAdress = () => {
  const adressMain = useSelector((state) => state.private.order[0]);

  const [typePost, setTypePost] = useState(adressMain.typePost);
  const [city, setCity] = useState(adressMain.city);
  const [adress, setAdress] = useState(adressMain.adress);
  const [postCode, setPostCode] = useState(adressMain.postCode);
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    // Здесь добавьте логику сохранения изменений
    setIsEditing(false);
  };

  return (
    <div className="card_form">
      <div className="form_group">
        <label className="form_label"><i className="bi bi-code-square"></i> Тип отправки:</label>
        <div className="containerSelect">
            <select
            className={`form_control-select ${!isEditing ? 'select_disabled' : ''}`}
            value={typePost}
            onChange={(e) => setTypePost(e.target.value)}
            disabled={!isEditing}
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
              readOnly={!isEditing}
            />
          </div>
          <div className="form_group">
            <label className="form_label"><i className="bi bi-house"></i> Номер отделения (адрес):</label>
            <input
              className="form_control"
              value={adress}
              onChange={(e) => setAdress(e.target.value)}
              readOnly={!isEditing}
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
              readOnly={!isEditing}
            />
          </div>
          <div className="form_group">
            <label className="form_label"><i className="bi bi-houses"></i> Город:</label>
            <input
              className="form_control"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              readOnly={!isEditing}
            />
          </div>
          <div className="form_group">
            <label className="form_label"><i className="bi bi-house"></i> Адрес:</label>
            <input
              className="form_control"
              value={adress}
              onChange={(e) => setAdress(e.target.value)}
              readOnly={!isEditing}
            />
          </div>
        </>
      )}

    
      <div className="button_group">
        <button className={`btn ${isEditing ? 'btn_cancel' : 'btn_edit'}`} onClick={toggleEdit}>
          {isEditing ? <><i class="bi bi-x-square"></i> отменить</> : <><i className="bi bi-pencil-square"></i> редактировать</>}
        </button>
        {isEditing && (
          <button className="btn btn_save" onClick={handleSaveChanges}>
           <i className="bi bi-check2-square"></i> сохранить изменения
          </button>
        )}
      </div>
    </div>
  );
};