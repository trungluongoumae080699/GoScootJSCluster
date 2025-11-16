package com.example.goscootandroid.Presentation.Screens
import androidx.compose.runtime.Composable

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddIcCall
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.BlendMode.Companion.Screen
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.goscootandroid.EnvironmentObjects.LocalGlobalViewModelProvider
import com.example.goscootandroid.Models.DTOs.Responses.ResponseLogInDTO
import com.example.goscootandroid.Presentation.Components.Inputs.BrandButton
import com.example.goscootandroid.Presentation.Components.Inputs.HyperLink
import com.example.goscootandroid.Presentation.Components.Inputs.InputField
import com.example.goscootandroid.Presentation.Components.Modules.AppSnackbarHost
import com.example.goscootandroid.Presentation.ViewModel.AppScreen
import com.example.goscootandroid.Presentation.ViewModel.GlobalViewModel
import com.example.goscootandroid.Presentation.ViewModel.LogInScreenViewModel
import com.example.goscootandroid.Presentation.ViewModel.SnackbarType
import com.example.goscootandroid.R
import com.example.goscootandroid.Repository.ApiError
import com.example.goscootandroid.Repository.UnAuthorizedError
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch


@Composable
fun LogInScreen(
    vm: LogInScreenViewModel = hiltViewModel(),

) {
    val context = LocalContext.current
    val globalVM = LocalGlobalViewModelProvider.current
    val phone by vm.phone_number.collectAsState()
    val password by vm.password.collectAsState()
    val sendRequest by vm.sendRequest.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val coroutineScope = rememberCoroutineScope()

    Scaffold(
        snackbarHost = {
            AppSnackbarHost(
                hostState = snackbarHostState,
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            contentAlignment = Alignment.Center
        ) {
            Image(
                painter = painterResource(id = R.drawable.login_signup_bg),
                contentDescription = null, // null = decorative image
                modifier = Modifier.matchParentSize(), // fill the Box exactly
                contentScale = ContentScale.Crop // scale nicely to fill
            )

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.width(320.dp)
            ) {
                // Logo
                Image(
                    painter = painterResource(id = R.drawable.app_logo),
                    contentDescription = "App Logo"
                )

                Text(
                    "Chào Mừng Bạn Quay Lại Với GoScoot!",
                    color = Color(0xFFDF6C20),
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(vertical = 10.dp),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )

                // Phone field
                InputField(
                    value = phone,
                    onValueChange = vm::updatePhoneNumber,
                    placeholder = "Số Điện Thoại",
                    leadingIcon = Icons.Filled.AddIcCall,
                    isRequired = true
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Password field
                InputField(
                    value = password,
                    onValueChange = vm::updatePassword,
                    placeholder = "Mật Khẩu",
                    leadingIcon = Icons.Filled.Lock,
                    needSProtection = true,
                    isRequired = true
                )

                Spacer(Modifier.height(10.dp))

                // Forgot password link
                HyperLink(
                    text = "Quên Mật Khẩu?",
                    onClick = { globalVM.navigate(AppScreen.SIGNUP, false) },
                    normalColor = Color(0xFF757575),
                    pressedColor = Color(0xFFDF6C20),
                    disabledColor = Color(0xFFDF6C20),
                    underlineOnPress = true,
                    modifier = Modifier.align(Alignment.End)
                )

                Spacer(Modifier.height(15.dp))

                // Login but
                BrandButton(
                    label = "Đăng Nhập",
                    onClick = {
                        vm.logInAsync(
                            onSuccess = { resp ->
                                onLoginSuccess(resp, context, globalVM, coroutineScope, snackbarHostState)
                            },
                            onError = { err ->
                                onLoginFailure(err, globalVM, coroutineScope, snackbarHostState)
                            }
                        )
                              },

                    enabled = vm.isFormValid() && !sendRequest

                )

                Spacer(Modifier.height(12.dp))

                // Sign up link
                Row(
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Chưa Có Tài Khoản? ", style = MaterialTheme.typography.bodySmall,)
                    HyperLink(
                        text = "Đăng Ký",
                        onClick = { globalVM.navigate(AppScreen.SIGNUP, false) },
                        normalColor = Color(0xFFDF6C20),
                        pressedColor = MaterialTheme.colorScheme.secondary,
                        disabledColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),

                        underlineOnPress = true,

                    )
                }
            }
        }
    }
}

private fun onLoginSuccess(
    resp: ResponseLogInDTO,
    context: Context,
    globalVM: GlobalViewModel,
    coroutineScope: CoroutineScope,
    snackbarHostState: SnackbarHostState
) {
    // Save session ID
    globalVM.updateProfile(resp.user_profile)
    globalVM.saveSessionId(resp.session_id, context)
    globalVM.updateSnackBarType(SnackbarType.Success)
    coroutineScope.launch {
        launch {
            snackbarHostState.showSnackbar(
                message = "Đăng nhập thành công",
                withDismissAction = true,
                duration = SnackbarDuration.Short
            )
        }
        delay(2000)
        globalVM.navigate(AppScreen.MAP, true)
    }

}

private fun onLoginFailure(
    err: Throwable,
    globalVM: GlobalViewModel,
    coroutineScope: CoroutineScope,
    snackbarHostState: SnackbarHostState
) {
    val msg = when (err) {
        is UnAuthorizedError -> err.msg
        is ApiError -> err.messageText
        else -> "Đã xảy ra lỗi. Xin vui lòng thử lại"
    }

    coroutineScope.launch {
        globalVM.updateSnackBarType(SnackbarType.Error)
        coroutineScope.launch {
            launch {
                snackbarHostState.showSnackbar(
                    message = msg,
                    withDismissAction = true,
                    duration = SnackbarDuration.Short
                )
            }

        }
    }

}



