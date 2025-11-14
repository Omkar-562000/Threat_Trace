export default function GlassButton({ children, className = "", ...props }) {
    return (
        <button
            {...props}
            className={`
                px-4 py-2 rounded-lg 
                bg-white/10 backdrop-blur-md 
                border border-white/20 
                text-gray-100 
                hover:bg-white/20 hover:border-neon 
                shadow-lg transition 
                ${className}
            `}
        >
            {children}
        </button>
    );
}
