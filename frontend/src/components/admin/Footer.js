import React from 'react';
import './Footer.css'; // импортируем файл стилей

const Footer = () => {

  const getNowYear = () =>{
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    return currentYear
  }

  return (
    <footer className="footer">
      <div className="footer-content">

        <div>
          <div className="footer-links">
            <div>
                <label>Контакты: </label>
            </div>
            <div>
                <a href="https://www.t.me/link_belarus" target="_blank"  rel="noopener noreferrer"><i className="bi bi-telegram"></i>  Telegram</a>
            </div>
            <div>
                <a href="https://www.instagram.com/link.belarus" target="_blank"  rel="noopener noreferrer"><i className="bi bi-instagram"></i> Instagram</a>
            </div>
          </div>
        </div>
        <div className="footer-links">
            <div>
                <label><i className="bi bi-c-circle"></i> LINK {getNowYear()}</label>
            </div>
        </div>
       
      </div>
    </footer>
  );
}

export default Footer;