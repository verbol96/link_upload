import Footer from "../components/admin/Footer";
import { NavBar } from "../components/admin/NavBar";
//import Redactor from "../components/photoEditor/Redactor";
import Redactor from "../components/photoRedactor/Redactor";

const RedactorPhoto = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <NavBar />
      <Redactor />

       <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
    </div>
  );
}

export default RedactorPhoto;