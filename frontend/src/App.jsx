import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage/HomePage";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Perfil from "./pages/Perfil/Perfil";
import PerfilRegistro from "./pages/Perfil/PerfilRegistro";
import Suscripcion from "./pages/Suscripcion/Suscripcion";
import Registro from "./pages/Suscripcion/Registro";


import "./App.css";

function App() {
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/perfil-registro" element={<PerfilRegistro />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/suscripcion" element={<Suscripcion />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/login" element={<Login/>} />

      </Routes>
    </Router>
  );
}

export default App;
