import { View, ImageBackground, StyleSheet, Image } from "react-native";
import { useApp } from "../Components/Context/GlobalContext";
import { useEffect } from "react";
import { Response_MobileAppLogInDTO } from "@trungthao/mobile_app_dto";
import EncryptedStorage from "react-native-encrypted-storage";
import { signInWithSession } from "../Repositories/AuthenticationRepository";
import Snackbar from "react-native-snackbar";

export default function EntryScreen({ navigation }: any) {
    const globalContext = useApp()
    useEffect(() => {
        console.log("Logging in")
        const tryRestoreSession = async () => {
            try {
                const sessionId = await EncryptedStorage.getItem("session_id");

                if (!sessionId) {
                    console.log("⚠️ No session found, redirecting to LogIn...");
                    navigation.replace("LogIn");
                    return;
                }
                console.log("🔹 Found session, trying auto sign-in...");
                const response: Response_MobileAppLogInDTO = await signInWithSession(sessionId);
                // ✅ Save profile to context
                console.log(response)
                globalContext.setUserProfile(response.userProfile);
                Snackbar.show({
                    text: "Đăng nhập thành công",
                    duration: Snackbar.LENGTH_SHORT,
                    backgroundColor: "green",
                    textColor: "white"
                })

                navigation.replace("Main"); // go to main tabs or home
            } catch (err) {
                console.log(err)
                Snackbar.show({
                    text: "Đã xảy ra lỗi trong quá trình đăng nhập",
                    duration: Snackbar.LENGTH_SHORT,
                    backgroundColor: "red",
                    textColor: "white"
                })
                navigation.replace("LogIn");
            }
        };

        // delay the auto-login for splash
        const timer = setTimeout(tryRestoreSession, 3000);

        // cleanup if unmounted
        return () => clearTimeout(timer);
    }, [navigation]); 
    const styles = StyleSheet.create({
        background: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: "red"
        },

        app_logo: {
            width: 200,
            height: 200
        }
    })
    return (
        <ImageBackground
            source={require('../Assets/Images/splash_screen_background.jpg')}
            style={styles.background}
            resizeMode="cover"
        >
            <Image style={styles.app_logo} source={require('../Assets/Images/AppLogo.png')}></Image>

        </ImageBackground>
    )
}

