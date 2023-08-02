import React from 'react';
import './Footer.css'; // импортируем файл стилей

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">

        <div>
          <div className="footer-links">
            <div>
                <label>Контакты для связи: </label>
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
                <label><i className="bi bi-c-circle"></i> LINK 2023</label>
            </div>
        </div>
       
      </div>
    </footer>
  );
}

export default Footer;