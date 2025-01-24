import React from "react";
import { StyleSheet, Text, View, FlatList } from "react-native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { PlayerControls } from "./PlayerControls";
import { PlayerBar } from "./PlayerBar";
import { LyricsView } from "./LyricsView";
import { TrackList } from "./TrackList";
import { usePlayerLogic } from "./PlayerLogic";

export default function App() {
  const {
    sound,
    isPlaying,
    position,
    duration,
    volume,
    playMode,
    tracks,
    currentTrack,
    showLyrics,
    loadTracks,
    playSound,
    pauseSound,
    handleSeek,
    handleVolumeChange,
    handleNext,
    togglePlayMode,
    formatTime,
    setShowLyrics,
  } = usePlayerLogic();

  const renderLyrics = () => (
    <LyricsView
      lyrics={currentTrack?.lyrics || []}
      onBack={() => setShowLyrics(false)}
    />
  );

  return (
    <View style={styles.container}>
      {showLyrics ? (
        renderLyrics()
      ) : (
        <>
          {currentTrack && !showLyrics ? (
            <>
              <PlayerControls
                trackTitle={currentTrack?.title}
                isPlaying={isPlaying}
                position={position}
                duration={duration}
                volume={volume}
                onPlayPause={
                  isPlaying
                    ? pauseSound
                    : () => playSound(currentTrack, position)
                }
                onSeek={handleSeek}
                onVolumeChange={handleVolumeChange}
                onNext={handleNext}
                playMode={playMode}
                onTogglePlayMode={togglePlayMode}
              />
            </>
          ) : (
            <Text style={styles.instruction}>
              音楽ファイルを選択してください
            </Text>
          )}

          <TrackList
            tracks={tracks}
            onTrackSelect={(track) => {
              playSound(track);
              setShowLyrics(true);
            }}
          />
        </>
      )}

      {currentTrack && (
        <PlayerBar
          title={currentTrack.title}
          isPlaying={isPlaying}
          onPlayPause={
            isPlaying ? pauseSound : () => playSound(currentTrack, position)
          }
          onPress={() => setShowLyrics(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  lyricsContainer: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  lyricsScroll: {
    flex: 1,
  },
  lyricsText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
  },
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
  container: {
    flex: 1,
    backgroundColor: "#222",
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  instruction: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginVertical: 20,
  },
  progressContainer: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  time: {
    color: "#fff",
    fontSize: 14,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  volumeContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 10,
  },
  modeContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  trackList: {
    flex: 1,
    marginTop: 20,
  },
  trackItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  trackTitle: {
    color: "#fff",
    fontSize: 16,
  },
});
