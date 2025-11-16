package com.example.goscootandroid.Presentation.Components.Layouts

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.rememberNavController
import com.example.goscootandroid.EnvironmentObjects.LocalGlobalViewModelProvider
import com.example.goscootandroid.Presentation.Components.Modules.AppSnackbarHost
import com.example.goscootandroid.Presentation.ViewModel.GlobalViewModel
import com.example.goscootandroid.ui.theme.GoScootAndroidTheme
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.example.goscootandroid.Presentation.Screens.CameraScreen
import com.example.goscootandroid.Presentation.Screens.EntryScreen
import com.example.goscootandroid.Presentation.Screens.ForgetPasswordScreen
import com.example.goscootandroid.Presentation.Screens.LogInScreen
import com.example.goscootandroid.Presentation.Screens.MapScreen
import com.example.goscootandroid.Presentation.Screens.MyTrips
import com.example.goscootandroid.Presentation.Screens.SignUpScreen
import com.example.goscootandroid.Presentation.Screens.TripDetailScreen
import com.example.goscootandroid.Presentation.ViewModel.AppScreen
import com.example.goscootandroid.Presentation.ViewModel.NavEvent

@Composable
fun RootView() {
    val globalVM: GlobalViewModel = hiltViewModel()
    val snackbarHostState = remember { SnackbarHostState() }
    val nav = rememberNavController()

    // If your GlobalViewModel emits navigation intents, handle them here:
    // LaunchedEffect(globalVM.navCommands) { ... nav.navigate(...) }

    LaunchedEffect(Unit) {
        globalVM.navEvents.collect { evt ->
            when (evt) {
                is NavEvent.To -> {
                    if (evt.popUpTo != null) {
                        nav.navigate(evt.route) {
                            popUpTo(evt.popUpTo) { inclusive = evt.inclusive }
                            launchSingleTop = true
                        }
                    } else {
                        nav.navigate(evt.route) { launchSingleTop = true }
                    }
                }
                NavEvent.Back -> nav.popBackStack()
            }
        }
    }

    GoScootAndroidTheme {
        CompositionLocalProvider(LocalGlobalViewModelProvider provides globalVM) {
            // Full-screen background + overlay (snackbar lives in Scaffold below)
            Box(modifier = Modifier
                .fillMaxSize()
                .background(Color.White)) {
                // Navigation host (like NavigationStack in SwiftUI)
                TripDetailScreen()

                // If you want an always-on overlay (bottom tabs, sheets, etc.), add here
                // e.g. BottomBar(), NotificationSheet(), etc.
            }
        }

    }
}

@Composable
fun AppNavHost(
    nav: NavHostController,
    snackbarHostState: SnackbarHostState
) {
    Scaffold(
        // Custom snackbar host (your AppSnackbarHost)
        snackbarHost = { AppSnackbarHost(hostState = snackbarHostState) }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
        ) {
            NavHost(
                navController = nav,
                startDestination = AppScreen.ENTRY.name,

            ) {
                composable(AppScreen.ENTRY.name) {
                    EntryScreen()
                }
                composable(AppScreen.LOGIN.name) {
                    LogInScreen()
                }
                composable(AppScreen.SIGNUP.name) {
                    SignUpScreen()
                }
                composable(AppScreen.FORGET_PASSWORD.name) {
                    ForgetPasswordScreen()
                }
                composable(AppScreen.MAP.name) {
                    MapScreen()
                }
                composable(AppScreen.CAMERA.name){
                    CameraScreen()
                }
                composable(AppScreen.TRIP_DETAIL.name){
                    TripDetailScreen()
                }
                composable(AppScreen.MY_TRIPS.name){
                    MyTrips()
                }
            }
        }
    }
}