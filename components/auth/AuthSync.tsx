import { authStorage } from "@/utils/authStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { useSelector } from "react-redux";

const AuthSync = () => {
  const auth = useSelector((state: Record<string, any>) => state.auth);

  console.log("Auth state in AuthSync:", auth);

  useEffect(() => {
    const getLangauge = async () => {
      const language = await AsyncStorage.getItem("language");

      const token = await authStorage.getToken();

      console.log("Retrieved token from secure storage:", token);

      console.log("Retrieved language from AsyncStorage:", language);

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
