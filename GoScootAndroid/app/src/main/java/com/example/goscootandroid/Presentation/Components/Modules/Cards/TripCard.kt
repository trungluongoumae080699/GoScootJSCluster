package com.example.goscootandroid.Presentation.Components.Modules.Cards

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.example.goscootandroid.Models.Domains.Trip
import com.example.goscootandroid.Models.Domains.TripStatus
import com.example.goscootandroid.Presentation.Screens.MyTrips
import com.example.goscootandroid.Utility.formatDateTime

@Composable
fun TripCard(
    trip: Trip,
    onClick: () -> Unit
){
    val interaction = remember { MutableInteractionSource() }
    val isPressed by interaction.collectIsPressedAsState()

    val statusColor = when (trip.trip_status) {
        TripStatus.COMPLETE   -> Color.Green
        TripStatus.CANCELLED  -> Color.Red
        TripStatus.PENDING    -> Color.Yellow
        else                  -> Color(0xFFE6B895)
    }
    val backgroundColor = if (isPressed) Color(0xFFF5F5F5
    ) else Color.White

    Box(modifier = Modifier
        .fillMaxWidth()
        .height(175.dp)
        .background(backgroundColor, RoundedCornerShape(15.dp))
        .border(1.dp, Color(0xFFDF6C20), RoundedCornerShape(15.dp))
        .clickable(
            indication = null,
            interactionSource = interaction,
            onClick = {

            }
        )
    ) {
        Column(modifier = Modifier.fillMaxSize()){
            BikeCard(
                trip.bike,
                onReserve = null,
                backgroundColor = if (isPressed) Color(0xFFE6B794) else Color(0xFFFAF0EA)
            )
            Column(
                modifier = Modifier.padding(horizontal = 16.dp)
            ){
                val reservation_date_time = formatDateTime(trip.reservation_date)
                Row(verticalAlignment = Alignment.CenterVertically){
                    Icon(imageVector = Icons.Filled.Event, contentDescription = null, tint = Color(0xFFDF6C20))
                    Spacer(modifier = Modifier.width(10.dp))
                    Text("${reservation_date_time.date},  ${reservation_date_time.time}", style = MaterialTheme.typography.bodySmall.copy(
                        color = Color(0xFF757575),
                        fontWeight = FontWeight.W500
                    ))
                }
                Row(verticalAlignment = Alignment.CenterVertically){
                    Icon(imageVector = Icons.Filled.LocationOn, contentDescription = null, tint = Color(0xFFDF6C20))
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(trip.hub.address, style = MaterialTheme.typography.bodySmall.copy(
                        color = Color(0xFF757575),
                        fontWeight = FontWeight.W500
                    ))
                }

            }

        }
        Text(trip.id,
            style = MaterialTheme.typography.bodySmall.copy(
            color = Color(0xFF757575),
            fontWeight = FontWeight.W400
        ),
            modifier = Modifier.align(Alignment.TopEnd).offset(x = -10.dp, y = 10.dp))

        Text(
            trip.trip_status.value,
            style = MaterialTheme.typography.bodySmall.copy(
                fontWeight = FontWeight.W600
            ),
            textAlign = TextAlign.Center,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .offset(y = -10.dp, x = -10.dp)
                .width(80.dp)
                .background(statusColor, RoundedCornerShape(15.dp))
                .padding(vertical = 2.dp)


        )
    }
}

@Preview
@Composable
fun Preview(){
    MyTrips()
}
