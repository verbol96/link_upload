import { getOneUser } from '../../http/dbApi';
import './SearchBarMain.css'

const SearchBarMain = ({ users, phone, setPhone, modalVisibleMain, setModalVisibleMain, setFIO, setTypePost, setCity,setAdress,setPostCode,setRaion,setOblast }) => {


  const handleItemClick = async(user) => { 
    const data = await getOneUser(user.phone) 
    setPhone(user.phone)
    setFIO(user.FIO)
    setTypePost(data.user.typePost)
    setCity(data.user.city)
    setAdress(data.user.adress)
    setPostCode(data.user.postCode)
    setRaion(data.user.raion)
    setOblast(data.user.oblast)
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
                    </li>
                ))}
                </ul>
             </div>
        :null}
    </>
        
  );
};

export default SearchBarMain;