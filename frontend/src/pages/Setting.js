import { useState } from 'react';
import Footer from "../components/admin/Footer";
import OtherSettings from "../components/settings/OtherSettings";
import { Pricing } from "../components/settings/Pricing";
import './SettingsPage.css';
import { NavBar } from '../components/admin/NavBar';
import LogsUser from '../components/settings/LogsUser';

const Setting = () => {
    const [activeTab, setActiveTab] = useState(0);

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
                    Настройки цены
                </button>
                <button
                    onClick={() => handleClick(1)}
                    className={activeTab === 1 ? 'active' : ''}
                >
                    Другие настройки
                </button>
                <button
                    onClick={() => handleClick(2)}
                    className={activeTab === 2 ? 'active' : ''}
                >
                    Логи
                </button>
            </div>
        );
    };

    return (
        <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            <NavBar />
            
            <ToggleButtonGroup />

            {activeTab === 0 && <Pricing />}
            {activeTab === 1 && <OtherSettings />}
            {activeTab === 2 && <LogsUser />}
            
            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    )
}

export default Setting;