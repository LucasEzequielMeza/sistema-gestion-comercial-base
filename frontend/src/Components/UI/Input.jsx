import React, { forwardRef } from 'react'

export const Input = forwardRef((props, ref) => {
    return (
        <input
            ref={ref}
            className="block my-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-[#1C1917] placeholder:text-stone-400 transition-colors focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-100"
            {...props}
        />
    )
})

export default Input