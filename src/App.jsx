import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ToastContainer, useToast } from './hooks/useToast.jsx'
import Dashboard from './pages/Dashboard'
import TriaxialTest from './pages/TriaxialTest'
import MohrCircle from './pages/MohrCircle'
import UCSTest from './pages/UCSTest'
import SoilClassification from './pages/SoilClassification'
import FieldToLab from './pages/FieldToLab'
import Layout from './components/Layout'

function AppContent() {
  const { toasts, addToast, removeToast } = useToast()

  return (
    <Layout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/triaxial" element={<TriaxialTest />} />
        <Route path="/mohr" element={<MohrCircle />} />
        <Route path="/ucs" element={<UCSTest />} />
        <Route path="/classification" element={<SoilClassification />} />
        <Route path="/field-lab" element={<FieldToLab />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  )
}
