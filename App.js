import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MUSIC_DIR = 'file:///storage/emulated/0/Music';

export default function App() {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(null);
  const [duration, setDuration] = useState(null);
  const [volume, setVolume] = useState(1.0);
  const [playMode, setPlayMode] = useState('normal');
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const intervalRef = useRef();

  useEffect(() => {
    loadTracks();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('ストレージへのアクセス許可が必要です');
      return false;
    }
    return true;
  };

  const loadTracks = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const dirInfo = await FileSystem.getInfoAsync(MUSIC_DIR);
      if (!dirInfo.exists) {
        alert('Musicフォルダが見つかりません');
        return;
      }

      const files = await FileSystem.readDirectoryAsync(MUSIC_DIR);
      const musicFiles = files.filter(file => 
        file.endsWith('.mp3') || 
        file.endsWith('.wav') ||
        file.endsWith('.m4a')
      );

      setTracks(musicFiles.map(file => ({
        id: file,
        title: file.replace(/\.[^/.]+$/, ""),
        uri: `${MUSIC_DIR}/${file}`
      })));
    } catch (error) {
      console.error('ファイル読み込みエラー:', error);
      alert('音楽ファイルの読み込みに失敗しました');
    }
  };

  const playSound = async (track) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: true, volume }
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

  const renderTrackItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.trackItem}
      onPress={() => playSound(item)}
    >
      <Text style={styles.trackTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {currentTrack ? (
        <>
          <Text style={styles.title}>{currentTrack.title}</Text>

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
            <TouchableOpacity onPress={handleNext}>
              <Icon name="skip-previous" size={40} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={isPlaying ? pauseSound : () => playSound(currentTrack)}>
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
        </>
      ) : (
        <Text style={styles.instruction}>音楽ファイルを選択してください</Text>
      )}

      <FlatList
        data={tracks}
        renderItem={renderTrackItem}
        keyExtractor={item => item.id}
        style={styles.trackList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  instruction: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20,
  },
  progressContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
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
    justifyContent: 'center',
    marginVertical: 20,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 10,
  },
  modeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  trackList: {
    flex: 1,
    marginTop: 20,
  },
  trackItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  trackTitle: {
    color: '#fff',
    fontSize: 16,
  },
});
