package com.example.goscootandroid.Presentation.Components.Modules

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.example.goscootandroid.Models.Domains.Bike
import com.example.goscootandroid.Presentation.Components.Layouts.RootView
import com.example.goscootandroid.Presentation.Screens.MapScreen
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.abs


@Composable
fun ModalBottomSheet(
    sheetState: MutableState<Boolean>,
    clickGoThrough: Boolean = false,
    snapPoints: List<Float> = listOf(0.3f, 0.5f, 0.8f),
    content: @Composable () -> Unit
){
    val screenHeightDp = LocalConfiguration.current.screenHeightDp.dp
    val density = LocalDensity.current
    val screenHeightPx = with(density) { screenHeightDp.toPx() }
    val bottomSheetHeightsInPx = remember(snapPoints, screenHeightDp){
        snapPoints.map{ screenHeightPx * it }
    }
    val scope = rememberCoroutineScope()
    val animatedBottomSheetHeights = remember { Animatable(bottomSheetHeightsInPx.first()) }
    val animatedBottomSheetOffsets = remember { Animatable(bottomSheetHeightsInPx.first()) }
    val interactionSource = remember { MutableInteractionSource() }

    val dragState = rememberDraggableState { delta ->
        scope.launch {
            val newHeight = animatedBottomSheetHeights.value - delta
            if (newHeight < bottomSheetHeightsInPx.first()){
                val newOffset = (animatedBottomSheetOffsets.value + delta).coerceIn(0f, bottomSheetHeightsInPx.first())
                animatedBottomSheetOffsets.snapTo(newOffset)
            } else {
                val actualNewHeight = (animatedBottomSheetHeights.value - delta)
                    .coerceIn(bottomSheetHeightsInPx.first(), bottomSheetHeightsInPx.last())
                animatedBottomSheetHeights.snapTo(actualNewHeight)
            }

        }
    }
    val sheetHeightDp = with(density) { animatedBottomSheetHeights.value.toDp() }
    val sheetOffsetDp = with(density){animatedBottomSheetOffsets.value.toDp()}

    LaunchedEffect(sheetState) {
        if (sheetState.value){
            animatedBottomSheetOffsets.animateTo(0f, tween(300))
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.Transparent)){
        if (clickGoThrough){
            Box(
                modifier = Modifier.fillMaxSize().background(Color.Gray)
            ){

            }
        }
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .height(sheetHeightDp)
                .offset(y = sheetOffsetDp)
                .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
                .background(Color.White)
                .align(Alignment.BottomCenter)
                .clickable(
                    indication = null,
                    interactionSource = interactionSource,
                    onClick = {}
                )
        ) {
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth().height(30.dp)){
                Box(
                    modifier = Modifier
                        .width(30.dp)
                        .height(5.dp)
                        .clip(RoundedCornerShape(15.dp))
                        .background(Color.Black)
                        .padding(10.dp)
                        .draggable(
                            state = dragState,
                            orientation = Orientation.Vertical,
                            onDragStarted = {
                                println("Drag Detected....")
                            },
                            onDragStopped = {
                                val current = animatedBottomSheetHeights.value
                                val currentOffset = animatedBottomSheetOffsets.value
                                if (current != bottomSheetHeightsInPx[0]){
                                    val target = bottomSheetHeightsInPx.minByOrNull { abs(it - current) }
                                        ?: bottomSheetHeightsInPx[1]
                                    scope.launch {
                                        animatedBottomSheetHeights.animateTo(target, tween(300))
                                    }
                                } else {
                                    val offsetSpectrum: List<Float> = listOf(0f, bottomSheetHeightsInPx[0])
                                    val targetOffset = offsetSpectrum.minByOrNull {
                                        abs(it - currentOffset)
                                    } ?: 0f

                                    scope.launch {
                                        animatedBottomSheetOffsets.animateTo(targetOffset, tween(300))
                                        if (targetOffset > 0f){
                                            sheetState.value = false
                                        }
                                    }
                                }




                            }
                        )


                )
            }
            content()



        }
    }


}



