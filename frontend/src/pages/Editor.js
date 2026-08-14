import { NavBar } from "../components/admin/NavBar";
import EditMain from "../components/editior/EditMain";
//import Redactor from "../components/photoRedactor/Redactor";

const Editor = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <NavBar />
      {/*<Redactor /> */}
      <EditMain />
    </div>
  );
}

export default Editor;