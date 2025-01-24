import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export const LyricsView = ({ lyrics, onBack }) => {
  return (
    <View style={styles.lyricsContainer}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={onBack}
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
});
