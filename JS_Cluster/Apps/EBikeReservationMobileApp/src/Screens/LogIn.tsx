

import React, { useState, useMemo, useEffect } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Image,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { TextField } from '../Components/Inputs/TextField';
import { LinkButton } from '../Components/Pressables/NavigationLink';
import { Button } from '../Components/Pressables/Button';
import { Request_MobileAppLogInDTO } from '@trungthao/mobile_app_dto';
import { logIn } from '../Repositories/AuthenticationRepository';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useApp } from '../Components/Context/GlobalContext';
import { HttpError } from '../Repositories/ApiConfig';
import Snackbar from 'react-native-snackbar';


export default function LogInScreen() {
  const globalContext = useApp()
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [sendForm, setSendForm] = useState<boolean>(false)

  useEffect(() => {
    const authenticate = async () => {
      try {
        const payload: Request_MobileAppLogInDTO = {
          password: password,
          phoneNumber: phoneNumber
        }
        const response = await logIn(payload)
        await EncryptedStorage.setItem("session_id", response.sessionId);
        globalContext.setSessionId(response.sessionId)
        globalContext.setUserProfile(response.userProfile)
        Snackbar.show({
            text: "Đăng nhập thành công",
            duration: Snackbar.LENGTH_SHORT,
            backgroundColor: "green",
            textColor: "white"
          })
      } catch (err) {
        if (err instanceof HttpError){
           Snackbar.show({
            text: err.message,
            duration: Snackbar.LENGTH_SHORT,
            backgroundColor: "red",
            textColor: "white"
          })
        } else {
          Snackbar.show({
            text: "Đã xảy ra lỗi. Xin vui lòng thử lại",
            duration: Snackbar.LENGTH_SHORT,
            backgroundColor: "red",
            textColor: "white"
          })
        }
      } finally {
        setSendForm(false)
      }
    }
    if (sendForm) {
      authenticate()
    }
  }, [sendForm]);

  // 🔹 Compute disable state using useMemo
  const isButtonDisabled = useMemo(() => {
    return (
      phoneNumber.trim() === '' ||
      password.trim() === ''
    );
  }, [phoneNumber, password]);

  const styles = StyleSheet.create({
    background: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: 300,
      justifyContent: 'center',
      alignItems: 'center',
    },
    appLogo: {
      width: 100,
      height: 100,
    },
    welcomeText: {
      fontFamily: 'Inter',
      fontSize: 32,
      fontWeight: '700',
      textAlign: 'center',
      color: '#df6c20',
    },
    form: {
      width: '100%',
      gap: 15,
    },
    forgetPasswordLinkContainer: {
      width: '100%',
      alignItems: 'flex-end',
      paddingTop: 5,
    },
    signUpPromptContainer: {
      flexDirection: 'row',
      gap: 5,
      paddingTop: 20,
    },
  });

  return (
    <ImageBackground
      source={require('../Assets/Images/authentication_screen_background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView style={styles.container}>
        <Image
          style={styles.appLogo}
          source={require('../Assets/Images/AppLogo.png')}
        />
        <Text style={styles.welcomeText}>Chào mừng đến với GoScoot!</Text>

        <View style={{ height: 15 }} />

        <View style={styles.form}>
          <TextField
            value={phoneNumber}
            onValueChange={setPhoneNumber}
            precedeIcon={require('../Assets/Images/phone.png')}
            secureTextEntry={false}
            placeHolder={'Số Điện Thoại'}
            isRequired={true}
          />

          <TextField
            value={password}
            onValueChange={setPassword}
            precedeIcon={require('../Assets/Images/password.png')}
            secureTextEntry={true}
            placeHolder={'Mật Khẩu'}
            isRequired={true}
          />
        </View>

        <View style={styles.forgetPasswordLinkContainer}>
          <LinkButton screen="ForgetPassword" label="Quên mật khẩu ?" />
        </View>

        <View style={{ height: 20 }} />

        {/* 🔹 Button disabled when required fields are empty */}
        <Button
          label="Đăng Nhập"
          onClick={() => setSendForm(true)}
          isDisabled={isButtonDisabled}
        />

        <View style={styles.signUpPromptContainer}>
          <Text>Chưa có tài khoản?</Text>
          <LinkButton
            screen="SignUp"
            label="Đăng Ký"
            color="#df6c20"
            pressedColor="#C85F1D"
          />
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}