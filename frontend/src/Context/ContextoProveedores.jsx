import React, { createContext, useContext, useState } from 'react'
import axios from '../Api/axios.js'

export const ContextoProveedor = createContext()

export const useProveedores = () => {
    const context = useContext(ContextoProveedor)

    if (!context) {
        throw new Error(
            'useProveedores debe utilizarse dentro de ProveedorProvider'
        )
    }

    return context
}

export function ProveedorProvider({ children }) {

    const [proveedores, setProveedores] = useState([])
    const [proveedor, setProveedor] = useState(null)
    const [proveedorError, setProveedorError] = useState([])
    const [cargando, setCargando] = useState(false)
    const [proveedoresInactivos, setProveedoresInactivos] = useState([])

    const obtenerProveedores = async () => {

        try {

            setCargando(true)
            setProveedorError([])

            const respuesta = await axios.get('/proveedores')

            const proveedoresActivos = respuesta.data.filter(
                (proveedorItem) => proveedorItem.activo
            )

            setProveedores(proveedoresActivos)

            setProveedoresInactivos(
                respuesta.data.filter(
                    (proveedorItem) => !proveedorItem.activo
                )
            )

            return respuesta.data

        } catch (error) {

            console.error('Error al obtener los proveedores:', error)

            setProveedorError([
                error.response?.data?.message ||
                'Error al obtener los proveedores'
            ])

            return null

        } finally {

            setCargando(false)

        }

    }

    const obtenerProveedorPorId = async (id) => {

        try {

            setProveedorError([])

            const respuesta = await axios.get(`/proveedores/${id}`)

            setProveedor(respuesta.data)

            return respuesta.data

        } catch (error) {

            console.error('Error al obtener el proveedor:', error)

            setProveedor(null)

            setProveedorError([
                error.response?.data?.message ||
                'Error al obtener el proveedor'
            ])

            return null

        }

    }

    const crearProveedor = async (data) => {

        try {

            setProveedorError([])

            const respuesta = await axios.post('/proveedores', data)

            const proveedorCreado = respuesta.data.proveedor

            if (proveedorCreado.activo) {
                setProveedores((proveedoresActuales) => [
                    ...proveedoresActuales,
                    proveedorCreado
                ])
            } else {
                setProveedoresInactivos((proveedoresActuales) => [
                    ...proveedoresActuales,
                    proveedorCreado
                ])
            }

            return proveedorCreado

        } catch (error) {

            console.error('Error al crear el proveedor:', error)

            setProveedorError([
                error.response?.data?.message ||
                'Error al crear el proveedor'
            ])

            return null

        }

    }

    const actualizarProveedor = async (id, data) => {

        try {

            setProveedorError([])

            const respuesta = await axios.put(
                `/proveedores/${id}`,
                data
            )

            const proveedorActualizado = respuesta.data.proveedor

            setProveedores((proveedoresActuales) =>
                proveedoresActuales.filter(
                    (proveedorItem) => proveedorItem.id !== id
                )
            )

            setProveedoresInactivos((proveedoresActuales) =>
                proveedoresActuales.filter(
                    (proveedorItem) => proveedorItem.id !== id
                )
            )

            if (proveedorActualizado.activo) {
                setProveedores((proveedoresActuales) => [
                    ...proveedoresActuales,
                    proveedorActualizado
                ])
            } else {
                setProveedoresInactivos((proveedoresActuales) => [
                    ...proveedoresActuales,
                    proveedorActualizado
                ])
            }

            setProveedor((proveedorActual) =>
                proveedorActual?.id === proveedorActualizado.id
                    ? {
                        ...proveedorActual,
                        ...proveedorActualizado
                    }
                    : proveedorActual
            )

            return proveedorActualizado

        } catch (error) {

            console.error('Error al actualizar el proveedor:', error)

            setProveedorError([
                error.response?.data?.message ||
                'Error al actualizar el proveedor'
            ])

            return null

        }

    }

    const buscarProveedores = async (texto) => {

        try {

            setProveedorError([])

            if (!texto.trim()) {
                return await obtenerProveedores()
            }

            const respuesta = await axios.get(
                `/proveedores/buscar?search=${encodeURIComponent(texto)}`
            )

            return respuesta.data

        } catch (error) {

            console.error('Error al buscar proveedores:', error)

            setProveedorError([
                error.response?.data?.message ||
                'Error al buscar proveedores'
            ])

            return null

        }

    }

    const desactivarProveedor = async (id) => {

        try {

            setProveedorError([])

            const respuesta = await axios.put(
                `/proveedores/${id}/desactivar`
            )

            const proveedorActualizado = respuesta.data.proveedor

            setProveedores((proveedoresActuales) =>
                proveedoresActuales.filter(
                    (proveedorItem) => proveedorItem.id !== id
                )
            )

            setProveedoresInactivos((proveedoresActuales) => [
                ...proveedoresActuales.filter(
                    (proveedorItem) => proveedorItem.id !== id
                ),
                proveedorActualizado
            ])

            setProveedor((proveedorActual) =>
                proveedorActual?.id === proveedorActualizado.id
                    ? proveedorActualizado
                    : proveedorActual
            )

            return proveedorActualizado

        } catch (error) {

            console.error('Error al desactivar el proveedor:', error)

            setProveedorError([
                error.response?.data?.message ||
                'Error al desactivar el proveedor'
            ])

            return null

        }

    }

    const activarProveedor = async (id) => {

        try {

            setProveedorError([])

            const respuesta = await axios.put(
                `/proveedores/${id}/activar`
            )

            const proveedorActualizado = respuesta.data.proveedor

            setProveedoresInactivos((proveedoresActuales) =>
                proveedoresActuales.filter(
                    (proveedorItem) => proveedorItem.id !== id
                )
            )

            setProveedores((proveedoresActuales) => [
                ...proveedoresActuales.filter(
                    (proveedorItem) => proveedorItem.id !== id
                ),
                proveedorActualizado
            ])

            setProveedor((proveedorActual) =>
                proveedorActual?.id === proveedorActualizado.id
                    ? proveedorActualizado
                    : proveedorActual
            )

            return proveedorActualizado

        } catch (error) {

            console.error('Error al activar el proveedor:', error)

            setProveedorError([
                error.response?.data?.message ||
                'Error al activar el proveedor'
            ])

            return null

        }

    }

    const obtenerProveedoresInactivos = async () => {

        try {

            setProveedorError([])

            const respuesta = await axios.get('/proveedores')

            const inactivos = respuesta.data.filter(
                (proveedorItem) => !proveedorItem.activo
            )

            setProveedoresInactivos(inactivos)

            return inactivos

        } catch (error) {

            console.error('Error al obtener proveedores inactivos:', error)

            setProveedorError([
                error.response?.data?.message ||
                'Error al obtener proveedores inactivos'
            ])

            return null

        }

    }

    const limpiarProveedorError = () => {

        setProveedorError([])

    }

    return (

        <ContextoProveedor.Provider
            value={{
                proveedores,
                proveedor,
                proveedorError,
                cargando,
                proveedoresInactivos,
                obtenerProveedores,
                obtenerProveedorPorId,
                crearProveedor,
                actualizarProveedor,
                buscarProveedores,
                desactivarProveedor,
                activarProveedor,
                obtenerProveedoresInactivos,
                limpiarProveedorError
            }}
        >

            {children}

        </ContextoProveedor.Provider>

    )

}