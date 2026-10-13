import { createContext, useContext, useState } from 'react'
import axios from '../Api/axios.js'

const ContextoCategoria = createContext()

export const useCategorias = () => {
    const contexto = useContext(ContextoCategoria)

    if (!contexto) {
        throw new Error('useCategorias debe utilizarse dentro de CategoriaProvider')
    }

    return contexto
}

export const CategoriaProvider = ({ children }) => {
    const [categorias, setCategorias] = useState([])
    const [categoriasInactivas, setCategoriasInactivas] = useState([])
    const [categoria, setCategoria] = useState(null)
    const [categoriaError, setCategoriaError] = useState([])
    const [cargando, setCargando] = useState(false)

    const limpiarCategoriaError = () => {
        setCategoriaError([])
    }

    const obtenerCategorias = async () => {
        setCargando(true)
        limpiarCategoriaError()

        try {
            const respuesta = await axios.get('/categorias')
            const categoriasRecibidas = Array.isArray(respuesta.data) ? respuesta.data : []

            setCategorias(categoriasRecibidas.filter((categoriaItem) => categoriaItem.activo === true))
            setCategoriasInactivas(categoriasRecibidas.filter((categoriaItem) => categoriaItem.activo === false))

            return categoriasRecibidas
        } catch (error) {
            const mensaje = error.response?.data?.message || 'No se pudieron obtener las categorías.'
            setCategoriaError([mensaje])
            return null
        } finally {
            setCargando(false)
        }
    }

    const obtenerCategoriaPorId = async (id) => {
        setCargando(true)
        limpiarCategoriaError()

        try {
            const respuesta = await axios.get(`/categorias/${id}`)
            setCategoria(respuesta.data)
            return respuesta.data
        } catch (error) {
            const mensaje = error.response?.data?.message || 'No se pudo obtener la categoría.'
            setCategoriaError([mensaje])
            return null
        } finally {
            setCargando(false)
        }
    }

    const crearCategoria = async (datosCategoria) => {
        setCargando(true)
        limpiarCategoriaError()

        try {
            const respuesta = await axios.post('/categorias', datosCategoria)
            const categoriaCreada = respuesta.data.categoria

            if (categoriaCreada.activo === false) {
                setCategoriasInactivas((categoriasActuales) => [...categoriasActuales, categoriaCreada])
            } else {
                setCategorias((categoriasActuales) => [...categoriasActuales, categoriaCreada])
            }

            return categoriaCreada
        } catch (error) {
            const mensaje = error.response?.data?.message || 'No se pudo crear la categoría.'
            setCategoriaError([mensaje])
            return null
        } finally {
            setCargando(false)
        }
    }

    const actualizarCategoria = async (id, datosCategoria) => {
        setCargando(true)
        limpiarCategoriaError()

        try {
            const respuesta = await axios.put(`/categorias/${id}`, datosCategoria)
            const categoriaActualizada = respuesta.data.categoria

            setCategorias((categoriasActuales) => categoriasActuales.filter((categoriaItem) => categoriaItem.id !== id))
            setCategoriasInactivas((categoriasActuales) => categoriasActuales.filter((categoriaItem) => categoriaItem.id !== id))

            if (categoriaActualizada.activo === false) {
                setCategoriasInactivas((categoriasActuales) => [...categoriasActuales, categoriaActualizada])
            } else {
                setCategorias((categoriasActuales) => [...categoriasActuales, categoriaActualizada])
            }

            setCategoria(categoriaActualizada)
            return categoriaActualizada
        } catch (error) {
            const mensaje = error.response?.data?.message || 'No se pudo actualizar la categoría.'
            setCategoriaError([mensaje])
            return null
        } finally {
            setCargando(false)
        }
    }

    const buscarCategorias = async (texto) => {
        limpiarCategoriaError()

        try {
            const respuesta = await axios.get(`/categorias/buscar?search=${encodeURIComponent(texto)}`)
            return Array.isArray(respuesta.data) ? respuesta.data : []
        } catch (error) {
            const mensaje = error.response?.data?.message || 'No se pudieron buscar las categorías.'
            setCategoriaError([mensaje])
            return null
        }
    }

    const desactivarCategoria = async (id) => {
        setCargando(true)
        limpiarCategoriaError()

        try {
            const respuesta = await axios.put(`/categorias/${id}/desactivar`)
            const categoriaActualizada = respuesta.data.categoria

            setCategorias((categoriasActuales) => categoriasActuales.filter((categoriaItem) => categoriaItem.id !== id))
            setCategoriasInactivas((categoriasActuales) => [
                ...categoriasActuales.filter((categoriaItem) => categoriaItem.id !== id),
                categoriaActualizada
            ])

            return categoriaActualizada
        } catch (error) {
            const mensaje = error.response?.data?.message || 'No se pudo desactivar la categoría.'
            setCategoriaError([mensaje])
            return null
        } finally {
            setCargando(false)
        }
    }

    const activarCategoria = async (id) => {
        setCargando(true)
        limpiarCategoriaError()

        try {
            const respuesta = await axios.put(`/categorias/${id}/activar`)
            const categoriaActualizada = respuesta.data.categoria

            setCategoriasInactivas((categoriasActuales) => categoriasActuales.filter((categoriaItem) => categoriaItem.id !== id))
            setCategorias((categoriasActuales) => [
                ...categoriasActuales.filter((categoriaItem) => categoriaItem.id !== id),
                categoriaActualizada
            ])

            return categoriaActualizada
        } catch (error) {
            const mensaje = error.response?.data?.message || 'No se pudo activar la categoría.'
            setCategoriaError([mensaje])
            return null
        } finally {
            setCargando(false)
        }
    }

    const obtenerCategoriasInactivas = async () => {
        const categoriasRecibidas = await obtenerCategorias()

        if (!categoriasRecibidas) {
            return null
        }

        return categoriasRecibidas.filter((categoriaItem) => categoriaItem.activo === false)
    }

    return (
        <ContextoCategoria.Provider
            value={{
                categorias,
                categoriasInactivas,
                categoria,
                categoriaError,
                cargando,
                obtenerCategorias,
                obtenerCategoriaPorId,
                crearCategoria,
                actualizarCategoria,
                buscarCategorias,
                desactivarCategoria,
                activarCategoria,
                obtenerCategoriasInactivas,
                limpiarCategoriaError,
                setCategoria
            }}
        >
            {children}
        </ContextoCategoria.Provider>
    )
}