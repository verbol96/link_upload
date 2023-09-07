import { useState } from 'react';
import './Navbar.css';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, logout } from '../../http/authApi';
import { LeftMenu } from '../admin/LeftMenu';
import MaskedInput from 'react-text-mask'; 

export const NavBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuth = useSelector((state) => state.auth.auth);

  const user = useSelector((state) => state.private.user);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const Auth = async () => {
    const data = await login(removeNonNumeric(phone), password);
    if (typeof data === 'object') {
      navigate('/PrivatePage');
      dispatch({ type: 'authStatus', paylods: true });
    }
  };

  const Logout = async () => {
    if (window.confirm("Вы уверены, что хотите выйти?")) {
        dispatch({type: 'authStatus', payload: false});
        await logout();
        navigate('/web')
    }
};

  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuOpen = () => {
    setMenuOpen(true);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  const ClickEnter = () =>{
    !menuOpen && setMenuOpen(true)
  }

  const phoneMask = [
    '+',
    '3',
    '7',
    '5',
    '(',
    /[0-9]/,
    /\d/,
    ')',
    ' ',
    /\d/,
    /\d/,
    /\d/,
    '-',
    /\d/,
    /\d/,
    '-',
    /\d/,
    /\d/
  ];

  const removeNonNumeric = (phoneNumber) => phoneNumber.replace(/[^0-9+]/g, '');

  return (
    <nav className="navbar">
      <LeftMenu />
      <div className="navbar__left">
        <span
          className="navbar__title"
          onClick={isAuth&&user.role==='ADMIN' ? () => dispatch({ type: 'showLeftMenu' }) : null}
        >
          LINK
        </span>
      </div>

      <div className="navbar__right">
        <div
          className="nav-button-container"
          onMouseEnter={handleMenuOpen}
          onMouseLeave={handleMenuClose}
          onClick={()=>ClickEnter()}
        >
          <button
            className="navbar__profile"
          >
            <i className="bi bi-person-fill"></i>мой профиль{' '}
            <i className="bi bi-chevron-down"></i>
          </button>
          {menuOpen && (
            <>
              {isAuth ? (
                <div className="navbar__menu">
                  <div
                    className="navbar__menu-item"
                    style={{ fontSize: 11, marginBottom: 10 }}
                    onClick={() => navigate('/PrivatePage')}
                  >
                    {user.FIO}
                  </div>
                  <div
                    className="navbar__menu-item"
                    onClick={() => Logout()}
                  >
                    <i className="bi bi-box-arrow-right"></i> выйти
                  </div>
                </div>
              ) : (
                <div className="navbar__menu" style={{padding: '20px 10px', width: '200px'}}>
                  
                   <MaskedInput
                   style={{width: "100%"}}
                    mask={phoneMask}
                    className="my-input-class" // apply this css class
                    placeholder="логин"
                    showMask
                    guide={false}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <input
                  style={{width: "100%", marginTop: 5}}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="пароль"
                  />
                 
                  <button
                    className="buttonForm buttonForm1"
                    style={{ height: 30, marginTop: 10 }}
                    onClick={() => Auth()}
                  >
                    Войти
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};