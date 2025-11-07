import { Dispatch, SetStateAction, useState } from "react"
import { Image, ImageSourcePropType, StyleSheet, Text, TextInput, View } from "react-native"



export type ValidationResult = {
    isValid: boolean,
    message: string
}
export type TextFieldProps = {
    value: string,
    onValueChange: Dispatch<SetStateAction<string>>,
    placeHolder: string,
    secureTextEntry: boolean,
    precedeIcon: ImageSourcePropType
    label?: string,
    isRequired: boolean,
    validate?: (data: string) => ValidationResult
}
export const TextField: React.FC<TextFieldProps> = (props) => {
    const [errorMessage, setErrorMessage] = useState<string>("")
    const styles = StyleSheet.create({
        container: {
            width: "100%",
            gap: 5
        },

        labelContainer: {
            width: "100%",
            flexDirection: "row",
            gap: 10,
            
        },

        label: {
            fontFamily: "Inter",
            fontSize: 14,
            fontWeight: 500
        },

        asterisk: {
             fontFamily: "Inter",
            fontSize: 14,
            fontWeight: 500,
            color: "#df6c20"
        },

        textInput: {
            padding: 10,
            backgroundColor: "white",
            borderRadius: 30,
            flexDirection: 'row',
            gap: 20
        },

        precedeIcon: {
            width: 20,
            height: 20
        }
    })

    return (
        <View style={styles.container}>
            {
                props.label ?
                    <View style={styles.labelContainer}>
                        <Text style={styles.label}>{props.label}</Text>
                        {
                            props.isRequired ? <Text style={styles.asterisk}>*</Text> : undefined
                        }
                    </View> : undefined
            }
            <View style={styles.textInput}>
                <Image style={styles.precedeIcon} source={props.precedeIcon}></Image>
                <TextInput
                    style = {{flexGrow: 1}}
                    value={props.value}
                    secureTextEntry={props.secureTextEntry}
                    placeholder={props.placeHolder}
                    onChangeText={(text) => {
                        props.onValueChange(text)
                        if (props.validate) {
                            setErrorMessage(props.validate(text).message)
                        }
                    }}
                >

                </TextInput>
            </View>
            {
                errorMessage ? <Text>{errorMessage}</Text> : undefined
            }

        </View>
    )
}