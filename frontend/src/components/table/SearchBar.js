import './SearchBar.css'

const SearchBar = ({ users, phoneUser, setPhoneUser, modalVisible, setModalVisible }) => {


  const handleItemClick = (user) => {
    setPhoneUser(user.phone)
    setModalVisible(false);
  };

  const filteredUsers = users.filter(user => {
    const userPhone = user.phone ? user.phone.toLowerCase() : '';
    const userFIO = user.FIO ? user.FIO.toLowerCase() : '';

    return (userPhone + userFIO).includes(phoneUser);
  });

  return (
    <>
        {modalVisible?
            <div className="modalSearch">
                <ul className='ul_style'>
                {filteredUsers.map(user => (
                    <li  className='li_style' key={user.phone} onClick={() => handleItemClick(user)}>
                        <div><i className="bi bi-telephone"></i> {user.phone}</div>
                        <div><i className="bi bi-person"></i> {user.FIO}</div>
                        <div><i className="bi bi-house"></i> {user.city}</div>
                    </li>
                ))}
                </ul>
             </div>
        :null}
    </>
        
  );
};

export default SearchBar;