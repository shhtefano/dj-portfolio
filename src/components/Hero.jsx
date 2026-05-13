import { motion } from "framer-motion";

const bars = Array.from({ length: 120 });

export default function Hero() {
    return (
        <section className="relative h-screen overflow-hidden bg-black flex items-center justify-center">

            {/* BACKGROUND */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-black" />

            {/* GLOW */}
            <motion.div
                className="absolute w-[1500px] h-[500px] bg-blue-400/20 blur-[140px] rounded-full"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 0.8, 0.6],
                    x: [-50, 50, -50],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            {/* AUDIO VISUALIZER */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">

                <div className="absolute inset-0 flex items-end justify-between px-0">
                    {bars.map((_, i) => {
                        const hue = 200 + (i / bars.length) * 120; // blu → viola

                        return (
                            <motion.div
                                key={i}
                                animate={{
                                    height: [
                                        `${20 + Math.random() * 60}px`,
                                        `${120 + Math.random() * 200}px`,
                                        `${30 + Math.random() * 100}px`,
                                    ],
                                    opacity: [0.4, 1, 0.5],
                                }}
                                transition={{
                                    duration: 1.2 + Math.random() * 1.5,
                                    repeat: Infinity,
                                    repeatType: "mirror",
                                    ease: "easeInOut",
                                    delay: i * 0.015,
                                }}
                                className="flex-1 rounded-full"
                                style={{
                                    background: `linear-gradient(to top, hsl(${hue}, 60%, 90%), hsl(${hue + 30}, 100%, 70%))`,
                                    boxShadow: `0 0 10px hsl(${hue}, 90%, 60%)`,
                                    margin: "0 1px",
                                }}
                            />
                        );
                    })}

                </div>

            </div>

            {/* DARK OVERLAY */}
            <div className="absolute inset-0 bg-black/10" />

            {/* CONTENT */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2 }}
                className="relative z-10 text-center px-2"
            >

                <p className="uppercase tracking-[0.5em] text-zinc-500 text-sm mb-6">
                    Open Format Artist
                </p>

                {/* OVERLAPPING TITLE */}
                <h1 className="
                    title-font
                    text-3xl
                    md:text-[11rem]
                    font-black
                    leading-none
                    text-white
                    mix-blend-lighten
                    drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]
                    uppercase
                    tracking-[-0.06em]
                    ">
                    DJ SHHTE
                </h1>

                <p className="pt-10 text-zinc-500 max-w-xl mx-auto text-lg md:text-xl leading-relaxed">
                    Commerciale • House • UKG • Bass • Club Energy
                </p>

            </motion.div>

            {/* BOTTOM FADE */}
            <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-black to-transparent" />

        </section>
    );
}