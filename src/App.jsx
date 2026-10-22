import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SesionProvider } from "./context/SesionContext";
import { StaffSesionProvider } from "./context/StaffSesionContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Acceso from "./pages/Acceso";
import Solicitud from "./pages/Solicitud";
import StaffLogin from "./pages/StaffLogin";
import AdminSolicitudes from "./pages/AdminSolicitudes";
import AdminAlumnos from "./pages/AdminAlumnos";
import AdminBugs from "./pages/AdminBugs";
import AlumnoLogin from "./pages/AlumnoLogin";
import AlumnoDashboard from "./pages/AlumnoDashboard";
import Recarga from "./pages/Recarga";
import Camionero from "./pages/Camionero";
import NotFound from "./pages/NotFound";
import FAQ from "./pages/FAQ";
import Contabilidad from "./pages/Contabilidad";
import Recaudacion from "./pages/Recaudacion";
import Transportistas from "./pages/Transportistas";
import AdminPersonal from "./pages/AdminPersonal";
import RecuperarPassword from "./pages/RecuperarPassword";
import RestablecerPassword from "./pages/RestablecerPassword";

export default function App() {
  return (
    <SesionProvider>
      <StaffSesionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/acceso" element={<Acceso />} />
            <Route path="/recuperar" element={<RecuperarPassword />} />
            <Route path="/restablecer" element={<RestablecerPassword />} />
            <Route path="/solicitud" element={<Solicitud />} />
            <Route path="/ayuda" element={<FAQ />} />
            <Route path="/personal" element={<ProtectedRoute roles={["recaudacion","ventanilla","camionero","desarrollo_social","admin_transportistas"]}><AdminPersonal /></ProtectedRoute>} />
            <Route path="/faq" element={<FAQ />} />

            {/* Alumno */}
            <Route path="/alumno/login" element={<AlumnoLogin />} />
            <Route path="/alumno" element={<AlumnoDashboard />} />

            {/* Recaudación */}
            <Route path="/admin/login" element={<StaffLogin rol="desarrollo_social" />} />
            <Route path="/desarrollo/login" element={<StaffLogin rol="desarrollo_social" />} />
            <Route path="/recaudacion/login" element={<StaffLogin rol="recaudacion" />} />
            <Route
              path="/admin/solicitudes"
              element={
                <ProtectedRoute rol="desarrollo_social" loginPath="/admin/login">
                  <AdminSolicitudes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/alumnos"
              element={
                <ProtectedRoute roles={["desarrollo_social", "recaudacion"]} loginPath="/acceso">
                  <AdminAlumnos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bugs"
              element={
                <ProtectedRoute roles={["desarrollo_social", "recaudacion"]} loginPath="/acceso">
                  <AdminBugs />
                </ProtectedRoute>
              }
            />

            {/* Recaudación (reportes que antes veía contabilidad) */}
            <Route path="/recaudacion/login" element={<StaffLogin rol="recaudacion" />} />
            <Route
              path="/recaudacion"
              element={
                <ProtectedRoute rol="recaudacion" loginPath="/recaudacion/login">
                  <Recaudacion />
                </ProtectedRoute>
              }
            />
            <Route path="/contabilidad/login" element={<StaffLogin rol="recaudacion" />} />
            <Route
              path="/contabilidad"
              element={
                <ProtectedRoute rol="recaudacion" loginPath="/recaudacion/login">
                  <Recaudacion />
                </ProtectedRoute>
              }
            />
            {/* Admin transportistas */}
            <Route path="/transportistas/login" element={<StaffLogin rol="admin_transportistas" />} />
            <Route
              path="/transportistas"
              element={
                <ProtectedRoute rol="admin_transportistas" loginPath="/transportistas/login">
                  <Transportistas />
                </ProtectedRoute>
              }
            />

            {/* Ventanilla de recargas */}
            <Route path="/recarga/login" element={<StaffLogin rol="ventanilla" />} />
            <Route
              path="/recarga"
              element={
                <ProtectedRoute rol="ventanilla" loginPath="/recarga/login">
                  <Recarga />
                </ProtectedRoute>
              }
            />

            {/* Operador / camionero */}
            <Route path="/camionero/login" element={<StaffLogin rol="camionero" />} />
            <Route
              path="/camionero"
              element={
                <ProtectedRoute rol="camionero" loginPath="/camionero/login">
                  <Camionero />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StaffSesionProvider>
    </SesionProvider>
  );
}
