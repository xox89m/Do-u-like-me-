import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Disc3,
  Minimize2,
  Maximize2,
  Upload,
  Music2,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { DiscordCoverArt } from './DiscordCoverArt';

interface SongPlayerProps {
  autoPlay?: boolean;
}

export const SongPlayer: React.FC<SongPlayerProps> = ({ autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(202); // 3:22 default
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showLyrics, setShowLyrics] = useState<boolean>(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle Play/Pause
  const togglePlay = async () => {
    if (!audioRef.current) return;
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setLoadError(false);
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
        }
      }
    } catch (e) {
      console.warn('Playback error, switching source fallback:', e);
      // Fallback switch between /song.mp3 and /api/song.mp3
      if (audioRef.current) {
        try {
          if (!audioRef.current.src.includes('/api/song.mp3')) {
            audioRef.current.src = '/api/song.mp3';
          } else {
            audioRef.current.src = '/song.mp3';
          }
          await audioRef.current.play();
          setIsPlaying(true);
          setLoadError(false);
        } catch (err2) {
          console.error('Fallback play failed:', err2);
          setLoadError(true);
        }
      }
    }
  };

  // Format mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Handle File Upload of user's custom audio file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create immediate local blob URL so it plays instantly
    const localUrl = URL.createObjectURL(file);
    setAudioBlobUrl(localUrl);

    // Upload to server so it persists
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        await fetch('/api/upload-song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64 }),
        });
      } catch (err) {
        console.error('Upload failed:', err);
      }
    };
    reader.readAsDataURL(file);

    // Play immediately
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 200);
  };

  const currentAudioSrc = audioBlobUrl || './song.mp3';

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-[calc(100vw-2rem)] sm:max-w-sm w-full select-none">
      {/* Native audio element */}
      <audio
        ref={audioRef}
        src={currentAudioSrc}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && !isNaN(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
        onError={() => {
          if (audioRef.current && !audioBlobUrl && !audioRef.current.src.includes('/api/song.mp3')) {
            audioRef.current.src = '/api/song.mp3';
            audioRef.current.load();
          }
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*,.mp3,.wav,.m4a,.ogg"
        className="hidden"
      />

      {/* Minimized Pill View */}
      {isMinimized ? (
        <div
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-[#18191c]/95 hover:bg-[#202225] text-white rounded-full shadow-2xl border border-gray-700/60 backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95 group"
        >
          <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
            <DiscordCoverArt size="sm" className="w-full h-full" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs font-semibold leading-tight text-pink-300 group-hover:text-pink-200 truncate">
              พี่คงไม่ชอบผมหรอก
            </p>
            <p className="text-[10px] text-gray-400">
              {isPlaying ? 'กำลังเล่น 🎵' : 'หยุดชั่วคราว'} • {formatTime(currentTime)}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="p-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex-shrink-0 shadow-md cursor-pointer active:scale-95"
            title={isPlaying ? 'หยุดเพลง' : 'เล่นเพลง'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
        </div>
      ) : (
        /* Full Music Card View */
        <div className="bg-[#111214]/95 backdrop-blur-xl border border-gray-700/60 rounded-3xl p-4 shadow-2xl text-white">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Disc3 className={`w-4 h-4 text-pink-400 ${isPlaying ? 'animate-spin' : ''}`} />
              <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                เพลง: พี่คงไม่ชอบผมหรอก
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowLyrics(!showLyrics)}
                className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  showLyrics ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                เนื้อเพลง
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg cursor-pointer"
                title="ย่อขนาด"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Cover Art with Discord Call Screenshot */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-gray-700/50 mb-3 group">
            <DiscordCoverArt className="w-full h-full" />

            {/* Play/Pause Overlay */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition-all cursor-pointer opacity-90 group-hover:opacity-100"
              title={isPlaying ? 'คลิกเพื่อหยุด' : 'คลิกเพื่อเล่นเพลง'}
            >
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-pink-600 to-rose-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </div>
            </button>
          </div>

          {/* Song Info & File Upload option */}
          <div className="mb-2">
            <div className="flex items-baseline justify-between">
              <h4 className="font-bold text-sm text-pink-200 tracking-wide truncate">
                พี่คงไม่ชอบผมหรอก
              </h4>
              <span className="text-[10px] text-gray-400 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xs text-gray-400 truncate">
                เด็กที่ชอบอยู่กับพี่ (Waen Tim & XOX89m)
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-pink-400 hover:text-pink-300 underline font-medium cursor-pointer flex items-center gap-1"
                title="เลือกไฟล์เพลงจากเครื่องของคุณ"
              >
                <Upload className="w-3 h-3" />
                <span>เปลี่ยนไฟล์เพลง</span>
              </button>
            </div>
          </div>

          {/* Progress Slider */}
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={duration || 202}
              value={currentTime}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCurrentTime(val);
                if (audioRef.current) {
                  audioRef.current.currentTime = val;
                }
              }}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between">
            {/* Volume Slider */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-gray-500" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-14 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-400"
              />
            </div>

            {/* Play/Pause Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                  }
                  setCurrentTime(0);
                }}
                className="text-gray-400 hover:text-white cursor-pointer p-1"
                title="เริ่มเล่นใหม่"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'หยุด' : 'เล่น'}
              >
                {isPlaying ? (
                  <Pause className="w-4.5 h-4.5 fill-current" />
                ) : (
                  <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 15, duration);
                  }
                }}
                className="text-gray-400 hover:text-white cursor-pointer p-1"
                title="ข้ามไป 15 วินาที"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lyrics Drawer */}
          {showLyrics && (
            <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-300 max-h-36 overflow-y-auto space-y-1.5 leading-relaxed font-sans pr-1">
              <p className="text-pink-300 font-semibold text-[11px] mb-1">
                📜 เนื้อเพลง: พี่คงไม่ชอบผมหรอก
              </p>
              <p>&ldquo;อีกแล้ว ทำไมวันนี้ผมเป็นเหมือนเดิมอีกแล้วนะ&rdquo;</p>
              <p>&ldquo;ไอ้เด็กคนนี้มันคิดถึงพี่อยู่ตลอดเวลา&rdquo;</p>
              <p>&ldquo;งานการก็ไม่ทำครับ อยากโทรไปหาแต่กลัวว่าจะรบกวน...&rdquo;</p>
              <p>&ldquo;แค่อยากชวนพี่มาเจอได้ไหมล่ะ เสาร์-อาทิตย์คงมีโอกาสใช่ไหมอ่ะ&rdquo;</p>
              <p>&ldquo;จะพาเธอไปกินอะไรที่คนอื่นไปทำนองนั้น พาไปดูหนังแค่เธอกับฉัน&rdquo;</p>
              <p className="text-pink-400 font-medium">&ldquo;พี่ต้องการผู้ชายแบบไหน... คนที่พี่อยากจะโทรมาหา ผมก็อยากจะเป็นคนนั้น&rdquo;</p>
              <p>&ldquo;เข้าใจว่าพี่ไม่มีเวลาถึงเช้า คิดแล้วมันก็แอบเหงาๆ&rdquo;</p>
              <p>&ldquo;ผมแค่ต้องการจะโทรมาบอกว่า Goodnight...&rdquo;</p>
              <p className="text-pink-300">&ldquo;พี่คงไม่อ้อน... แล้วเมื่อไหร่จะรักกันได้ไหม... บอกผมได้ไหมเธอ&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
