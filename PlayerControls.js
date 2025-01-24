import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';

export const PlayerControls = ({
  trackTitle,
  isPlaying,
  position,
  duration,
  volume,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onNext,
  playMode,
  onTogglePlayMode,
}) => {
  const formatTime = (millis) => {
    if (!millis) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.trackTitle} numberOfLines={1} ellipsizeMode="tail">
        {trackTitle}
      </Text>
      <View style={styles.progressContainer}>
        <Text style={styles.time}>{formatTime(position)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={onSeek}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#888888"
        />
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={onNext}>
          <Icon name="skip-previous" size={40} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onPlayPause}>
          <Icon name={isPlaying ? "pause" : "play-arrow"} size={60} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext}>
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
          onValueChange={onVolumeChange}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#888888"
        />
        <Icon name="volume-up" size={24} color="#fff" />
      </View>

      <View style={styles.modeContainer}>
        <TouchableOpacity onPress={onTogglePlayMode}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  trackTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
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
});
