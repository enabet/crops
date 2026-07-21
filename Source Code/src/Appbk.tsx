import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import CropsPage from "./pages/CropsPage";
import CropDetailPage from "./pages/CropDetailPage";
import FarmsPage from './pages/FarmsPage'
import { useAuth } from './context/AuthContext'

function Protected({children}:{children:React.ReactNode}){
  const {user,loading}=useAuth()
  if(loading) return <div className="center">Loading…</div>
  return user?children:<Navigate to="/login" replace/>
}

export default function App(){
  return <Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/crops" element={<CropsPage />} />
    <Route path="/crops/:id" element={<CropDetailPage />} />
    <Route path="/farms" element={<Protected><FarmsPage/></Protected>}/>
    <Route path="*" element={<Navigate to="/farms" replace/>}/>
  </Routes>
}
