import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    ImageBackground,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    Easing,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Palette } from "../constants/theme";

export default function WelcomeScreen() {
  const router = useRouter();

  // Ito ang magko-kontrol kung loading pa o tapos na
  const [isLoading, setIsLoading] = useState(true);
  const [progress] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerWidth === 0) return; // Wait for layout
    // Start progress animation
    Animated.timing(progress, {
      toValue: 1,
      duration: 2500, // 2.5 seconds
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false, // width/translateX are not always native driver friendly for layouts
    }).start(({ finished }) => {
      if (finished) {
        setIsLoading(false);
        // Fade in button
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [containerWidth]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(0, containerWidth - 26)], // 26 is dot width
  });

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, containerWidth],
  });

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop' }} 
      style={styles.background}
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.content}>
          <Image
            source={require("../assets/images/NutriTrackLOGO.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>HELLO!</Text>
          <Text style={styles.subtitle}>Welcome to NutriTrack</Text>
        </View>

        <View style={styles.bottomContainer}>
          {isLoading ? (
            <View 
              style={styles.loadingBarContainer}
              onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            >
              {containerWidth > 0 && (
                <>
                  <Animated.View 
                    style={[
                      styles.loadingFill, 
                      { width: fillWidth }
                    ]} 
                  />
                  <Animated.View 
                    style={[
                      styles.loadingDot, 
                      { transform: [{ translateX }] }
                    ]} 
                  />
                </>
              )}
            </View>
          ) : (
            <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.8}
                onPress={() => router.push("/login")}
              >
                <Text style={styles.buttonText}>GET STARTED</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Dark overlay to match mockup
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    padding: 30,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  logo: { width: 140, height: 140, marginBottom: 15 },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: Palette.green,
    fontStyle: "italic",
    marginBottom: 5,
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: Palette.green,
    fontWeight: "bold",
    fontStyle: "italic",
    textAlign: "center",
  },

  bottomContainer: { height: 80, justifyContent: "center", marginBottom: 30 },

  // Get Started Button Styles
  button: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: Palette.green,
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: Palette.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: { 
    color: Palette.white, 
    fontSize: 18, 
    fontWeight: "bold",
    letterSpacing: 1,
  },

  // Loading Bar Styles matching mockup
  loadingBarContainer: {
    width: "90%",
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    // No overflow hidden here so dot can be larger
  },
  loadingFill: {
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 8,
    position: 'absolute',
    left: 0,
  },
  loadingDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 8,
    zIndex: 10,
    marginLeft: -2, // slight offset to cover the edge better
  },
});
