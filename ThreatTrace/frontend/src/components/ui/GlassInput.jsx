export default function GlassInput(props) {
    return (
        <input
            {...props}
            className="
                w-full bg-white/10 text-gray-100
                backdrop-blur-md px-3 py-2 rounded-lg
                border border-white/20 
                focus:border-neon focus:ring-2 focus:ring-neon/40
                outline-none shadow-inner
            "
        />
    );
}
