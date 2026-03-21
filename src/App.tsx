import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Welcome from './pages/Welcome'
import PropertySetup from './pages/PropertySetup'
import PropertyDetail from './pages/PropertyDetail'
import InspectionUpload from './pages/InspectionUpload'
import InspectionAnalysis from './pages/InspectionAnalysis'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/welcome" element={
        <PrivateRoute><Welcome /></PrivateRoute>
      } />
      <Route path="/dashboard" element={
        <PrivateRoute><Dashboard /></PrivateRoute>
      } />
      <Route path="/property/:propertyId" element={
        <PrivateRoute><PropertyDetail /></PrivateRoute>
      } />
      <Route path="/property/:propertyId/setup" element={
        <PrivateRoute><PropertySetup /></PrivateRoute>
      } />
      <Route path="/inspection/:inspectionId/upload" element={
        <PrivateRoute><InspectionUpload /></PrivateRoute>
      } />
      <Route path="/inspection/:inspectionId/analysis" element={
        <PrivateRoute><InspectionAnalysis /></PrivateRoute>
      } />
    </Routes>
  )
}