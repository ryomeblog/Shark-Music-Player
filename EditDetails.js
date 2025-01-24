import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, ScrollView } from "react-native";
import * as FileSystem from "expo-file-system";

const EditDetails = ({ route, navigation }) => {
  const { track = {}, onSave = () => {} } = route.params || {};
  const [artist, setArtist] = useState(track?.artist || "");
  const [lyrics, setLyrics] = useState(track?.lyrics?.join("\n") || "");

  const handleSave = async () => {
    try {
      console.log("track", track);
      const updatedTrack = {
        ...track,
        artist: artist,
        lyrics: lyrics.split("\n"),
      };

      // tracks.jsonを更新
      const tracksPath = `${FileSystem.documentDirectory}tracks.json`;
      const fileInfo = await FileSystem.getInfoAsync(tracksPath);
      let tracks = [];

      if (fileInfo.exists) {
        const data = await FileSystem.readAsStringAsync(tracksPath);
        tracks = JSON.parse(data);
      }

      // 既存のトラックを更新または新規追加
      const index = tracks.findIndex((t) => t.id === track.id);
      if (index !== -1) {
        tracks[index] = updatedTrack;
      } else {
        tracks.push(updatedTrack);
      }

      await FileSystem.writeAsStringAsync(
        tracksPath,
        JSON.stringify(tracks, null, 2)
      );

      onSave(updatedTrack);
      navigation.goBack();
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <TextInput
          style={styles.input}
          value={artist}
          onChangeText={setArtist}
          placeholder="アーティスト名"
        />

        <TextInput
          style={[styles.input, styles.lyricsInput]}
          value={lyrics}
          onChangeText={setLyrics}
          placeholder="歌詞を入力（改行で区切ります）"
          multiline
          numberOfLines={10}
        />
      </ScrollView>

      <Button title="更新" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#222",
  },
  input: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  lyricsInput: {
    height: 200,
    textAlignVertical: "top",
  },
});

export default EditDetails;
