import {BrowserRouter} from 'react-router-dom'
import AppRouter from './pages/AppRouter';
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
