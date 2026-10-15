import React from 'react'
import { IoLogOut, IoMenu, IoClose } from 'react-icons/io5'
import { FaUser } from 'react-icons/fa'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { privateRoutes } from './navegacion.js'
import { useAuth } from '../../Context/ContextoAutorizacion'

function Navbar({ menuAbierto, setMenuAbierto }) {
    const location = useLocation()
    const navigate = useNavigate()
    const { logout, usuario, estaAutorizado } = useAuth()

    if (!estaAutorizado) return null

    const cerrarMenuMovil = () => {
        if (window.innerWidth < 768) setMenuAbierto(false)
    }

    const cerrarSesion = async () => {
        await logout()
        setMenuAbierto(false)
        navigate('/iniciar-sesion')
    }

    const nombreUsuario = usuario?.nombre
        ? `${usuario.nombre} ${usuario.apellido || ''}`.trim()
        : usuario?.usuario || 'Mi cuenta'

    const iniciales = nombreUsuario
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0].toUpperCase())
        .join('')

    return (
        <>
            <button
                type="button"
                onClick={() => setMenuAbierto(!menuAbierto)}
                className="fixed left-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#171412] text-white shadow-md transition hover:bg-[#29231f] md:hidden"
                aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            >
                {menuAbierto ? <IoClose size={23} /> : <IoMenu size={23} />}
            </button>

            {menuAbierto && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setMenuAbierto(false)}
                />
            )}

            <aside
                className={`fixed left-0 top-0 z-50 flex h-dvh flex-col overflow-hidden border-r border-white/10 bg-[#171412] text-white transition-all duration-300 ease-in-out
                ${menuAbierto ? 'w-[min(18rem,85vw)] translate-x-0 md:w-64' : '-translate-x-full md:w-20 md:translate-x-0'}`}
            >
                <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-4">
                    {menuAbierto && (
                        <Link
                            to="/panel-de-control"
                            onClick={cerrarMenuMovil}
                            className="flex min-w-0 items-center gap-3"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-lg font-bold text-[#171412]">
                                GL
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-base font-semibold">Gestión Local</p>
                                <p className="text-xs text-stone-400">Sistema de gestión</p>
                            </div>
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={() => setMenuAbierto(!menuAbierto)}
                        className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-300 transition hover:bg-white/10 hover:text-white md:flex ${menuAbierto ? '' : 'mx-auto'}`}
                        aria-label={menuAbierto ? 'Contraer menú' : 'Expandir menú'}
                    >
                        {menuAbierto ? <IoClose size={22} /> : <IoMenu size={23} />}
                    </button>
                </div>

                <div className="scrollbar-personalizada min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5">
                    {menuAbierto && (
                        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
                            Menú principal
                        </p>
                    )}

                    <nav className="space-y-1.5">
                        {privateRoutes.map((ruta) => {
                            const Icono = ruta.icon
                            const activa = location.pathname === ruta.path ||
                                (ruta.path !== '/panel-de-control' && location.pathname.startsWith(`${ruta.path}/`))

                            return (
                                <Link
                                    key={ruta.path}
                                    to={ruta.path}
                                    onClick={cerrarMenuMovil}
                                    title={!menuAbierto ? ruta.name : undefined}
                                    className={`group relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                                    ${!menuAbierto ? 'md:justify-center md:px-0' : ''}
                                    ${activa
                                        ? 'bg-white text-[#171412]'
                                        : 'text-stone-300 hover:bg-white/10 hover:text-white'}`}
                                >
                                    <Icono size={20} className="shrink-0" />
                                    {menuAbierto && <span className="truncate">{ruta.name}</span>}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                <div className="shrink-0 border-t border-white/10 p-3">
                    <Link
                        to="/perfil"
                        onClick={cerrarMenuMovil}
                        title={!menuAbierto ? 'Mi perfil' : undefined}
                        className={`mb-2 flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-white/10 ${!menuAbierto ? 'md:justify-center' : ''} ${location.pathname === '/perfil' ? 'bg-white/10' : ''}`}
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white">
                            {iniciales || <FaUser size={16} />}
                        </div>

                        {menuAbierto && (
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white">{nombreUsuario}</p>
                                <p className="text-xs text-stone-400">Mi perfil</p>
                            </div>
                        )}
                    </Link>

                    <button
                        type="button"
                        onClick={cerrarSesion}
                        title={!menuAbierto ? 'Cerrar sesión' : undefined}
                        className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-300 transition-colors hover:bg-white/10 hover:text-white ${!menuAbierto ? 'md:justify-center md:px-0' : ''}`}
                    >
                        <IoLogOut size={21} className="shrink-0" />
                        {menuAbierto && <span>Cerrar sesión</span>}
                    </button>

                    {menuAbierto && (
                        <p className="mt-3 text-center text-[11px] text-stone-500">
                            Gestión Local
                        </p>
                    )}
                </div>
            </aside>
        </>
    )
}

export default Navbar