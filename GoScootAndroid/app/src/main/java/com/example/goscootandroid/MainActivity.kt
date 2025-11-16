package com.example.goscootandroid

import android.app.Application
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.goscootandroid.Presentation.Components.Layouts.RootView
import com.example.goscootandroid.Presentation.Components.Modules.MapModule
import com.example.goscootandroid.Presentation.Screens.CameraScreen

import com.example.goscootandroid.Presentation.Screens.MapScreen
import com.example.goscootandroid.Presentation.Screens.MyTrips
import com.example.goscootandroid.Presentation.Screens.TripDetailScreen
import com.example.goscootandroid.Presentation.ViewModel.GlobalViewModel
import com.example.goscootandroid.ui.theme.GoScootAndroidTheme
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class GoScootApp : Application()

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.light(
                android.graphics.Color.TRANSPARENT,   // background
                android.graphics.Color.TRANSPARENT    // contrast
            ),
            navigationBarStyle = SystemBarStyle.light(
                android.graphics.Color.TRANSPARENT,
                android.graphics.Color.TRANSPARENT
            )
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
        }
        setContent { CameraScreen() }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Column(modifier.fillMaxSize().background(Color.Red)) {  }
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    GoScootAndroidTheme {
        Greeting("Android")
    }
}