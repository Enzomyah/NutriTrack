import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Palette } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { height: 60 + insets.bottom, paddingBottom: 5 + insets.bottom, backgroundColor: colors.tabBar, borderTopColor: colors.border }],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSub,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Food Log",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MaterialCommunityIcons name={focused ? "silverware-fork-knife" : "silverware-fork-knife"} size={26} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Palette.white,
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
    paddingTop: 5,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    position: "absolute",

  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    paddingTop: 5,
  },
  activeIconContainer: {
    // Top border styling for active tab - normally we'd put it on the tab bar item 
    // but Expo options are fairly restricted, we simulate it via the container view
    borderTopWidth: 3,
    borderTopColor: Palette.green,
    marginTop: -8,       // shift up to cover the actual tab bar border
    paddingTop: 10,      // push icon back down
    minWidth: "60%",
  },
});
