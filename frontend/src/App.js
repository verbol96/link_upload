import { BrowserRouter } from 'react-router-dom'
import AppRouter from './routes/AppRouter';
import { Toaster } from 'sonner';
import { TitleManager } from './components/TitleManager';

function App() {
  return (
    <BrowserRouter>
      <TitleManager />
      <AppRouter />
      <Toaster />
    </BrowserRouter>
  );
}

export default App;