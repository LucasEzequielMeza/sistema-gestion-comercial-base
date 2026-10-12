import { createContext, useContext, useState } from 'react';
import axios from '../Api/axios';

const ContextoVentas = createContext();

export function VentasProvider({ children }) {
    const [ventas, setVentas] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    // Consulto las ventas y aplico los filtros que me envíen.
    const obtenerVentas = async (filtros = {}) => {
        try {
            setCargando(true);
            setError('');

            const parametros = Object.fromEntries(
                Object.entries(filtros).filter(
                    ([, valor]) => valor !== '' && valor !== null && valor !== undefined
                )
            );

            const respuesta = await axios.get('/ventas', {
                params: parametros
            });

            setVentas(respuesta.data);
            return respuesta.data;
        } catch (error) {
            const mensaje = error.response?.data?.message ||
                'No se pudieron obtener las ventas';

            setError(mensaje);
            throw error;
        } finally {
            setCargando(false);
        }
    };

    // Busco una venta puntual para mostrar su detalle.
    const obtenerVentaPorId = async (id) => {
        try {
            setError('');

            const respuesta = await axios.get(`/ventas/${id}`);

            return respuesta.data;
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'No se pudo obtener el detalle de la venta'
            );

            throw error;
        }
    };

    // Registro una venta con sus productos y pagos.
    const crearVenta = async (datosVenta) => {
        try {
            setError('');

            const respuesta = await axios.post('/ventas', datosVenta);

            await obtenerVentas();

            return respuesta.data;
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'No se pudo registrar la venta'
            );

            throw error;
        }
    };

    // Anulo la venta y actualizo el historial.
    const anularVenta = async (id) => {
        try {
            setError('');

            const respuesta = await axios.put(`/ventas/${id}/anular`);

            await obtenerVentas();

            return respuesta.data;
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'No se pudo anular la venta'
            );

            throw error;
        }
    };

    return (
        <ContextoVentas.Provider
            value={{
                ventas,
                cargando,
                error,
                obtenerVentas,
                obtenerVentaPorId,
                crearVenta,
                anularVenta
            }}
        >
            {children}
        </ContextoVentas.Provider>
    );
}

export function useVentas() {
    return useContext(ContextoVentas);
}