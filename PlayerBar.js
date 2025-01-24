import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as FileSystem from "expo-file-system";

export const PlayerBar = ({
  title,
  isPlaying,
  onPlayPause,
  onPress,
  currentTrack,
}) => {
  const [artist, setArtist] = useState("Unknown Artist");

  useEffect(() => {
    const fetchArtist = async () => {
      if (!currentTrack) return;

      try {
        const tracksPath = `${FileSystem.documentDirectory}tracks.json`;
        const fileInfo = await FileSystem.getInfoAsync(tracksPath);
        if (fileInfo.exists) {
          const metadataResponse = await FileSystem.readAsStringAsync(
            tracksPath
          );
          const metadata = JSON.parse(metadataResponse);
          const trackInfo = metadata.find((t) => t.id === currentTrack.id);
          setArtist(trackInfo?.artist || "Unknown Artist");
        }
      } catch (error) {
        console.error("Failed to fetch artist:", error);
      }
    };

    fetchArtist();
  }, [currentTrack]);

  return (
    <TouchableOpacity style={styles.playerBar} onPress={onPress}>
      <View style={styles.titleContainer}>
        <Text
          style={styles.playerBarTitle}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title || "再生中の曲がありません"}
        </Text>
        {title && <Text style={styles.artistText}>{artist}</Text>}
      </View>
      <TouchableOpacity onPress={onPlayPause}>
        <Icon
          name={isPlaying ? "pause" : "play-arrow"}
          size={30}
          color="#fff"
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  playerBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#333",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#444",
  },
  playerBarTitle: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
    marginRight: 20,
  },
  titleContainer: {
    flex: 1,
    marginRight: 20,
  },
  artistText: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 4,
  },
});
