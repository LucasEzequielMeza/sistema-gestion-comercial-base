import { FaBoxOpen, FaBox, FaCashRegister, FaTachometerAlt, FaTruck, FaTags } from 'react-icons/fa'
import { MdInventory } from 'react-icons/md'

export const privateRoutes = [
    {
        name: 'Panel de control',
        path: '/panel-de-control',
        icon: FaTachometerAlt
    },
    {
        name: 'Productos',
        path: '/productos',
        icon: FaBoxOpen
    },
    {
        name: 'Productos inactivos',
        path: '/productos/inactivos',
        icon: FaBox
    },
        {
        name: 'Categorías',
        path: '/categorias',
        icon: FaTags
    },
    {
        name: 'Stock',
        path: '/stock',
        icon: MdInventory
    },
    {
        name: 'Compras',
        path: '/compras',
        icon: FaBoxOpen
    },
    {
        name: 'Ventas',
        path: '/ventas',
        icon: FaCashRegister
    },
]