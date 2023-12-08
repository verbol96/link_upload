
import Footer from "../components/admin/Footer";
import { NavBarAdmin } from "../components/admin/NavBarAdmin";
import EditMain from "../components/editior2/EditMain";



const Editor2 = () => {
 

  return (
    <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
      <NavBarAdmin />

      <EditMain /> 

      <div style={{marginTop: 'auto'}}>
        <Footer />
      </div>
    </div>
  );
}

export default Editor2;