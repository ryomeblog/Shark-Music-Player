import React from 'react';
import { FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const TrackList = ({ tracks, onTrackSelect }) => {
  const renderTrackItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.trackItem}
      onPress={() => onTrackSelect(item)}
    >
      <Text style={styles.trackTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={tracks}
      renderItem={renderTrackItem}
      keyExtractor={item => item.id}
      style={styles.trackList}
    />
  );
};

const styles = StyleSheet.create({
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
