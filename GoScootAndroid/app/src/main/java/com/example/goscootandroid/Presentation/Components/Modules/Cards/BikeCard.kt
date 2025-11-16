package com.example.goscootandroid.Presentation.Components.Modules.Cards

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.goscootandroid.Models.Domains.Bike
import com.example.goscootandroid.Presentation.Components.Inputs.BrandButton
import com.example.goscootandroid.R
import com.example.goscootandroid.ui.theme.RobotoMono

@Composable
fun BatteryGauge(
    batteryStatus: Int
){
    // Convert battery % to 0f..1f scale
    val fillFraction = 0.98f * (batteryStatus.coerceIn(0, 100) / 100f)

    // Background color logic
    val fillColor = when {
        batteryStatus <= 30 -> Color.Red
        batteryStatus <= 50 -> Color.Yellow
        else -> Color.Green
    }

    Row(modifier = Modifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically){
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth(0.92f).fillMaxHeight().background(Color.White).border(0.5.dp, Color.White)){
            Row(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(fillFraction) // changed here
                    .background(fillColor)      // and here

            ) {
                // still empty as you had it
            }
        }
        Row(modifier = Modifier.fillMaxWidth(1f).fillMaxHeight(0.5f).background(Color.White)){

        }
    }
}



@Composable
fun BikeCard(
    bike: Bike?,
    backgroundColor: Color = Color(0xFFFAF0EA),
    onReserve: ((bike: Bike) -> Unit)?
){
    val bikeName: String = bike?.name ?: "___"
    val bikeId: String = bike?.id ?: "___"
    val maxSpeed = bike?.maximum_speed?.toString() ?: "___"
    val maxDistance = bike?.maximum_functional_distance?.toString() ?: "___"
    val batteryStatus = bike?.battery_status?.toString() ?: "___"

    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth().height(90.dp).background(backgroundColor, shape = RoundedCornerShape(10.dp)).padding(horizontal = 10.dp, vertical = 10.dp)){
        Row(modifier = Modifier.fillMaxHeight().aspectRatio(1f).background(Color.LightGray     , shape = RoundedCornerShape(15.dp))) {
            Image(
                painter = painterResource(R.drawable.bike_type),
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),   // full-bleed background
                contentScale = ContentScale.Crop
            )
        }
        Column(modifier = Modifier.fillMaxWidth().weight(1f)) {
            Text(bikeName, style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = FontWeight.Bold,
                lineHeight = 1.sp
            ), color = Color(0xFFDF6C20))
            Spacer(modifier = Modifier.height(1.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)){
                Text(
                    text = bikeId,
                    fontFamily = RobotoMono, fontWeight = FontWeight.W600, fontSize = 10.sp, lineHeight = 1.sp)
                Text(text = "${maxSpeed} km/h", fontFamily = RobotoMono, fontWeight = FontWeight.W600, fontSize = 10.sp, lineHeight = 1.sp)
            }
            Spacer(modifier = Modifier.height(5.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                bike?.let {
                    bike ->
                    bike.battery_status?.let {
                        status ->
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp), modifier = Modifier.width(60.dp).height(20.dp).background(Color(0xFF171717), shape = RoundedCornerShape(30.dp)).padding(horizontal = 5.dp)){
                            Row(modifier = Modifier.width(18.dp).height(9.dp)){
                                BatteryGauge(status)
                            }
                            Text(text = "${batteryStatus}%", fontFamily = RobotoMono, fontWeight = FontWeight.W600, fontSize = 10.sp, color = Color.White)
                        }
                    }

                }

                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.width(65.dp).height(20.dp).background(Color(0xFFD9D9D9), shape = RoundedCornerShape(30.dp))){
                    Icon(
                        imageVector = Icons.Filled.Bolt,
                        contentDescription = "Lightning",
                        tint = Color(0xFF757575),
                        modifier = Modifier.width(15.dp).height(15.dp)
                    )
                    Text(text = "${maxDistance} km", fontFamily = RobotoMono, fontWeight = FontWeight.W600, fontSize = 10.sp)
                }
            }
        }

        onReserve?.let {
            onReserve ->
            Row(modifier = Modifier.width(80.dp)){
                BrandButton(
                    label = "Đặt Xe",
                    onClick = {},
                    enabled = true,
                    textStyle = MaterialTheme.typography.bodySmall.copy(
                        fontWeight = FontWeight.ExtraBold
                    ),
                    contentPadding = PaddingValues(horizontal = 0.dp, vertical = 2.dp)
            )
        }
        }



    }
}



