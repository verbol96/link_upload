import {BrowserRouter} from 'react-router-dom'
import AppRouter from './pages/AppRouter';
import { Toaster } from './ui/toaster';

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
