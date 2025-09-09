import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage/HomePage";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Perfil from "./pages/Perfil/Perfil";
import PerfilCRUD from "./pages/Perfil/PerfilCRUD";
import Suscripcion from "./pages/Suscripcion/Suscripcion";


import "./App.css";

function App() {
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/perfil-crud" element={<PerfilCRUD />} />
        <Route path="/suscripcion" element={<Suscripcion />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/login" element={<Login/>} />

      </Routes>
    </Router>
  );
}

export default App;
