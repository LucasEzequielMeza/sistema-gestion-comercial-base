import React from 'react'

function Button({ children, className = '', ...props }) {
    return (
        <button
            type="button"
            className={`relative inline-flex items-center justify-center gap-x-2 rounded-xl bg-[#13100F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#26211F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13100F] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}

export default Button