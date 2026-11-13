import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Palette } from "../constants/theme";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useAppTheme } from "../context/ThemeContext";

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // AuthProvider in _layout.tsx will handle redirection
    } catch (error: any) {
      let message = "An error occurred during login.";
      
      // Handle Firebase Auth errors explicitly
      if (
        error.code === "auth/wrong-password" || 
        error.code === "auth/user-not-found" || 
        error.code === "auth/invalid-credential"
      ) {
        message = "Incorrect password or unregistered email address. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      }
      
      Alert.alert("Incorrect Login Details", message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Reset Password", "Please enter your email address first so we can send a password reset link.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Success", "Password reset email sent. Please check your inbox (and spam folder).");
    } catch (error: any) {
      let message = "Failed to send password reset email.";
      if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error.code === "auth/user-not-found") {
        message = "No user found with this email address.";
      }
      Alert.alert("Error", message);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.header} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <Image
          source={require("../assets/images/NutriTrackLOGO.png")}
          style={styles.headerLogoIcon}
          resizeMode="contain"
        />
        <Text style={[styles.headerLogoText, { color: "#FFFFFF" }]}>NUTRITRACK</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.primary }]}>Login to your account</Text>

          <View style={[styles.inputWrapper, { borderColor: colors.primary }]}>
            <Ionicons name="mail-outline" size={20} color={colors.textSub} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.textSub}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={[styles.inputWrapper, { borderColor: colors.primary }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textSub} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.textSub}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 5 }}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textSub} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: colors.textSub }]}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>LOG IN</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: colors.textSub }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/signup")}>
              <Text style={[styles.signupLink, { color: colors.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#DADBDB" },
  header: {
    height: 60,
    backgroundColor: "#527A3A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  headerLogoIcon: { width: 35, height: 35, marginRight: 10 },
  headerLogoText: {
    color: Palette.green,
    fontSize: 20,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 1,
  },
  keyboardView: { flex: 1, justifyContent: "center" },
  content: { paddingHorizontal: 30, paddingBottom: 50 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    fontStyle: "italic",
    color: Palette.green,
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#527A3A",
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 55,
  },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    color: "#2D3C59",
    fontSize: 16,
  },
  forgotPassword: { alignItems: "flex-end", marginBottom: 30, marginTop: -10 },
  forgotPasswordText: { color: "#2D3C59", fontSize: 16, fontWeight: "500" },
  loginButton: {
    backgroundColor: Palette.green,
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: Palette.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  loginButtonText: { color: Palette.white, fontSize: 18, fontWeight: "bold" },
  signupContainer: { flexDirection: "row", justifyContent: "center" },
  signupText: { color: "#2D3C59", fontSize: 16 },
  signupLink: { color: "#527A3A", fontSize: 16, fontWeight: "bold" },
});
