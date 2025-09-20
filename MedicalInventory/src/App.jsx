import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import Login from './Components/Pages/Login';
import Forgot from './Components/Pages/Forgot';
import Password_reset from './Components/Pages/Password_reset';
import AdminLogin from './Components/Pages/AdminLogin';
import CreateNewAccount from './Components/Pages/CreateNewAccount';
import HomePage from './Components/Pages/HomePage';
import DoctorHome from './Components/Pages/DoctorHome';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; 
function App() {
  return (
     <Router>
         <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} closeOnClick pauseOnHover draggable theme="light"/>
        <Routes>
           <Route path='/' element={<Login/>} />
           <Route path='/HomePage' element={<HomePage/>} />
           <Route path='/Forgot' element={<Forgot/>} />
           <Route path='/OtpVerification' element={<Password_reset/>} />
           <Route path='/AdminLogin' element={<AdminLogin/>} />
           <Route path='/CreateNewAccount' element={<CreateNewAccount/>} />
           <Route path='/DoctorHome' element={<DoctorHome/>} />
        </Routes>
     </Router>
  )
}

export default App
