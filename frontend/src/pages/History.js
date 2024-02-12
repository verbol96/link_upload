import Footer from "../components/admin/Footer";
import { NavBar } from '../components/admin/NavBar';

const History = () => {

    return (
        <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            <NavBar />
            
            <div style={{display: 'flex', justifyContent: 'center', color: '#116466', margin: 20, fontSize: 25}}>История обновлений</div>
            
            <div style={{margin: 20}}>
                <div style={{fontSize: 18, marginLeft: 50, marginBottom: 10, color: '#116466'}}>version 4.1 (12.02.2024)</div>
                <ul>
                    <li>изменена страница "клиенты"</li>
                    <li>испавлено отображение времени заказов</li>
                    <li>добавлена проверка на пустой файл при загрузке</li>
                    <li>добавлена отправка "1 класс" в форму</li>
                    <li>добавлено смс об ошибке</li>
                    <li>полное отображение прочего в ЛК</li>
                    <li>исправлено редактирование узких фото</li>
                    <li>добавлена страница 'история'</li>

                </ul>
            </div>

            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    )
}

export default History;