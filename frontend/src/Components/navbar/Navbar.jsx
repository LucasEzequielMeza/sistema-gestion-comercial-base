import React from 'react'
import { IoLogOut, IoMenu } from 'react-icons/io5'
import { Link, useLocation } from 'react-router-dom'
import { privateRoutes } from './navegacion.js'
import { useAuth } from '../../Context/ContextoAutorizacion'

function Navbar({ menuAbierto, setMenuAbierto }) {

    const location = useLocation()

    const {
        logout,
        usuario,
        estaAutorizado
    } = useAuth()

    if (!estaAutorizado) {
        return null
    }

    return (
        <nav
            className={`fixed left-0 top-0 z-50 border-r border-white/10 bg-[#171412] text-white shadow-xl transition-all duration-300 ${
                menuAbierto
                    ? 'h-auto w-full md:h-screen md:w-64'
                    : 'h-14 w-full md:h-screen md:w-20'
            }`}
        >
            <div className="flex h-full flex-col">

                {/* Encabezado */}
                <div className={`flex h-16 shrink-0 items-center border-b border-white/10 px-4 ${
                    menuAbierto ? 'justify-between' : 'justify-center'
                }`}>

                    {menuAbierto && (
                        <Link
                            to="/productos"
                            className="group flex min-w-0 items-center gap-3"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#171412] shadow-sm transition group-hover:bg-stone-200">
                                <span className="text-lg font-black tracking-tight">
                                    GL
                                </span>
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold tracking-wide text-white">
                                    Gestión Local
                                </p>
                                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-400">
                                    Inventario y gestión
                                </p>
                            </div>
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={() => setMenuAbierto(!menuAbierto)}
                        aria-label={menuAbierto ? 'Contraer menú' : 'Expandir menú'}
                        title={menuAbierto ? 'Contraer menú' : 'Expandir menú'}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-stone-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                    >
                        <IoMenu className="text-2xl" />
                    </button>
                </div>

                {/* Navegación */}
                <div
                    className={`flex flex-col gap-1.5 px-3 pt-6 ${
                        menuAbierto
                            ? 'pb-4 md:flex-1'
                            : 'hidden md:flex md:flex-1'
                    }`}
                >
                    {menuAbierto && (
                        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Menú principal
                        </p>
                    )}

                    {privateRoutes.map((route) => {

                        const rutaActiva =
                            location.pathname === route.path ||
                            location.pathname.startsWith(`${route.path}/`)

                        return (
                            <Link
                                key={route.path}
                                to={route.path}
                                onClick={() => {
                                    if (window.innerWidth < 768) {
                                        setMenuAbierto(false)
                                    }
                                }}
                                title={!menuAbierto ? route.name : undefined}
                                className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm transition duration-200 ${
                                    rutaActiva
                                        ? 'bg-white text-[#171412] shadow-sm'
                                        : 'text-stone-300 hover:bg-white/10 hover:text-white'
                                } ${
                                    menuAbierto
                                        ? 'justify-start'
                                        : 'justify-center'
                                }`}
                            >
                                {rutaActiva && (
                                    <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-stone-700" />
                                )}

                                {route.icon && (
                                    <route.icon
                                        className={`shrink-0 text-xl transition ${
                                            rutaActiva
                                                ? 'text-[#171412]'
                                                : 'text-stone-400 group-hover:text-white'
                                        }`}
                                    />
                                )}

                                {menuAbierto && (
                                    <span className={`min-w-0 truncate ${
                                        rutaActiva
                                            ? 'font-semibold'
                                            : 'font-medium'
                                    }`}>
                                        {route.name}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Usuario y cierre de sesión */}
                <div
                    className={`mt-auto border-t border-white/10 p-3 ${
                        menuAbierto
                            ? ''
                            : 'hidden md:block'
                    }`}
                >
                    {menuAbierto && usuario && (
                        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-stone-700 text-sm font-bold text-white">
                                {`${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase() || 'U'}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-stone-500">
                                    Sesión iniciada
                                </p>

                                <p className="mt-1 truncate text-sm font-semibold text-white">
                                    {usuario.nombre} {usuario.apellido}
                                </p>
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={logout}
                        title={!menuAbierto ? 'Cerrar sesión' : undefined}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-stone-300 transition duration-200 hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-400/30 ${
                            menuAbierto
                                ? 'justify-start'
                                : 'justify-center'
                        }`}
                    >
                        <IoLogOut className="shrink-0 text-xl transition group-hover:text-red-300" />

                        {menuAbierto && (
                            <span>Cerrar sesión</span>
                        )}
                    </button>

                    {menuAbierto && (
                        <p className="mt-3 px-3 pb-1 text-center text-[10px] tracking-wide text-stone-600">
                            Gestión Local
                        </p>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar