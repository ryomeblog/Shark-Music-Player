import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import tracks from './assets/tracks.json';

export default function App() {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [playMode, setPlayMode] = useState('normal'); // normal, repeat, shuffle
  const intervalRef = useRef();

  const track = tracks[currentTrack];

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      { uri: track.url },
      { shouldPlay: true, volume }
    );
    setSound(sound);
    setIsPlaying(true);
    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    await sound.playAsync();
  };

  const pauseSound = async () => {
    if (sound) {
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

  const handlePrevious = () => {
    const newTrack = currentTrack > 0 ? currentTrack - 1 : tracks.length - 1;
    setCurrentTrack(newTrack);
  };

  const handleNext = () => {
    let newTrack;
    if (playMode === 'shuffle') {
      newTrack = Math.floor(Math.random() * tracks.length);
    } else {
      newTrack = currentTrack < tracks.length - 1 ? currentTrack + 1 : 0;
    }
    setCurrentTrack(newTrack);
  };

  const togglePlayMode = () => {
    const modes = ['normal', 'repeat', 'shuffle'];
    const currentIndex = modes.indexOf(playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setPlayMode(modes[nextIndex]);
  };

  useEffect(() => {
    if (sound) {
      sound.unloadAsync();
    }
    playSound();
  }, [currentTrack]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setPosition((prev) => prev + 1000);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: track.artwork }} style={styles.artwork} />
      <Text style={styles.title}>{track.title}</Text>
      <Text style={styles.artist}>{track.artist}</Text>

      <View style={styles.progressContainer}>
        <Text style={styles.time}>{formatTime(position)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#888888"
        />
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={handlePrevious}>
          <Icon name="skip-previous" size={40} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={isPlaying ? pauseSound : playSound}>
          <Icon name={isPlaying ? "pause" : "play-arrow"} size={60} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext}>
          <Icon name="skip-next" size={40} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.volumeContainer}>
        <Icon name="volume-down" size={24} color="#fff" />
        <Slider
          style={styles.volumeSlider}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onValueChange={handleVolumeChange}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#888888"
        />
        <Icon name="volume-up" size={24} color="#fff" />
      </View>

      <View style={styles.modeContainer}>
        <TouchableOpacity onPress={togglePlayMode}>
          <Icon 
            name={
              playMode === 'repeat' ? 'repeat-one' :
              playMode === 'shuffle' ? 'shuffle' : 'repeat'
            } 
            size={30} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.lyricsContainer}>
        <Text style={styles.lyrics}>{track.lyrics}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    alignItems: 'center',
    paddingTop: 50,
  },
  artwork: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  artist: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 20,
  },
  progressContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  time: {
    color: '#fff',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '60%',
    marginVertical: 20,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: 20,
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 10,
  },
  modeContainer: {
    marginBottom: 20,
  },
  lyricsContainer: {
    width: '90%',
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 5,
    padding: 10,
  },
  lyrics: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
});
