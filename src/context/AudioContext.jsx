import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSource, setCurrentSource] = useState(null); // { type: 'surah' | 'tasbih', id: string, surahNumber?: number }
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const audioRef = useRef(new Audio());

  useEffect(() => {
    const audio = audioRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    
    // Global error handler - only log, don't set user error state here
    // as it's handled by the fallback logic in play()
    const handleError = (e) => {
      console.error("Global Audio Error Event:", e);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const play = (urls, sourceInfo) => {
    const audio = audioRef.current;
    const urlList = Array.isArray(urls) ? urls : [urls];
    let currentUrlIndex = 0;

    const tryPlay = (index) => {
      if (index >= urlList.length) {
        setError("Failed to load audio from any source");
        setIsLoading(false);
        setIsPlaying(false);
        return;
      }

      const url = urlList[index];

      // If same source and already loaded, just toggle
      if (currentSource?.url === url) {
        if (audio.paused) {
          audio.play().catch(e => {
            console.error("Play failed", e);
            tryPlay(index + 1);
          });
        } else {
          audio.pause();
        }
        return;
      }

      // New source or need to reload
      audio.pause();
      audio.src = url;
      setCurrentSource({ ...sourceInfo, url });
      setError(null);
      setIsLoading(true);

      const onCanPlay = () => {
        setIsLoading(false);
        audio.play().catch(e => {
          console.error("Play failed", e);
          tryPlay(index + 1);
        });
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
      };

      const onError = (e) => {
        console.error(`Error loading audio from ${url}:`, e);
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
        // Clear src to stop any background loading before trying next
        audio.src = "";
        tryPlay(index + 1);
      };

      audio.addEventListener('canplay', onCanPlay);
      audio.addEventListener('error', onError);
      
      try {
        audio.load();
      } catch (err) {
        console.error("Audio load failed:", err);
        onError(err);
      }
    };

    tryPlay(currentUrlIndex);
  };

  const pause = () => {
    audioRef.current.pause();
  };

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const stop = () => {
    audioRef.current.pause();
    audioRef.current.src = "";
    setCurrentSource(null);
    setIsPlaying(false);
  };

  return (
    <AudioContext.Provider value={{
      isPlaying,
      currentSource,
      duration,
      currentTime,
      isLoading,
      error,
      play,
      pause,
      seek,
      stop
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio must be used within AudioProvider");
  return context;
};
