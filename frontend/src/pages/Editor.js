import Footer from "../components/admin/Footer";
import { NavBar } from "../components/admin/NavBar";
import EditMain from "../components/editior/EditMain";

const Editor = () => {
 
  return (
    <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
      <NavBar />

      <EditMain /> 

      <div style={{marginTop: 'auto'}}>
        <Footer />
      </div>
    </div>
  );
}

export default Editor;