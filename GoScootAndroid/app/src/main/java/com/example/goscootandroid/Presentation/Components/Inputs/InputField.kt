package com.example.goscootandroid.Presentation.Components.Inputs

import android.annotation.SuppressLint
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp

data class ValidationResult(
    val message: String,
    val isValid: Boolean
)

@Composable
fun InputField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    label: String? = null,
    leadingIcon: ImageVector? = null,
    needSProtection: Boolean = false,
    isRequired: Boolean = false,
    validator: ((String) -> ValidationResult)? = null,
    modifier: Modifier = Modifier,
    // 👇 Customizable text styles
    labelStyle: TextStyle = MaterialTheme.typography.bodyMedium,
    inputTextStyle: TextStyle = MaterialTheme.typography.bodyMedium,
    validationStyle: TextStyle = MaterialTheme.typography.bodySmall
) {
    var validationMessage by remember { mutableStateOf("") }
    var isSecureVisible by remember { mutableStateOf(false) }

    Column(modifier = modifier) {
        // Label + required star
        if (label != null) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = label,
                    style = labelStyle
                )
                if (isRequired) {
                    Spacer(Modifier.width(4.dp))
                    Text(
                        text = "*",
                        color = MaterialTheme.colorScheme.primary,
                        style = labelStyle
                    )
                }
            }
            Spacer(Modifier.height(4.dp))
        }

        val isError = validationMessage.isNotEmpty()

        OutlinedTextField(
            value = value,
            onValueChange = { newText ->
                onValueChange(newText)
                validator?.let { v ->
                    val result = v(newText)
                    validationMessage = if (result.isValid) "" else result.message
                }
            },
            placeholder = { Text(placeholder, style = inputTextStyle.copy(color = MaterialTheme.colorScheme.onSurfaceVariant)) },
            textStyle = inputTextStyle, // 👈 Input field text style
            leadingIcon = {
                leadingIcon?.let {
                    Icon(imageVector = it, contentDescription = null)
                }
            },
            trailingIcon = {
                if (needSProtection) {
                    IconButton(onClick = { isSecureVisible = !isSecureVisible }) {
                        Icon(
                            imageVector = if (isSecureVisible) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                            contentDescription = if (isSecureVisible) "Hide" else "Show"
                        )
                    }
                }
            },
            visualTransformation = when {
                !needSProtection -> VisualTransformation.None
                isSecureVisible   -> VisualTransformation.None
                else              -> PasswordVisualTransformation()
            },
            isError = isError,
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        // Validation message
        if (isError) {
            Spacer(Modifier.height(4.dp))
            Text(
                text = validationMessage,
                color = MaterialTheme.colorScheme.error,
                style = validationStyle
            )
        }
    }
}