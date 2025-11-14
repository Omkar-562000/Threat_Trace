export function GlassCard({ children, className = "" }) {
    return (
        <div
            className={`
                bg-glass border border-white/10 
                backdrop-blur-md shadow-xl 
                rounded-xl p-5 
                ${className}
            `}
        >
            {children}
        </div>
    );
}

export function GlassCardHeader({ children }) {
    return (
        <div className="text-neon text-xl font-semibold mb-2 drop-shadow-lg">
            {children}
        </div>
    );
}

export function GlassCardContent({ children }) {
    return <div className="text-gray-200">{children}</div>;
}
