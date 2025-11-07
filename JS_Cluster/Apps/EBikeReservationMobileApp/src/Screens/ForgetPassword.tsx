import { SetStateAction, useMemo, useState } from "react";
import { Image, ImageBackground, KeyboardAvoidingView, StyleSheet, Text, View } from "react-native";
import { TextField, ValidationResult } from "../Components/Inputs/TextField";
import { Link, StackActions } from "@react-navigation/native";
import { LinkButton } from "../Components/Pressables/NavigationLink";
import { Button } from "../Components/Pressables/Button";


export default function ForgetPassword() {
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');

    const validatePassword = (input: string): ValidationResult => {
        const result: ValidationResult = { isValid: false, message: '' };
        if (!input || input.trim() === '') {
            return { isValid: false, message: '' };
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
            return { isValid: false, message: '' };
        }
        if (input !== password) {
            return { isValid: false, message: 'Mật khẩu không khớp' };
        }

        return { isValid: true, message: '' };
    };

    const validatePhone = (input: string): ValidationResult => {
        const result: ValidationResult = { isValid: false, message: '' };

        if (!input || input.trim() === '') {
            result.message = '';
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

    // 🔹 Compute whether the button should be disabled
    const isButtonDisabled = useMemo(() => {
        const phoneValid = validatePhone(phoneNumber).isValid;
        const passwordValid = validatePassword(password).isValid;
        const confirmPasswordValid = validateConfirmPassword(confirmPassword).isValid;

        // Disable if any are invalid
        return !(phoneValid && passwordValid && confirmPasswordValid);
    }, [phoneNumber, password, confirmPassword]);

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
        returnLinkContainer: {
            width: '100%',
            alignItems: 'flex-end',
            paddingTop: 5,
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
                        value={phoneNumber}
                        onValueChange={setPhoneNumber}
                        precedeIcon={require('../Assets/Images/phone.png')}
                        secureTextEntry={false}
                        placeHolder="Số Điện Thoại"
                        isRequired={true}
                        validate={validatePhone}
                    />

                    <TextField
                        value={password}
                        onValueChange={setPassword}
                        precedeIcon={require('../Assets/Images/password.png')}
                        secureTextEntry={true}
                        placeHolder="Mật Khẩu"
                        isRequired={true}
                        validate={validatePassword}
                    />

                    <TextField
                        value={confirmPassword}
                        onValueChange={setConfirmPassword}
                        precedeIcon={require('../Assets/Images/password.png')}
                        secureTextEntry={true}
                        placeHolder="Xác Nhận Mật Khẩu"
                        isRequired={true}
                        validate={validateConfirmPassword}
                    />
                </View>

                <View style={styles.returnLinkContainer}>
                    <LinkButton screen="LogIn" label="Quay lại đăng nhập" />
                </View>

                <View style={{ height: 20 }} />

                {/* ✅ Button disabled when validation fails */}
                <Button
                    label="Đặt Lại Mật Khẩu"
                    onClick={() => console.log('Pressed')}
                    isDisabled={isButtonDisabled}
                />
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}