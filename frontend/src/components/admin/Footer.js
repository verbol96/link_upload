import React from 'react';

const Footer = () => {
    const getNowYear = () => new Date().getFullYear();

    const linkCls = "text-[13px] md:text-[14px] text-[#a3a3a3] hover:text-white transition-colors flex items-center gap-1.5";

    return (
        <footer className="bg-[#363636] py-2 px-3 md:px-4 w-full">
            <div className="flex items-center justify-between flex-wrap gap-2">

                {/* Контакты */}
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                    <span className="text-[13px] md:text-[14px] text-[#a3a3a3]">
                        Контакты:
                    </span>

                    <a
                        href="https://www.t.me/link_belarus"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkCls}
                    >
                        <i className="bi bi-telegram" />
                        Telegram
                    </a>

                    <a
                        href="https://www.instagram.com/link.belarus"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkCls}
                    >
                        <i className="bi bi-instagram" />
                        Instagram
                    </a>
                </div>

                {/* Копирайт */}
                <div className="text-[13px] md:text-[14px] text-[#a3a3a3] flex items-center gap-1.5">
                    <i className="bi bi-c-circle" />
                    LINK {getNowYear()}
                </div>
            </div>
        </footer>
    );
};

export default Footer;