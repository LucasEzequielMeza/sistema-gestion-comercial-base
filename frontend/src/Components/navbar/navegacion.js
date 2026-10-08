import { FaBoxOpen, FaBox } from 'react-icons/fa'
import { MdInventory } from 'react-icons/md'

export const privateRoutes = [
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
    name: 'Stock',
    path: '/stock',
    icon: MdInventory
    }
]