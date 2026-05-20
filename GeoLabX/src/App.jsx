import { HashRouter, Routes, Route } from 'react-router-dom';
import { DarkModeProvider } from './components/Navbar';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TriaxialTest from './pages/TriaxialTest';
import MohrCircle from './pages/MohrCircle';
import UCSTest from './pages/UCS';
import SoilClassification from './pages/SoilClassification';

export default function App() {
  return (
    <DarkModeProvider>
      <ToastProvider>
        <HashRouter>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/triaxial" element={<TriaxialTest />} />
                <Route path="/mohr" element={<MohrCircle />} />
                <Route path="/ucs" element={<UCSTest />} />
                <Route path="/classification" element={<SoilClassification />} />
              </Routes>
            </main>
          </div>
        </HashRouter>
      </ToastProvider>
    </DarkModeProvider>
  );
}
