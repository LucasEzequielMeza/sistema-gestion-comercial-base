import React from 'react'

function Card({ children, className = '' }) {
    return (
        <div className={`bg-white p-6 rounded-2xl text-[#1C1917] ${className}`}>
            {children}
        </div>
    )
}

export default Card