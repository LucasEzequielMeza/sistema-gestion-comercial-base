import { useState } from 'react'
import {Routes, Route, Navigate, useLocation} from 'react-router-dom'
import RegisterPage from './Pages/RegisterPage'
import LoginPage from './Pages/LoginPage'
import DashboardPage from './Pages/DashboardPage'
import ProductosPage from './Pages/ProductosPage'
import StockPage from './Pages/StockPage'
import ProductosForm from './Components/productos/ProductosForm'
import ProductosDetalle from './Components/productos/ProductosDetalle'
import StockDetalle from './Components/stock/StockDetalle'
import Navbar from './Components/navbar/Navbar'
import Container from './Components/UI/Container'
import RutaProtegida from './Components/autorizacion/RutaProtegida'
import ProductosInactivosPage from './Pages/ProductosInactivosPage'
import MovimientosStockPage from './Pages/MovimientosStockPage'
import ComprasPage from './Pages/ComprasPage'
import ComprasForm from './Components/compras/ComprasForm'
import VentasPage from './Pages/VentasPage'
import VentasForm from './Components/ventas/VentaForm'
import VentasDetalle from './Components/ventas/VentaDetalle'
import ProveedoresPage from './Pages/ProveedoresPage'
import ProveedoresForm from './Components/proveedores/ProveedoresForm'
import CategoriasPage from './Pages/CategoriasPage'
import CategoriasForm from './Components/categorias/CategoriasForm'

function App() {

    const [menuAbierto, setMenuAbierto] = useState(true)
    const location = useLocation()

    const esPaginaAutenticacion = location.pathname === "/iniciar-sesion" || location.pathname === "/registro"

    return (
        <>
            {!esPaginaAutenticacion && (
                <Navbar
                    menuAbierto={menuAbierto}
                    setMenuAbierto={setMenuAbierto}
                />
            )}

            <main
                className={
                    esPaginaAutenticacion
                        ? "min-h-screen bg-white"
                        : `min-h-screen bg-white transition-all duration-300 ${
                            menuAbierto
                                ? "pt-[330px] md:pt-0 md:ml-64"
                                : "pt-14 md:pt-0 md:ml-20"
                        }`
                }
            >
                <Container>
                    <Routes>
                        {/* Autenticación */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />}/>
                        <Route path="/iniciar-sesion" element={<LoginPage />}/>
                        <Route path="/registro" element={<RegisterPage />}/>

                        {/* Compatibilidad con la ruta anterior */}
                        <Route path="/register" element={<Navigate to="/registro" replace />}/>

                        <Route element={<RutaProtegida />}>
                            {/* Dashboard */}
                            <Route path="/panel-de-control" element={<DashboardPage />}/>

                            {/* Productos */}
                            <Route path="/productos" element={<ProductosPage />}/>
                            <Route path="/productos/nuevo" element={<ProductosForm />}/>
                            <Route path="/productos/:id/edit" element={<ProductosForm />}/>
                            <Route path="/producto/detalle/:id" element={<ProductosDetalle />}/>
                            <Route path="/productos/inactivos" element={<ProductosInactivosPage />}/>

                            {/* Stock */}
                            <Route path="/stock" element={<StockPage />}/>
                            <Route path="/stock/detalle/:id" element={<StockDetalle menuAbierto={menuAbierto} />}/>
                            <Route path="/stock/movimientos" element={<MovimientosStockPage />}/>

                            {/* Compras */}
                            <Route path="/compras" element={<ComprasPage />}/>
                            <Route path="/compras/crear" element={<ComprasForm />}/>

                            {/* Ventas */}
                            <Route path="/ventas" element={<VentasPage />}/>
                            <Route path="/ventas/nueva" element={<VentasForm />}/>
                            <Route path="/ventas/:id" element={<VentasDetalle />}/>

                            {/*Proveedores */}
                            <Route path='/proveedores' element={<ProveedoresPage />}/>
                            <Route path='/proveedores/nuevo' element={<ProveedoresForm/>}/>

                            {/*Categorias */}
                            <Route path='/categorias' element={<CategoriasPage />}/>
                            <Route path='/categorias/nuevo' element={<CategoriasForm/>}/>

                            {/* Ruta inexistente */}
                            <Route path="*" element={<Navigate to="/dashboard" replace />}/>
                        </Route>
                    </Routes>
                </Container>
            </main>
        </>
    )
}

export default App