import './SearchBarMain.css'

const SearchBarMain = ({ users, phone, setPhone, modalVisibleMain, setModalVisibleMain, setFIO, setTypePost, setCity,setAdress,setPostCode,setRaion,setOblast }) => {


  const handleItemClick = (user) => {
    setPhone(user.phone)
    setFIO(user.FIO)
    setTypePost(user.typePost)
    setCity(user.city)
    setAdress(user.adress)
    setPostCode(user.postCode)
    setRaion(user.raion)
    setOblast(user.oblast)
    setModalVisibleMain(false);
  };
 
  const filteredUsers = users.filter(user => {
    const userPhone = user.phone ? user.phone.toLowerCase() : '';
    const userFIO = user.FIO ? user.FIO.toLowerCase() : '';

    return (userPhone + userFIO).includes(phone);
  });

  return (
    <>
        {modalVisibleMain?
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

export default SearchBarMain;