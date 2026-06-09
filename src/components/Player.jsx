import React, { useState, useEffect, useRef } from 'react';

export default function Player({ tracks = { previews: [], beats: [] } }) {
  const [activeTab, setActiveTab] = useState('previews');
  
  // Sincronizziamo l'indice in modo che non vada mai fuori dai limiti della playlist attiva
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // Inizializzato a false per gestire l'autoplay via codice in modo pulito
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(0.7);

  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  // Recuperiamo la lista corrente in base al tab selezionato
  const currentPlaylist = tracks[activeTab] || [];
  
  // Traccia correntemente attiva (con controllo di sicurezza)
  const currentTrack = currentPlaylist[currentTrackIndex] || currentPlaylist[0];

  // 1. RESET INDEX AL CAMBIO TAB
  // Se l'utente cambia sezione, resettiamo l'indice alla prima traccia della nuova lista
  useEffect(() => {
    setCurrentTrackIndex(0);
    setIsPlaying(false); // Fai partire la riproduzione della nuova sezione in automatico
  }, [activeTab]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 2. EFFECT DI INIZIALIZZAZIONE AUDIO E MANAGEMENT DELLE TRACCE
useEffect(() => {
  if (!currentTrack) return;

  if (audioRef.current) {
    audioRef.current.pause();
  }

  audioRef.current = new Audio(currentTrack.src);
  const audio = audioRef.current;

  audio.volume = isMuted ? 0 : volume;

  const onLoadedMetadata = () => {
    setDuration(audio.duration);
  };

  const onTimeUpdate = () => {
    setCurrentTime(audio.currentTime);

    // Aggiorna la posizione nella lockscreen
    if (
      'mediaSession' in navigator &&
      navigator.mediaSession.setPositionState
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration || 0,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      } catch (err) {
        console.log(err);
      }
    }
  };

  const onEnded = () => {
    handleNext();
  };

  audio.addEventListener('loadedmetadata', onLoadedMetadata);
  audio.addEventListener('timeupdate', onTimeUpdate);
  audio.addEventListener('ended', onEnded);

  // MEDIA SESSION API
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: activeTab === 'beats' ? 'Beats' : 'Tracks',

      // facoltativo: sostituisci con una tua immagine
      artwork: [
        {
          src: '/cover.svg',
          sizes: '512x512',
          type: 'image/svg',
        },
      ],
    });

    navigator.mediaSession.playbackState = isPlaying
      ? 'playing'
      : 'paused';

    navigator.mediaSession.setActionHandler('play', async () => {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.log(err);
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audio.pause();
      setIsPlaying(false);
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      handlePrev();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      handleNext();
    });

  }

  if (isPlaying) {
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        console.log(
          'Riproduzione automatica bloccata dal browser.'
        );
        setIsPlaying(false);
      });
    }
  }

  return () => {
    audio.pause();

    audio.removeEventListener(
      'loadedmetadata',
      onLoadedMetadata
    );

    audio.removeEventListener(
      'timeupdate',
      onTimeUpdate
    );

    audio.removeEventListener(
      'ended',
      onEnded
    );
  };
}, [
  currentTrackIndex,
  activeTab,
  isPlaying,
  currentTrack,
]);

  useEffect(() => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = isPlaying
      ? 'playing'
      : 'paused';
  }
}, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.log(err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentPlaylist.length === 0) return;
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % currentPlaylist.length);
  };

  const handlePrev = () => {
    if (currentPlaylist.length === 0) return;
    setCurrentTrackIndex((prevIndex) => (prevIndex - 1 + currentPlaylist.length) % currentPlaylist.length);
  };

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
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    
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

  // Interfaccia di Fallback se non ci sono tracce in assoluto
  if (currentPlaylist.length === 0) {
    return (
      <section className="py-12 bg-zinc-900 text-white max-w-4xl mx-auto my-8 px-4 sm:px-6 rounded-2xl shadow-xl border border-zinc-800">
        {/* Mantiene i Tab visibili così l'utente può comunque switchare sull'altra sezione funzionante */}
        <div className="flex justify-center mb-8">
          <div className="bg-zinc-950 p-1.5 rounded-full border border-zinc-800 flex gap-1 w-full max-w-md">
            <button onClick={() => setActiveTab('previews')} className={`flex-1 py-2.5 px-6 rounded-full text-sm font-medium uppercase transition-all duration-300 ${activeTab === 'previews' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-400'}`}>Tracks</button>
            <button onClick={() => setActiveTab('beats')} className={`flex-1 py-2.5 px-6 rounded-full text-sm font-medium uppercase transition-all duration-300 ${activeTab === 'beats' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-400'}`}>Beats</button>
          </div>
        </div>
        <div className="text-center text-zinc-500 py-6 border border-dashed border-zinc-800 rounded-2xl">
          Nessuna traccia trovata in questa sezione.
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-zinc-900 text-white max-w-4xl mx-auto my-8 px-4 sm:px-6 rounded-2xl shadow-xl border border-zinc-800">
      
    <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-wider uppercase text-amber-400">
          {activeTab === 'previews' ? 'Tracks by Shhte' : 'Prod by Shhte'}
        </h2>
      </div>

      {/* --- SEZIONE SWITCH / TABS --- */}
      <div className="flex justify-center mb-8">
        <div className="bg-zinc-950 p-1.5 rounded-full border border-zinc-800 flex gap-1 w-full max-w-md">
          <button
            onClick={() => setActiveTab('previews')}
            className={`flex-1 py-2.5 px-6 rounded-full text-sm font-medium tracking-wide uppercase transition-all duration-300 ${
              activeTab === 'previews'
                ? 'bg-amber-400 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Tracks
          </button>
          <button
            onClick={() => setActiveTab('beats')}
            className={`flex-1 py-2.5 px-6 rounded-full text-sm font-medium tracking-wide uppercase transition-all duration-300 ${
              activeTab === 'beats'
                ? 'bg-amber-400 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Beats
          </button>
        </div>
      </div>

  

      {/* Info Traccia e Controlli Principali */}
      <div className="bg-zinc-950 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="w-full md:w-auto text-center md:text-left truncate">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Stai ascoltando</span>
          <h3 className="text-xl font-medium mt-1 truncate">
            {currentTrack?.title}
          </h3>
          <p className="text-zinc-400 text-sm truncate">{currentTrack?.artist}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto justify-end">
          {/* Pulsanti Player */}
          <div className="flex items-center gap-4">
            <button onClick={handlePrev} className="p-2 text-zinc-400 hover:text-white transition-colors" aria-label="Precedente">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </button>
            <button onClick={togglePlay} className="p-4 bg-amber-400 text-zinc-950 rounded-full hover:bg-amber-300 transform hover:scale-105 transition-all shadow-lg shadow-amber-400/20" aria-label={isPlaying ? "Pausa" : "Riproduci"}>
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button onClick={handleNext} className="p-2 text-zinc-400 hover:text-white transition-colors" aria-label="Prossima">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>

          <div className="hidden sm:block h-8 w-px bg-zinc-800" />

          {/* Controllo Volume */}
          <div className="flex items-center gap-2 w-full sm:w-32 justify-center sm:justify-start">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
              {isMuted || volume === 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>
              ) : volume < 0.4 ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L9 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.74 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
              )}
            </button>
            <input 
              type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={handleVolumeChange}
              className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              style={{ background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${(isMuted ? 0 : volume) * 100}%, #27272a ${(isMuted ? 0 : volume) * 100}%, #27272a 100%)` }}
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6 px-2">
        <div ref={progressBarRef} onClick={handleProgressClick} className="w-full h-2 bg-zinc-800 rounded-full cursor-pointer relative group transition-all duration-200 hover:h-3">
          <div className="h-full bg-amber-400 rounded-full absolute top-0 left-0 pointer-events-none" style={{ width: `${progressPercent}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow" style={{ left: `calc(${progressPercent}% - 8px)` }} />
        </div>
        <div className="flex justify-between text-xs text-zinc-500 mt-2 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* --- SEZIONE PLAYLIST DINAMICA --- */}
      <div className="mt-8 border-t border-zinc-800 pt-6">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 px-2">
          {activeTab === 'previews' ? 'Tracce' : 'Beats'} ({currentPlaylist.length})
        </h4>
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {currentPlaylist.map((track, index) => {
            const isCurrent = index === currentTrackIndex;
            return (
              <button
                key={track.id}
                onClick={() => handleSelectTrack(index)}
                className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all duration-200 group focus:outline-none ${
                  isCurrent 
                    ? 'bg-amber-400/10 border border-amber-400/30 text-amber-400' 
                    : 'hover:bg-zinc-800/60 text-zinc-300 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-4 truncate">
                  {/* Numero o Icona di Stato */}
                  <div className="w-6 flex items-center justify-center font-mono text-xs text-zinc-500 group-hover:text-amber-400 transition-colors">
                    {isCurrent && isPlaying ? (
                      <div className="flex items-end gap-[2px] h-3">
                        <span className="w-[3px] bg-amber-400 animate-[bounce_1s_infinite_100ms] h-full" />
                        <span className="w-[3px] bg-amber-400 animate-[bounce_1s_infinite_300ms] h-2" />
                        <span className="w-[3px] bg-amber-400 animate-[bounce_1s_infinite_200ms] h-3" />
                      </div>
                    ) : isCurrent ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    ) : (
                      <span>{String(index + 1).padStart(2, '0')}</span>
                    )}
                  </div>
                  
                  {/* Testi della traccia */}
                  <div className="truncate">
                    <p className={`font-medium text-sm truncate ${isCurrent ? 'text-amber-400' : 'text-zinc-200'}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
                  </div>
                </div>

                {/* Badge laterale */}
                <div className="text-xs font-mono text-zinc-600 group-hover:text-zinc-400 pl-2">
                  {isCurrent && isPlaying ? 'NOW PLAYING' : 'SELEZIONA'}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}