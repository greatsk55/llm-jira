import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Board from './pages/Board';
import Releases from './pages/Releases';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Board />} />
          <Route path="releases" element={<Releases />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
