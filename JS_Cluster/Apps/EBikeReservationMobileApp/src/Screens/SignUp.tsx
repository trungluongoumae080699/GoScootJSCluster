import { useEffect, useMemo, useState } from "react";
import { StyleSheet, ImageBackground, KeyboardAvoidingView, Image, Text, View } from "react-native";
import { ValidationResult, TextField } from "../Components/Inputs/TextField";
import { LinkButton } from "../Components/Pressables/NavigationLink";
import { Button } from "../Components/Pressables/Button";
import { signUp } from "../Repositories/AuthenticationRepository";
import { Request_MobileAppRegistrationDTO } from "@trungthao/mobile_app_dto";
import Snackbar from "react-native-snackbar";
import { BadRequestError } from "../Repositories/ApiConfig";


export default function ForgetPassword() {
  const [fullName, setFullName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [sendForm, setSendForm] = useState<boolean>(false)
  useEffect(() => {
    const register = async () => {
      try {
        const payload: Request_MobileAppRegistrationDTO = {
          fullName: fullName,
          password: password,
          phoneNumber: phoneNumber
        }
        await signUp(payload)
        Snackbar.show({
          text: "Tài khoản đã được tạo thành công",
          duration: Snackbar.LENGTH_SHORT,
          backgroundColor: "green",
          textColor: "white"
        })
      } catch (err) {
        if (err instanceof BadRequestError) {
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
      register()
    }
  }, [sendForm]);

  // 🔹 Validators
  const validatePhone = (input: string): ValidationResult => {
    const result: ValidationResult = { isValid: false, message: '' };
    if (!input || input.trim() === '') {
      result.message = 'Vui lòng nhập số điện thoại';
      return result;
    }
    const phoneRegex = /^(0\d{9}|\+84\d{9})$/;
    if (!phoneRegex.test(input)) {
      result.message = 'Số điện thoại không hợp lệ';
      return result;
    }
    result.isValid = true;
    return result;
  };

  const validatePassword = (input: string): ValidationResult => {
    const result: ValidationResult = { isValid: false, message: '' };
    if (!input || input.trim() === '') {
      result.message = 'Vui lòng nhập mật khẩu';
      return result;
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(input)) {
      result.message =
        'Mật khẩu phải có ít nhất 8 ký tự, gồm 1 chữ hoa và 1 ký tự đặc biệt';
      return result;
    }
    result.isValid = true;
    return result;
  };

  const validateConfirmPassword = (input: string): ValidationResult => {
    if (!input || input.trim() === '') {
      return { isValid: false, message: 'Vui lòng xác nhận mật khẩu' };
    }
    if (input !== password) {
      return { isValid: false, message: 'Mật khẩu không khớp' };
    }
    return { isValid: true, message: '' };
  };


  // 🔹 Disable button if any validation fails
  const isButtonDisabled = useMemo(() => {
    const validations = [
      fullName.trim() !== '',
      validatePhone(phoneNumber).isValid,
      validatePassword(password).isValid,
      validateConfirmPassword(confirmPassword).isValid,
    ];
    return validations.includes(false);
  }, [fullName, phoneNumber, password, confirmPassword]);

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
    logInPromptContainer: {
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
        <Text style={styles.welcomeText}>Khôi phục mật khẩu</Text>

        <View style={{ height: 15 }} />

        <View style={styles.form}>
          <TextField
            value={fullName}
            onValueChange={setFullName}
            precedeIcon={require('../Assets/Images/fullname.png')}
            secureTextEntry={false}
            label="Họ Và Tên"
            placeHolder="Nhập họ và tên"
            isRequired={true}
          />

          <TextField
            value={phoneNumber}
            onValueChange={setPhoneNumber}
            precedeIcon={require('../Assets/Images/phone.png')}
            secureTextEntry={false}
            label="Số Điện Thoại"
            placeHolder="Nhập số điện thoại"
            isRequired={true}
            validate={validatePhone}
          />

          <TextField
            value={password}
            onValueChange={setPassword}
            precedeIcon={require('../Assets/Images/password.png')}
            secureTextEntry={true}
            label="Mật Khẩu"
            placeHolder="Nhập mật khẩu"
            isRequired={true}
            validate={validatePassword}
          />

          <TextField
            value={confirmPassword}
            onValueChange={setConfirmPassword}
            precedeIcon={require('../Assets/Images/password.png')}
            secureTextEntry={true}
            label="Xác Nhận Mật Khẩu"
            placeHolder="Nhập lại mật khẩu"
            isRequired={true}
            validate={validateConfirmPassword}
          />
        </View>

        <View style={{ height: 25 }} />

        <Button
          label="Đăng Ký"
          onClick={() => setSendForm(true)}
          isDisabled={isButtonDisabled}
        />

        <View style={styles.logInPromptContainer}>
          <Text>Đã có tài khoản?</Text>
          <LinkButton
            screen="LogIn"
            label="Đăng Nhập"
            color="#df6c20"
            pressedColor="#C85F1D"
          />
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}