import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { Palette } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

export default function VerifyEmailScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const checkVerification = async () => {
    if (!user) return;
    setLoading(true);
    await user.reload();
    if (user.emailVerified) {
      Alert.alert("Verified!", "Your email has been successfully verified. You can now login.", [
        { 
          text: "OK", 
          onPress: async () => {
            await logout();
            router.replace("/login");
          } 
        }
      ]);
    } else {
      Alert.alert("Pending", "Your email is not verified yet. Please check your inbox and spam folder.");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!user) return;
    setResending(true);
    try {
      await sendEmailVerification(user);
      Alert.alert("Sent", "A new verification email has been sent to your inbox. Please also check your spam folder.");
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests') {
        Alert.alert("Wait a moment", "We recently sent an email. Please wait a bit before requesting another one.");
      } else {
        Alert.alert("Error", "Could not resend email. Please try again later.");
      }
    }
    setResending(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.primary }]}>Check Your Email</Text>
        <Text style={[styles.message, { color: colors.text }]}>
          We sent a verification link to{"\n"}
          <Text style={[styles.emailHighlight, { color: colors.primary }]}>{user?.email}</Text>
        </Text>
        <Text style={[styles.subtext, { color: colors.textSub }]}>
          Please tap the link in the email to verify your account. You cannot access the app until your email is verified.
        </Text>

        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: colors.primary }]} 
          onPress={checkVerification}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>I've Verified My Email</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.secondaryButton, { borderColor: colors.primary }]} 
          onPress={handleResend}
          disabled={resending}
        >
          {resending ? <ActivityIndicator color={colors.primary} /> : <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Resend Email</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.textButton} 
          onPress={logout}
        >
          <Text style={[styles.textButtonText, { color: colors.textSub }]}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DADBDB",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 30,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Palette.green,
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    color: "#2D3C59",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 24,
  },
  emailHighlight: {
    fontWeight: "bold",
    color: "#527A3A",
  },
  subtext: {
    fontSize: 14,
    color: "#8A97A8",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: Palette.green,
    width: "100%",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Palette.green,
    width: "100%",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: Palette.green,
    fontSize: 16,
    fontWeight: "bold",
  },
  textButton: {
    paddingVertical: 10,
  },
  textButtonText: {
    color: "#8A97A8",
    fontSize: 14,
    fontWeight: "600",
  },
});
