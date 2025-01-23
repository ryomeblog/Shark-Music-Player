import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
    try {
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      if (mediaStatus.status !== 'granted') {
        alert('メディアライブラリへのアクセス許可が必要です');
        return false;
      }

      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        alert('ストレージへのアクセス許可が必要です');
        return false;
      }

      const musicDirUri = permissions.directoryUri;
      await FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + 'music_dir.txt',
        musicDirUri
      );

      return musicDirUri;
    } catch (error) {
      console.error('権限リクエストエラー:', error);
      alert('権限のリクエストに失敗しました');
      return false;
    }
  };

  const getMusicDirectory = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(
        FileSystem.documentDirectory + 'music_dir.txt'
      );
      
      if (dirInfo.exists) {
        const uri = await FileSystem.readAsStringAsync(dirInfo.uri);
        return uri;
      }
      
      return await requestPermissions();
    } catch (error) {
      console.error('ディレクトリ取得エラー:', error);
      return null;
    }
  };

  const [trackMetadata, setTrackMetadata] = useState([]);

  const loadTracks = async () => {
    try {
      const tracksPath = `${FileSystem.documentDirectory}tracks.json`;
      const fileInfo = await FileSystem.getInfoAsync(tracksPath);
      
      let metadata = [];
      if (!fileInfo.exists) {
        const initialData = [
          // 例：
          // {
          //   id: 'song.mp3',
          //   title: 'song',
          //   artist: 'test',
          //   lyrics: []
          // }
        ];
        
        await FileSystem.writeAsStringAsync(
          tracksPath,
          JSON.stringify(initialData, null, 2)
        );
        metadata = initialData;
      } else {
        const metadataResponse = await FileSystem.readAsStringAsync(tracksPath);
        metadata = JSON.parse(metadataResponse);
      }
      setTrackMetadata(metadata);

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

  const [showLyrics, setShowLyrics] = useState(false);

  const renderTrackItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.trackItem}
      onPress={() => {
        playSound(item);
        setShowLyrics(true);
      }}
    >
      <Text style={styles.trackTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderLyrics = () => {
    const lyrics = currentTrack?.lyrics || [];
    return (
      <View style={styles.lyricsContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setShowLyrics(false)}
        >
          <Icon name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>
        <ScrollView style={styles.lyricsScroll}>
          {lyrics.length > 0 ? (
            lyrics.map((line, index) => (
              <Text key={index} style={styles.lyricsText}>
                {line}
              </Text>
            ))
          ) : (
            <Text style={styles.lyricsText}>歌詞がありません</Text>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderPlayerBar = () => (
    <TouchableOpacity 
      style={styles.playerBar}
      onPress={() => setShowLyrics(true)}
    >
      <Text style={styles.playerBarTitle}>{currentTrack?.title}</Text>
      <TouchableOpacity onPress={isPlaying ? pauseSound : () => playSound(currentTrack, position)}>
        <Icon 
          name={isPlaying ? "pause" : "play-arrow"} 
          size={30} 
          color="#fff" 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {showLyrics ? (
        renderLyrics()
      ) : (
        <>
          {currentTrack && !showLyrics ? (
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
                <TouchableOpacity onPress={isPlaying ? pauseSound : () => playSound(currentTrack, position)}>
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
        </>
      )}
      
      {currentTrack && renderPlayerBar()}
    </View>
  );
}

const styles = StyleSheet.create({
  lyricsContainer: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  lyricsScroll: {
    flex: 1,
  },
  lyricsText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  playerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  playerBarTitle: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    marginRight: 20,
  },
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
