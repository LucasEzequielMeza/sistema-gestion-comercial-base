import React from 'react'

function Label({ children, htmlFor }) {
    return (
        <label className="block text-sm font-semibold text-stone-700" htmlFor={htmlFor}>
            {children}
        </label>
    )
}

export default Label