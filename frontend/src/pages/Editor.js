
import Footer from "../components/admin/Footer";
import { NavBarAdmin } from "../components/admin/NavBarAdmin";
import EditorMain from "../components/editor/EditorMain";



const Editor = () => {
 

  return (
    <div style={{display: 'flex', flexDirection: 'column',background: '#dbdbdb', minHeight: '100vh'}}>
      <NavBarAdmin />

      <EditorMain />

      <div style={{marginTop: 'auto'}}>
        <Footer />
      </div>
    </div>
  );
}

export default Editor;