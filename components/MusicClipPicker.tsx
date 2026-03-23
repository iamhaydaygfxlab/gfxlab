"use client";

import { useRef, useState, useEffect } from "react";


function formatTime(sec: number) {
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

type Props = {
  musicUrl: string;
  clipStart: number;
  clipDuration: number;
  onMusicChange: (file: File | null, url: string, start: number, duration: number) => void;
};

export default function MusicClipPicker({
  musicUrl,
  clipStart,
  clipDuration,
  onMusicChange,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const clipEnd = Math.min(clipStart + clipDuration, duration);
  const [isPlaying, setIsPlaying] = useState(false);
const [currentTime, setCurrentTime] = useState(0);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onMusicChange(file, url, 0, 30);
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration || 0);
  }

  function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    onMusicChange(null, musicUrl, Number(e.target.value), clipDuration);
  }
  function togglePlay() {
  const audio = audioRef.current;
  if (!audio) return;

  if (audio.paused) {
    void audio.play();
    setIsPlaying(true);
  } else {
    audio.pause();
    setIsPlaying(false);
  }
}
function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
  const audio = audioRef.current;
  if (!audio) return;

  const nextTime = Number(e.target.value);
  audio.currentTime = nextTime;
  setCurrentTime(nextTime);
}

  function previewClip() {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = clipStart;
    audio.play();

    const stopAt = clipStart + clipDuration;

    const stopPlayback = () => {
      if (audio.currentTime >= stopAt) {
        audio.pause();
        audio.removeEventListener("timeupdate", stopPlayback);
      }
    };

    audio.addEventListener("timeupdate", stopPlayback);
  }
  function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  const mins = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  const updateTime = () => setCurrentTime(audio.currentTime || 0);
  const onEnded = () => setIsPlaying(false);

  audio.addEventListener("timeupdate", updateTime);
  audio.addEventListener("ended", onEnded);

  return () => {
    audio.removeEventListener("timeupdate", updateTime);
    audio.removeEventListener("ended", onEnded);
  };
}, [musicUrl]);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label
        style={{
          width: "100%",
          minWidth: 0,
          height: 46,
          padding: "4px 6px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.18)",
          backgroundImage: "linear-gradient(135deg,#d1b15a,#000000)",
          color: "white",
          fontWeight: 700,
          fontSize: 12,
          lineHeight: 1.1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          cursor: "pointer",
          boxSizing: "border-box",
        }}
      >
        Upload Music
        <input
          type="file"
          accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </label>

      {musicUrl && (
        <>
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              padding: 12,
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Music Loaded</div>

            <div style={{ fontSize: 13, opacity: 0.95, lineHeight: 1.5 }}>
              <div>Clip start: {clipStart}s</div>
              <div>Clip end: {Math.max(clipStart, clipEnd).toFixed(0)}s</div>
              <div>Duration: {clipDuration}s</div>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>
              Start Position
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, duration - clipDuration)}
              step={0.1}
              value={clipStart}
              onChange={handleSliderChange}
              style={{ width: "100%" }}
            />
          </div>

          <div
  style={{
    padding: 14,
    borderRadius: 18,
    background: "rgba(0,0,0,0.55)",
    border: "1px solid rgba(209,177,90,0.35)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
    display: "grid",
    gap: 12,
  }}
>
  <audio
    ref={audioRef}
    src={musicUrl}
    onLoadedMetadata={handleLoadedMetadata}
    style={{ display: "none" }}
  />

  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <button
      onClick={togglePlay}
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        border: "none",
        background: "#d1b15a",
        color: "black",
        fontWeight: 900,
        fontSize: 16,
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {isPlaying ? "❚❚" : "▶"}
    </button>

    <div style={{ minWidth: 78, fontSize: 13, fontWeight: 700 }}>
      {formatTime(currentTime)} / {formatTime(duration)}
    </div>

    <input
      type="range"
      min={0}
      max={duration || 0}
      step={0.1}
      value={currentTime}
      onChange={handleSeek}
      style={{ width: "100%" }}
    />
  </div>
</div>
        </>
      )}
    </div>
  );
}
