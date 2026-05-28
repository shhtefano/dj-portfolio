import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // --- CONFIGURAZIONE PARTICELLE (TUNNEL DI SFONDO) ---
    const particleCount = 250;
    const particles: any[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 180 + Math.random() * 240,
        speed: 0.0085 + Math.random() * 0.003,
        size: 1 + Math.random() * 2,
        pulsePhase: Math.random() * Math.PI,
        color: i % 2 === 0 ? "34, 211, 238" : "139, 92, 246", // Ciano o Viola
      });
    }

    // --- CONFIGURAZIONE ONDE AUDIO INFINITE ---
    // Definiamo 4 onde distinte per creare spessore e intreccio cromatco
    const waves = [
      {
        amplitude: 45,
        frequency: 0.008,
        speed: 0.04,
        colorStart: "#06b6d4", // Ciano
        colorEnd: "#3b82f6",   // Blu
        lineWidth: 3,
      },
      {
        amplitude: 35,
        frequency: 0.012,
        speed: -0.03, // Va in direzione opposta
        colorStart: "#8b5cf6", // Viola
        colorEnd: "#ec4899",   // Magenta
        lineWidth: 2.5,
      },
      {
        amplitude: 25,
        frequency: 0.006,
        speed: -0.02,
        colorStart: "#d946ef", // Fuchsia
        colorEnd: "#f97316",   // Arancione
        lineWidth: 3,
      },
      {
        amplitude: 45,
        frequency: 0.018,
        speed: 0.05,
        colorStart: "#06b6d4", // Ciano chiaro
        colorEnd: "#8b5cf6",   // Viola intenso
        lineWidth: 1,
      },
            {
        amplitude: 55,
        frequency: 0.006,
        speed: 0.02,
        colorStart: "#2f1b86", // Fuchsia
        colorEnd: "#16adf9",   // Arancione
        lineWidth: 2,
      },
            {
        amplitude: 55,
        frequency: 0.006,
        speed: -0.02,
        colorStart: "#d946ef", // Fuchsia
        colorEnd: "#f9164b",   // Arancione
        lineWidth: 2,
      },
            {
        amplitude: 55,
        frequency: 0.006,
        speed: 0.02,
        colorStart: "#ef7946", // Fuchsia
        colorEnd: "#def916",   // Arancione
        lineWidth: 2,
      },
    ];

    let phase = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // --- LOOP DI RENDERING ---
    const render = () => {
      phase += 0.5; // Avanzamento temporale per le onde
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. DISEGNO TUNNEL DI PARTICELLE (SFONDO CENTRALE)
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        p.angle += p.speed;
        p.pulsePhase += 0.02;

        const currentRadius = p.radius + Math.sin(phase * 0.05 + i) * 10;
        const x = centerX + Math.cos(p.angle) * currentRadius;
        const y = centerY + Math.sin(p.angle) * currentRadius;
        const alpha = 0.2 + Math.sin(p.pulsePhase) * 0.3;

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
        ctx.fill();
      }

      // 2. DISEGNO ONDE AUDIO INFINITE (IN BASSO)
      const waveBaseY = height * 0.82; // Posizionamento verticale dell'onda h 82%

      // Abilitiamo la fusione "screen" per far brillare i punti di intersezione tra le onde
      ctx.globalCompositeOperation = "screen";

      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.lineWidth = wave.lineWidth;

        // Creiamo il gradiente lineare da sinistra a destra per la singola onda
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, wave.colorStart);
        gradient.addColorStop(1, wave.colorEnd);
        ctx.strokeStyle = gradient;

        // Effetto bagliore neon sulla linea
        ctx.shadowBlur = 15;
        ctx.shadowColor = wave.colorStart;

        for (let x = 0; x < width; x += 2) {
          // Equazione matematica dell'onda sinusoidale combinata con la fase dinamica
          const y = waveBaseY + Math.sin(x * wave.frequency + (phase * wave.speed)) * wave.amplitude
            // Aggiunge un pizzico di movimento organico extra ("rumore di fondo")
            * Math.cos(x * 0.002 + (phase * 0.005));

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      // Reset delle proprietà grafiche per non sporcare i render successivi
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black flex items-center justify-center">

      {/* BACKGROUND GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 z-0" />

      {/* CANVAS (Onde liquide + Particelle) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />

      {/* GLOW AMBIENTALE DIETRO AI TESTI */}
      <div className="absolute w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full z-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* TESTI IN PRIMO PIANO */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative z-20 text-center px-4 max-w-5xl select-none"
      >


        <h1
          className="text-6xl md:text-[10rem] font-black leading-none text-white uppercase tracking-tighter"
          style={{
            textShadow: "0 0 30px rgba(255,255,255,0.15), 0 0 60px rgba(6,182,212,0.2)",
            WebkitTextStroke: "1px rgba(255,255,255,0.05)"
          }}
        >
          SHHTE
        </h1>

        <p className="pt-8 text-zinc-400 max-w-xl mx-auto text-base md:text-lg font-light tracking-widest uppercase">
          Commerciale • House • UKG • Bass • Club Energy
        </p>
      </motion.div>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />


      {/* SFUMATURA INFERIORE DI SICUREZZA */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-zinc-950 to-transparent z-30 pointer-events-none" />

    </section>
  );
}