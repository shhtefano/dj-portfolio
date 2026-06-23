import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function Player({ tracks = { previews: [], beats: [] } }) {
  const [activeTab, setActiveTab] = useState('previews');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);

  const prevVolumeRef = useRef(0.7);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  const currentPlaylist = tracks[activeTab] || [];
  const currentTrack = currentPlaylist[currentTrackIndex] || null;

  // FUNZIONE HELPER: Genera il percorso della cover basandosi sul file audio
  const getCoverSrc = (track) => {
    // if (!track || !track.src) return '/images/cover/default.jpg';

    // Estrae il nome del file eliminando il percorso iniziale e l'estensione .mp3
    // Esempio: "/audio/mia-traccia.mp3" diventa "mia-traccia"
    // const audioFilename = track.src.split('/').pop().replace(/\.[^/.]+$/, "");

    // Ritorna il percorso puntando alla cartella corretta (cover al singolare) con estensione .jpg
    // Se usi i .png, sostituisci .jpg con .png qui sotto
    // return `/images/covers/${audioFilename}.svg`;
    return `/images/logo_omino.svg`;
  };

  const handleNext = useCallback(() => {
    if (currentPlaylist.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + 1) % currentPlaylist.length);
  }, [currentPlaylist.length]);

  const handlePrev = useCallback(() => {
    if (currentPlaylist.length === 0) return;
    setCurrentTrackIndex((prev) => (prev - 1 + currentPlaylist.length) % currentPlaylist.length);
  }, [currentPlaylist.length]);

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    setIsPlaying((prev) => !prev);
  }, [currentTrack]);

  // 1. INIZIALIZZAZIONE UNICA AUDIO
  useEffect(() => {
    audioRef.current = new Audio();

    const onLoadedMetadata = () => setDuration(audioRef.current.duration);
    const onTimeUpdate = () => setCurrentTime(audioRef.current.currentTime);
    const onEnded = () => handleNext();

    audioRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
    audioRef.current.addEventListener('timeupdate', onTimeUpdate);
    audioRef.current.addEventListener('ended', onEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
        audioRef.current.removeEventListener('timeupdate', onTimeUpdate);
        audioRef.current.removeEventListener('ended', onEnded);
      }
    };
  }, [handleNext]);

  // 2. CAMBIO TAB
  useEffect(() => {
    setCurrentTrackIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [activeTab]);

  // 3. CAMBIO TRACCIA E MEDIA SESSION API
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    audioRef.current.src = currentTrack.src;
    audioRef.current.load();
    setCurrentTime(0);

    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: activeTab === 'beats' ? 'Beats' : 'Tracks',
        artwork: [{ src: getCoverSrc(currentTrack), sizes: '200x200', type: 'image/jpeg' }]
      });

      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
    }

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      }
    };
  }, [currentTrackIndex, activeTab, currentTrack, isPlaying, handleNext, handlePrev, togglePlay]);

  // 4. SINCRONIZZAZIONE PLAY/PAUSE
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying, currentTrack]);

  // 5. GESTIONE VOLUME
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleSelectTrack = (index) => {
    if (index === currentTrackIndex) {
      togglePlay();
    } else {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
    }
  };

  const handleProgressClick = (e) => {
    if (!progressBarRef.current || !duration || !audioRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolumeRef.current);
      setIsMuted(false);
    } else {
      prevVolumeRef.current = volume;
      setIsMuted(true);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };



  const progressPercent = duration ? (currentTime / duration) * 100 : 0;


  useEffect(() => {
    if (isPlaying && currentTrack) {
      document.title = currentTrack.title;
    } else {
      document.title = "Shhte";
    }
    return () => {
      document.title = "Shhte";
    };
  }, [isPlaying, currentTrack]);

  if (currentPlaylist.length === 0) {
    return (
      <section className="py-[4rem] px-[2rem] max-w-[1200px] mx-auto bg-zinc-900/40 backdrop-blur-md text-white rounded-2xl border border-zinc-800/80 mt-20 text-center">
        <p className="text-zinc-500">Nessuna traccia caricata nel database.</p>
      </section>
    );
  }

  return (
    <section className="py-[4rem] px-[2rem] max-w-[1200px] mx-auto bg-zinc-950 text-white rounded-2xl border border-white/5 mt-20 shadow-2xl">

      {/* HEADER CONTROLLER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400">
            {activeTab === 'previews' ? 'Tracks Archive' : 'Beats Ledger'}
          </h2>
          <p className="text-xs font-mono text-purple-400 uppercase tracking-widest mt-1">Audio Player / Monitor Studio</p>
        </div>

        <div className="bg-white/[0.03] p-1 rounded-full border border-white/5 flex gap-1 w-full max-w-xs">
          <button
            onClick={() => setActiveTab('previews')}
            className={`flex-1 py-2 px-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'previews' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            Tracks
          </button>
          <button
            onClick={() => setActiveTab('beats')}
            className={`flex-1 py-2 px-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'beats' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            Beats
          </button>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

        {/* COLONNA SINISTRA */}
        <div className="lg:col-span-7 space-y-8 w-full">
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-xl space-y-6">
            <div className="truncate">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-purple-500 block mb-1">On-Air Deck</span>
              <h3 className="text-xl font-bold tracking-wide text-white truncate">{currentTrack?.title}</h3>
              <p className="text-zinc-400 text-sm font-medium truncate mt-0.5">{currentTrack?.artist}</p>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <div ref={progressBarRef} onClick={handleProgressClick} className="w-full h-1.5 bg-zinc-800 rounded-full cursor-pointer relative group transition-all duration-200 hover:h-2.5">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full absolute top-0 left-0 pointer-events-none" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Hardware Controls */}
            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-3">
                <button onClick={handlePrev} className="p-2 text-zinc-400 hover:text-white border border-white/5 bg-white/[0.01] rounded-lg transition-colors" aria-label="Precedente">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
                </button>
                <button onClick={togglePlay} className="p-3.5 bg-white text-black rounded-full hover:bg-zinc-200 transition-all shadow-xl shadow-white/5" aria-label={isPlaying ? "Pausa" : "Riproduci"}>
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  )}
                </button>
                <button onClick={handleNext} className="p-2 text-zinc-400 hover:text-white border border-white/5 bg-white/[0.01] rounded-lg transition-colors" aria-label="Prossima">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2 border border-white/5 bg-white/[0.01] py-1.5 px-3 rounded-lg">
                <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
                  {isMuted || volume === 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L9 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.74 2.5-2.25 2.5-4.02z" /></svg>
                  )}
                </button>
                <input
                  type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={handleVolumeChange}
                  className="w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Tracklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500 px-1">
              Index / Queued ({currentPlaylist.length})
            </h4>
            <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {currentPlaylist.map((track, index) => {
                const isCurrent = index === currentTrackIndex;
                return (
                  <button
                    key={track.id || index}
                    onClick={() => handleSelectTrack(index)}
                    className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all duration-200 border ${isCurrent ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-lg' : 'hover:bg-white/[0.02] text-zinc-300 hover:text-white border-transparent'}`}
                  >
                    <div className="flex items-center gap-4 truncate">
                      <div className="w-6 flex items-center justify-center font-mono text-xs text-zinc-500">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end gap-[2px] h-3">
                            <span className="w-[2px] bg-purple-400 animate-pulse h-full" />
                            <span className="w-[2px] bg-purple-400 animate-pulse h-2 [animation-delay:200ms]" />
                            <span className="w-[2px] bg-purple-400 animate-pulse h-3 [animation-delay:400ms]" />
                          </div>
                        ) : (
                          <span>{String(index + 1).padStart(2, '0')}</span>
                        )}
                      </div>
                      <div className="truncate">
                        <p className={`font-semibold text-sm truncate ${isCurrent ? 'text-purple-400' : 'text-zinc-200'}`}>{track.title}</p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-400 pl-2">
                      {isCurrent && isPlaying ? 'ON DECK' : 'LOAD'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLONNA DESTRA (Giradischi Meccanico) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center py-6 lg:py-12 border border-white/5 bg-white/[0.01] rounded-xl relative overflow-hidden group">
          <div className="absolute top-4 right-12 w-20 h-32 border-r-2 border-t-2 border-zinc-700 rounded-tr-xl opacity-20 pointer-events-none hidden lg:block z-20"></div>

          <div className="relative w-64 h-64 sm:w-72 sm:h-72 xl:w-80 xl:h-80 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border-4 border-zinc-900 shadow-[0_0_60px_rgba(0,0,0,0.8)]"
              style={{
                animation: isPlaying ? 'spin-vinyl 3s linear infinite' : 'none',
                background: 'radial-gradient(circle, #18181b 0%, #09090b 40%, #020202 70%, #0f0f12 100%)'
              }}
            >
              <div className="absolute inset-4 rounded-full border border-white/[0.02]" />
              <div className="absolute inset-10 rounded-full border border-white/[0.01]" />
              <div className="absolute inset-16 rounded-full border border-white/[0.02]" />
              <div className="absolute inset-24 rounded-full border border-white/[0.01]" />

              {/* Centro Vinile con Immagine Dinamica della Cover */}
              <div className="w-[42%] h-[42%] rounded-full border-4 border-zinc-950 bg-zinc-950 overflow-hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
                <img
                  src={getCoverSrc(currentTrack)}
                  alt="Track Cover"
                  className="object-cover"
                  onError={(e) => {
                    // Fallback se la cover .jpg specifica non esiste (usa texture astratta scura)
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop';
                  }}
                />
                <div className="absolute w-3 h-3 bg-zinc-400 rounded-full border-2 border-zinc-950 shadow-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"></div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center space-y-1 font-mono text-[10px] tracking-widest text-zinc-600">
            <div>RPM: {isPlaying ? '33.3 ACTIVE' : '0.00 STANDBY'}</div>
          </div>
        </div>

      </div>

      <style flex="true">{`
        @keyframes spin-vinyl {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}