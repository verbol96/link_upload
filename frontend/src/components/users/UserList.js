import { useEffect, useState } from 'react';
import { $host } from '../../http';
import './styleUsers.css';
import { OneUser } from './OneUser';

export const UserList = () => {
    const [users, setUsers] = useState([]);
    const [sortKey, setSortKey] = useState('default');
    const [role, setRole] = useState('все');
    const [search, setSearch] = useState('');

    useEffect(()=>{
        async function getUsersList() {
            const { data } = await $host.get('api/auth/getUsers');
            setUsers(data.sort((b, a) => (a.createdAt || "").localeCompare(b.createdAt || "")));
        }
        getUsersList();
    }, []);

    const handleSortChange = (e) => {
        setSortKey(e.target.value);
    };

    const handleRoleChange = (e) => {
        setRole(e.target.value);
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    const sortUsers = (users, sortKey) => {
        switch (sortKey) {
            case 'имя':
                return users.sort((a, b) => (a.FIO || "").localeCompare(b.FIO || ""));
            case 'номер':
                return users.sort((a, b) => (a.phone || "").localeCompare(b.phone || ""));
            case 'город':
                return users.sort((a, b) => (a.city || "").localeCompare(b.city || ""));
            case 'заказ':
                return users.sort((b, a) => (a.orderCount || 0) - (b.orderCount || 0));
            case 'сумма':
                return users.sort((b, a) => (a.totalOrderSum || 0) - (b.totalOrderSum || 0));
            case 'дата':
                return users.sort((b, a) => (a.createdAt || "").localeCompare(b.createdAt || ""));
            default:
                return users;
        }
    };

    const sortedAndFilteredUsers = sortUsers([...users]
        .filter(user => {
            if (role !== 'ADMIN') return true;
            return user.role === 'ADMIN';
        })
        .filter((user) => {
            const data = user.FIO + user.phone + user.city;
            return data.toLowerCase().includes(search.toLowerCase());
        }), sortKey);

        console.log(users)

    return (
        <div className='usersMain'>
            <div className='usersMenu'>
                <button><i style={{color: 'white'}} className="bi bi-people"></i> {sortedAndFilteredUsers.length}</button>
                <select onChange={handleRoleChange}>
                    <option value="все">все</option>
                    <option value="ADMIN">админы</option>
                </select>
                <select onChange={handleSortChange}>
                    <option value="имя">по имени</option>
                    <option value="номер">по номеру</option>
                    <option value="город">по городу</option>
                    <option value="заказ">по заказам</option>
                    <option value="сумма">по сумме</option>
                    <option value="дата">по дате добавления</option>
                </select>
                <input placeholder='поиск...' onChange={handleSearchChange} />
            </div>

            <div className='usersList'>
                {sortedAndFilteredUsers.map((user) => <OneUser key={user.id} user={user} />)}
            </div>
        </div>
    );
}