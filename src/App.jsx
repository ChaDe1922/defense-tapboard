import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './lib/GameContext';
import Layout from './components/Layout';
import LiveEntry from './pages/LiveEntry';
import Dashboard from './pages/Dashboard';
import Setup from './pages/Setup';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<LiveEntry />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/setup" element={<Setup />} />
          </Route>
        </Routes>
      </GameProvider>
    </BrowserRouter>
  );
}
