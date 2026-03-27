import { authStorage } from "@/utils/authStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import * as Network from "expo-network";

const AuthSync = () => {
  const auth = useSelector((state: Record<string, any>) => state.auth);
  const networkState = Network.useNetworkState();

  useEffect(() => {
    const getLangauge = async () => {
      const language = await AsyncStorage.getItem("language");

      console.log(`Current network type: ${networkState.type}`);

      if (!language) {
        // Set the language in your app's state or context
        await AsyncStorage.setItem("language", "en");
      }
    };

    getLangauge();

    return () => {
      // Cleanup if necessary
    };
  }, []);

  return null;
};

export default AuthSync;
