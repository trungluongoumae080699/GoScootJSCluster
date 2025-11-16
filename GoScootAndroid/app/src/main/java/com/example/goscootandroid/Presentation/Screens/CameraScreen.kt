package com.example.goscootandroid.Presentation.Screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.goscootandroid.Presentation.Components.Modules.CameraPreview
import com.example.goscootandroid.Presentation.Components.Modules.ScanBoxOverlay
import com.example.goscootandroid.Presentation.Components.PermissionWrappers.CameraPermissionWrapper

@Composable
fun CameraScreen() {
    CameraPermissionWrapper {
        Box(Modifier.fillMaxSize()) {
            CameraPreview()
            ScanBoxOverlay()
            IconButton(
                modifier = Modifier.align(Alignment.TopStart).offset(x = 5.dp, y = 40.dp).clip(CircleShape).background(Color.White).size(45.dp),
                onClick = { }
            ) {
                Icon(
                    imageVector = Icons.Filled.ArrowBack,  // or any other icon
                    contentDescription = "Search",
                    tint = Color.Black
                )
            }
            Text("Scan mã QR của xe để đặt xe", style = MaterialTheme.typography.bodyLarge.copy(
                fontWeight = FontWeight.W700,
                fontSize = 18.sp,
                color = Color(0xFFDF6C20)
            ), modifier = Modifier.align(Alignment.Center).offset(y = -200.dp))
        }
    }
}