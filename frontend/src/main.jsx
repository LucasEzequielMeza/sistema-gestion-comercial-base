import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './Context/ContextoAutorizacion.jsx'
import { ProductoProvider } from './Context/ContextoProductos.jsx'
import { StockProvider } from './Context/ContextoStock.jsx'
import { VentasProvider } from './Context/ContextoVentas.jsx'
import { ProveedorProvider } from './Context/ContextoProveedores.jsx'
import { CategoriaProvider} from './Context/ContextoCategorias.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProductoProvider>
          <StockProvider>
            <VentasProvider>
              <ProveedorProvider>
                <CategoriaProvider>
                 <App />
                </CategoriaProvider>
              </ProveedorProvider>
            </VentasProvider>
          </StockProvider>
        </ProductoProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)