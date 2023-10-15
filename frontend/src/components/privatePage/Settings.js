import { ChangeData } from './ChangeData';
import { ChangePW } from './ChangePW';
import { ProfileAdress } from './ProfileAdress';
import { Toast } from 'react-bootstrap';
import { useState } from 'react';
import './Settings.css';

export const Settings = () => {
  const [toast, setToast] = useState(false);
  const [toastBG, setToastBG] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const ShowToast = (BG, message) => {
    setToast(true);
    setToastBG(BG);
    setToastMessage(message);
  };

  const ToggleButtonGroup = () => {
    const handleClick = (index) => {
      setActiveTab(index);
    };

    return (
        <div className="toggle-button-group">
          <button
            onClick={() => handleClick(0)}
            className={activeTab === 0 ? 'active' : ''}
          >
            Изменить данные 
          </button>
          <button
            onClick={() => handleClick(2)}
            className={activeTab === 2 ? 'active' : ''}
          >
            Изменить адрес
          </button>
          <button
            onClick={() => handleClick(1)}
            className={activeTab === 1 ? 'active' : ''}
          >
            Изменить пароль
          </button>
        </div>
      );
  };

  return (
    <div>
      <div className='textTitle1'>Настройки</div>
      <ToggleButtonGroup />
      {activeTab === 0 && <ChangeData ShowToast={ShowToast} />}
      {activeTab === 1 && <ChangePW ShowToast={ShowToast} />}
      {activeTab === 2 && <ProfileAdress ShowToast={ShowToast} />}

      <Toast
        bg={toastBG}
        onClose={() => setToast(false)}
        show={toast}
        delay={2000}
        autohide
      >
        <Toast.Body>{toastMessage}</Toast.Body>
      </Toast>
    </div>
  );
};