package com.example.goscootandroid.Presentation.Components.Modules


import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PaintingStyle.Companion.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.drawscope.Stroke

@Composable
fun ScanBoxOverlay() {
    Canvas(
        modifier = Modifier.fillMaxSize()
    ) {
        val overlayColor = Color(0x99000000)

        val boxWidth = size.width * 0.7f
        val boxHeight = boxWidth

        val left = (size.width - boxWidth) / 2f
        val top = (size.height - boxHeight) / 2f
        val right = left + boxWidth
        val bottom = top + boxHeight

        val outerRect = Rect(0f, 0f, size.width, size.height)
        val innerRect = Rect(left, top, right, bottom)

        val path = Path().apply {
            // Full screen rectangle
            addRect(outerRect)

            // The transparent hole
            addRoundRect(
                RoundRect(
                    rect = innerRect,
                    cornerRadius = CornerRadius(24f)
                )
            )

            fillType = PathFillType.EvenOdd
        }

        // Draw dimmed overlay except hole
        drawPath(path, color = overlayColor)

        // Draw border
        drawRoundRect(
            color = Color(0xFFDF6C20),
            topLeft = innerRect.topLeft,
            size = innerRect.size,
            cornerRadius = CornerRadius(24f),
            style = Stroke(width = 4f)
        )
    }
}

@Composable
fun CameraPreview() {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    AndroidView(
        factory = { ctx ->
            val previewView = PreviewView(ctx)
            val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
            cameraProviderFuture.addListener({
                val cameraProvider = cameraProviderFuture.get()

                // 1. Preview use case
                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

                // 2. Select which camera
                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

                try {
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        cameraSelector,
                        preview
                    )
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }, ContextCompat.getMainExecutor(ctx))

            previewView
        },
        modifier = Modifier.fillMaxSize()
    )
}