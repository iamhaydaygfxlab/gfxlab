"use client";

import React, { useRef, useState } from "react";

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



  return (
    <div className="p-4 space-y-4">
      <div className="text-lg font-semibold">Add Music</div>

      <input type="file" accept="audio/*" onChange={handleFileChange} />

      {musicUrl && (
        <>
                   <div
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 12,
              color: "white",
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Music Loaded</div>
            <div>Clip start: {formatTime(clipStart)}</div>
            <div>Clip end: {formatTime(clipEnd)}</div>
            <div>Duration: {clipDuration}s</div>
          </div>
          <audio
            ref={audioRef}
            src={musicUrl}
            controls
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full"
          />

          <div className="space-y-2">
            <div className="text-sm font-medium">Choose 30-second clip start</div>

            <input
              type="range"
              min={0}
              max={Math.max(0, duration - clipDuration)}
              value={clipStart}
              onChange={handleSliderChange}
              className="w-full"
            />

            <div className="text-sm">
              Clip: {formatTime(clipStart)} - {formatTime(clipEnd)}
            </div>
          </div>

          <button
            type="button"
            onClick={previewClip}
            className="px-4 py-2 rounded-lg bg-black text-white"
          >
            Preview 30 Seconds
          </button>
        </>
      )}
    </div>
  );
}