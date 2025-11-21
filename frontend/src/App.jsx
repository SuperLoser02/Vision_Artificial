import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage/HomePage";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Perfil from "./pages/Perfil/Perfil";
import PerfilRegistro from "./pages/Perfil/PerfilRegistro";
import PerfilEditar from "./pages/Perfil/PerfilEditar";
import MiPerfil from "./pages/Perfil/MiPerfil";
import Suscripcion from "./pages/Suscripcion/Suscripcion";
import Registro from "./pages/Suscripcion/Registro";
import Categorias from "./pages/Categorias/Categorias";
import Zonas from "./pages/Zonas/Zonas";
import Notificaciones from "./pages/Notificaciones/Notificaciones";
import Chat from "./pages/Chat/Chat";
import Metricas from "./pages/Metricas/Metricas";
import Historial from "./pages/Historial/Historial";
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function App() {
  
  return (
    <Router>
      <Routes>
        {/* Rutas públicas - No requieren autenticación */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login/>} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/suscripcion" element={<Suscripcion />} />

        {/* Rutas protegidas - Solo requieren autenticación de empresa */}
        <Route path="/perfil" element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        } />
        <Route path="/perfil-registro" element={
          <ProtectedRoute>
            <PerfilRegistro />
          </ProtectedRoute>
        } />
        <Route path="/perfil-editar/:id" element={
          <ProtectedRoute>
            <PerfilEditar />
          </ProtectedRoute>
        } />
        
        {/* Rutas protegidas - Requieren autenticación de empresa Y perfil activo */}
        <Route path="/dashboard" element={
          <ProtectedRoute requireProfile={true}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/mi-perfil" element={
          <ProtectedRoute requireProfile={true}>
            <MiPerfil />
          </ProtectedRoute>
        } />
        <Route path="/categorias" element={
          <ProtectedRoute requireProfile={true}>
            <Categorias />
          </ProtectedRoute>
        } />
        <Route path="/zonas" element={
          <ProtectedRoute requireProfile={true}>
            <Zonas />
          </ProtectedRoute>
        } />
        <Route path="/notificaciones" element={
          <ProtectedRoute requireProfile={true}>
            <Notificaciones />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute requireProfile={true}>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="/metricas" element={
          <ProtectedRoute requireProfile={true}>
            <Metricas />
          </ProtectedRoute>
        } />
        <Route path="/historial" element={
          <ProtectedRoute requireProfile={true}>
            <Historial />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
