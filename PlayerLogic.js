import React, { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export const usePlayerLogic = () => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(null);
  const [duration, setDuration] = useState(null);
  const [volume, setVolume] = useState(1.0);
  const [playMode, setPlayMode] = useState('normal');
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [trackMetadata, setTrackMetadata] = useState([]);
  const [showLyrics, setShowLyrics] = useState(false);
  const intervalRef = useRef();

  const loadTracks = async () => {
    try {
      
      const musicFiles = await FileSystem.readDirectoryAsync('file:///storage/emulated/0/Music/');
      
      const audioFiles = musicFiles.filter(file => 
        file.endsWith('.mp3') || 
        file.endsWith('.wav') ||
        file.endsWith('.m4a')
      );
      
      const tracks = audioFiles.map(file => ({
        id: file,
        title: file.replace(/\.[^/.]+$/, ""),
        uri: `file:///storage/emulated/0/Music/${file}`,
        lyrics: [],
        artist: 'Unknown'
      }));
      
      setTracks(tracks);
    } catch (error) {
      console.error('ファイル読み込みエラー:', error);
      alert('音楽ファイルの読み込みに失敗しました');
    }
  };

  useEffect(() => {
    loadTracks();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const playSound = async (track, position = 0) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: true, volume, positionMillis: position }
      );
      setSound(newSound);
      setIsPlaying(true);
      setCurrentTrack(track);
      newSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      await newSound.playAsync();
    } catch (error) {
      console.error('再生エラー:', error);
      alert('音楽の再生に失敗しました');
    }
  };

  const pauseSound = async () => {
    if (sound) {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        setPosition(status.positionMillis);
      }
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      if (status.didJustFinish) {
        handleNext();
      }
    }
  };

  const handleSeek = (value) => {
    if (sound) {
      sound.setPositionAsync(value);
    }
  };

  const handleVolumeChange = (value) => {
    setVolume(value);
    if (sound) {
      sound.setVolumeAsync(value);
    }
  };

  const handleNext = () => {
    if (!currentTrack || !tracks.length) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    let newIndex;
    
    if (playMode === 'shuffle') {
      newIndex = Math.floor(Math.random() * tracks.length);
    } else {
      newIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0;
    }
    
    playSound(tracks[newIndex]);
  };

  const togglePlayMode = () => {
    const modes = ['normal', 'repeat', 'shuffle'];
    const currentIndex = modes.indexOf(playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setPlayMode(modes[nextIndex]);
  };

  const formatTime = (millis) => {
    if (!millis) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return {
    sound,
    isPlaying,
    position,
    duration,
    volume,
    playMode,
    tracks,
    currentTrack,
    trackMetadata,
    showLyrics,
    setShowLyrics,
    loadTracks,
    playSound,
    pauseSound,
    handleSeek,
    handleVolumeChange,
    handleNext,
    togglePlayMode,
    formatTime
  };
};
