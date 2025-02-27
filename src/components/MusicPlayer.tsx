
import { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, Volume1, VolumeX, Repeat, Shuffle, 
  Heart, ListMusic, MoreHorizontal, Loader
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Song } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface MusicPlayerProps {
  song?: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  queue?: Song[];
}

const MusicPlayer = ({ 
  song, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious,
  queue = []
}: MusicPlayerProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [isRepeatOn, setIsRepeatOn] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Update audio source when song changes
  useEffect(() => {
    if (song && audioRef.current) {
      setIsLoading(true);
      
      // When the song changes, we update isLiked based on the song's property
      setIsLiked(song.isLiked || false);
      
      // Reset the current time display
      setCurrentTime(0);
      setDuration(0);
      
      // When audio is loaded, start playing if isPlaying is true
      audioRef.current.addEventListener('loadeddata', handleAudioLoaded);
      
      return () => {
        audioRef.current?.removeEventListener('loadeddata', handleAudioLoaded);
      };
    }
  }, [song]);
  
  // Handle play/pause changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        
        // Handle play promise to catch any errors
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsLoading(false);
            })
            .catch(error => {
              console.error("Playback failed:", error);
              toast({
                title: "Playback Error",
                description: "Unable to play this track. Please try another one.",
                variant: "destructive"
              });
              setIsLoading(false);
              onPlayPause(); // Stop attempting to play
            });
        }
      } else {
        audioRef.current.pause();
        setIsLoading(false);
      }
    }
  }, [isPlaying, song]);
  
  // Update volume whenever it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleAudioLoaded = () => {
    setIsLoading(false);
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(error => {
        console.error("Playback failed after load:", error);
        onPlayPause(); // Pause if playback fails
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && audioRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pos * duration;
    }
  };
  
  const handleAudioError = () => {
    toast({
      title: "Playback Error",
      description: "This track could not be played. Skipping to next song.",
      variant: "destructive"
    });
    setIsLoading(false);
    onNext(); // Skip to next song on error
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const VolumeIcon = isMuted || volume === 0 
    ? VolumeX 
    : volume < 0.5 
      ? Volume1 
      : Volume2;

  if (!song) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t z-50 transition-all duration-300 animate-slide-up">
      <div className="container max-w-screen-xl mx-auto px-4 py-3">
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Song Info */}
          <div className="col-span-3 flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-md overflow-hidden">
              <img 
                src={song.albumCover} 
                alt={song.title} 
                className={cn("w-full h-full object-cover", isPlaying && "album-rotation playing")}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader className="w-6 h-6 text-primary animate-spin" />
                </div>
              )}
            </div>
            <div className="truncate">
              <h4 className="text-sm font-medium truncate">{song.title}</h4>
              <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
            </div>
            <button 
              onClick={() => setIsLiked(!isLiked)} 
              className="ml-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-primary text-primary")} />
            </button>
          </div>

          {/* Player Controls */}
          <div className="col-span-6">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 mb-2">
                <button 
                  onClick={() => setIsShuffleOn(!isShuffleOn)} 
                  className={cn(
                    "text-muted-foreground hover:text-foreground transition-colors",
                    isShuffleOn && "text-primary"
                  )}
                >
                  <Shuffle className="h-4 w-4" />
                </button>
                <button 
                  onClick={onPrevious}
                  className="text-foreground hover:text-primary transition-colors"
                  disabled={isLoading}
                >
                  <SkipBack className="h-5 w-5" />
                </button>
                <button 
                  onClick={onPlayPause}
                  className={cn(
                    "w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform",
                    isLoading && "opacity-70"
                  )}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </button>
                <button 
                  onClick={onNext}
                  className="text-foreground hover:text-primary transition-colors"
                  disabled={isLoading}
                >
                  <SkipForward className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setIsRepeatOn(!isRepeatOn)}
                  className={cn(
                    "text-muted-foreground hover:text-foreground transition-colors",
                    isRepeatOn && "text-primary"
                  )}
                >
                  <Repeat className="h-4 w-4" />
                </button>
              </div>
              
              <div className="w-full flex items-center gap-2">
                <span className="text-xs text-muted-foreground min-w-[40px] text-right">
                  {formatTime(currentTime)}
                </span>
                <div 
                  ref={progressBarRef}
                  onClick={handleProgressClick}
                  className="music-progress-bar flex-1 cursor-pointer relative h-1.5 bg-muted group rounded-full overflow-hidden"
                >
                  <div 
                    className="progress h-full bg-primary transition-all duration-100 relative"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground min-w-[40px]">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>

          {/* Extra Controls */}
          <div className="col-span-3 flex items-center justify-end gap-3">
            <button 
              className={cn(
                "text-muted-foreground hover:text-foreground transition-colors",
                isQueueOpen && "text-primary"
              )}
              onClick={() => setIsQueueOpen(!isQueueOpen)}
            >
              <ListMusic className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <VolumeIcon className="h-4 w-4" />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-20 h-1 appearance-none bg-muted rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Queue Display - Hidden by Default */}
      {isQueueOpen && queue.length > 0 && (
        <div className="max-h-64 overflow-y-auto bg-background/95 border-t">
          <div className="container max-w-screen-xl mx-auto px-4 py-2">
            <h3 className="text-sm font-medium mb-2">Queue</h3>
            <div className="space-y-1">
              {queue.map((queuedSong, index) => (
                <div 
                  key={`queue-${queuedSong.id}-${index}`}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded hover:bg-accent/50 transition-colors",
                    song?.id === queuedSong.id && "bg-accent/80 text-primary"
                  )}
                >
                  <span className="text-sm text-muted-foreground w-5">{index + 1}</span>
                  <div className="h-8 w-8 flex-shrink-0">
                    <img 
                      src={queuedSong.albumCover} 
                      alt={queuedSong.title} 
                      className="h-full w-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm truncate">{queuedSong.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{queuedSong.artist}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatTime(queuedSong.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={song.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={isRepeatOn ? () => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          }
        } : onNext}
        onError={handleAudioError}
        loop={isRepeatOn}
        preload="metadata"
      />
      
      {/* Add custom CSS for audio player */}
      <style jsx>{`
        .album-rotation {
          transition: transform 0.2s ease;
        }
        .album-rotation.playing {
          animation: spin 10s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .music-progress-bar {
          height: 4px;
          background-color: hsl(var(--muted));
          border-radius: 9999px;
          cursor: pointer;
        }
        
        .music-progress-bar .progress {
          height: 100%;
          background-color: hsl(var(--primary));
          border-radius: 9999px;
        }
        
        /* Ensure the slider thumb is visible */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%; 
          background: hsl(var(--primary));
          cursor: pointer;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
        }
        
        /* Animate the player sliding up from the bottom */
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MusicPlayer;
