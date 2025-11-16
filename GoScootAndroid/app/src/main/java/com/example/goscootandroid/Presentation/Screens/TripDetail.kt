package com.example.goscootandroid.Presentation.Screens

import com.example.goscootandroid.R
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.goscootandroid.Models.Domains.TripStatus
import com.example.goscootandroid.Presentation.Components.Modules.Cards.BikeCard
import com.example.goscootandroid.Presentation.ViewModel.TripManagementViewModel
import com.example.goscootandroid.Utility.TimePattern
import com.example.goscootandroid.Utility.formatDateTime
import com.google.zxing.BarcodeFormat
import com.journeyapps.barcodescanner.BarcodeEncoder
import kotlinx.coroutines.delay
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Preview
@Composable
fun TripDetailScreen(
    vm: TripManagementViewModel = hiltViewModel(),
){
    val trip by vm.trip.collectAsState()
    val validPeriod = remember { mutableStateOf<Long>(0) }

    LaunchedEffect(trip) {
        while (validPeriod.value >= 0){
            trip?.let {
                trip ->
                validPeriod.value = trip.reservation_expiry - System.currentTimeMillis()

                delay(1000)
            }
        }
    }

    Scaffold(modifier = Modifier.background(Color.White)) {
        padding ->
        Column(
            modifier = Modifier.fillMaxSize().background(Color.White)) {
            Spacer(modifier = Modifier.height(30.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.height(70.dp),
            ){
                IconButton(
                    modifier = Modifier.clip(CircleShape).size(35.dp),
                    onClick = {}
                ) {
                    Icon(
                        imageVector = Icons.Filled.ArrowBack,
                        contentDescription = "Search",
                        tint = Color.Black
                    )
                }
                Text("Chi Tiết Hành Trình", textAlign = TextAlign.Center, style = MaterialTheme.typography.bodyLarge.copy(
                    fontSize = 18.sp,
                    fontWeight = FontWeight.W600
                ), modifier = Modifier.fillMaxWidth().weight(1f))
                Spacer(modifier = Modifier.width(45.dp))

            }
            Column(modifier = Modifier.fillMaxSize().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement =
                if (trip == null) Arrangement.Center else Arrangement.Top  ){
                if (trip == null){
                    CircularProgressIndicator(
                        modifier = Modifier.size(40.dp),
                        strokeWidth = 4.dp,
                        color = Color(0xFFDF6C20) // màu brand của bạn
                    )
                } else {
                    trip?.let { selectedTrip ->
                        val statusColor = when (selectedTrip.trip_status) {
                            TripStatus.COMPLETE   -> Color.Green
                            TripStatus.CANCELLED  -> Color.Red
                            TripStatus.PENDING    -> Color.Yellow
                            else                  -> Color(0xFFE6B895)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                            Image(
                                painter = painterResource(id = R.drawable.moto_hub),
                                contentDescription = "App Logo",
                                modifier = Modifier.size(50.dp)
                            )
                            Column {
                                Row(verticalAlignment = Alignment.Bottom) {
                                    val formattedDateTime = formatDateTime(selectedTrip.reservation_date,
                                        TimePattern.HH_MM)
                                    val formattedDate = formattedDateTime.date
                                    val formattedTime = formattedDateTime.time

                                    Text(formattedDate, style = MaterialTheme.typography.bodySmall.copy(
                                        fontWeight = FontWeight.W400
                                    ))
                                    Spacer(modifier = Modifier.width(20.dp))
                                    Text(formattedTime, style = MaterialTheme.typography.bodySmall.copy(
                                        fontWeight = FontWeight.W400
                                    ))
                                    Spacer(modifier = Modifier.fillMaxWidth().weight(1f))
                                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier
                                        .offset(y = -5.dp)
                                        .height(20.dp)
                                        .clip(RoundedCornerShape(15.dp))
                                        .background(statusColor)
                                        .padding(horizontal = 10.dp)

                                    ){
                                        Text(
                                            selectedTrip.trip_status.value,
                                            style = MaterialTheme.typography.bodySmall.copy(
                                                fontWeight = FontWeight.W600
                                            ),
                                            textAlign = TextAlign.Center


                                        )
                                    }

                                }
                                Row(){
                                    Text("Địa Chỉ:", style = MaterialTheme.typography.bodySmall.copy(
                                        fontWeight = FontWeight.W500
                                    ))
                                    Spacer(modifier = Modifier.width(3.dp))
                                    val address = selectedTrip.hub.address
                                    Text(address, style = MaterialTheme.typography.bodySmall)

                                }
                                Row(horizontalArrangement = Arrangement.spacedBy(20.dp)){
                                    Row(){
                                        Text("Bắt Đầu:", style = MaterialTheme.typography.bodySmall.copy(
                                            fontWeight = FontWeight.W500
                                        ))
                                        Spacer(modifier = Modifier.width(3.dp))
                                        var tripStartDateText = "___"
                                        selectedTrip.trip_start_date?.let {
                                                tripStartDate ->
                                            val dateTime = formatDateTime(tripStartDate,
                                                TimePattern.HH_MM)
                                            val time = dateTime.time
                                            tripStartDateText = "${time}"

                                        }
                                        Text(tripStartDateText, style = MaterialTheme.typography.bodySmall)

                                    }
                                    Row(){
                                        Text("Kết Thúc:", style = MaterialTheme.typography.bodySmall.copy(
                                            fontWeight = FontWeight.W500
                                        ))
                                        Spacer(modifier = Modifier.width(3.dp))
                                        var tripEndDateText = "___"
                                        selectedTrip.trip_end_date?.let {
                                                tripEndDate ->
                                            val dateTime = formatDateTime(tripEndDate,  TimePattern.HH_MM)
                                            val date = dateTime.date
                                            val time = dateTime.time
                                            tripEndDateText = "${date} ${time}"

                                        }
                                        Text(tripEndDateText, style = MaterialTheme.typography.bodySmall)

                                    }


                                }
                                Row(){
                                    Text("Chi Phí:", style = MaterialTheme.typography.bodySmall.copy(
                                        fontWeight = FontWeight.W500
                                    ))
                                    Spacer(modifier = Modifier.width(3.dp))
                                    var priceText = "___"
                                    selectedTrip.price?.let {
                                            price -> priceText = price.toString()
                                    }
                                    Text(priceText, style = MaterialTheme.typography.bodySmall)

                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        BikeCard(selectedTrip.bike, onReserve = null)
                        Spacer(modifier = Modifier.height(10.dp))
                        if (selectedTrip.trip_secret != null){
                            val encoder = BarcodeEncoder()
                            val payload = Json.encodeToString(selectedTrip)
                            val bitmap = encoder.encodeBitmap(
                                payload,
                                BarcodeFormat.QR_CODE,
                                256,
                                256
                            )
                            Column(modifier = Modifier.width(300.dp), horizontalAlignment = Alignment.CenterHorizontally){
                                Text("Để mở khoá xe, xin vui lòng đặt mã QR trước camera xe", style = MaterialTheme.typography.bodyLarge.copy(
                                    fontWeight = FontWeight.W700
                                ), textAlign = TextAlign.Center, modifier = Modifier.width(280.dp))
                                Spacer(modifier = Modifier.height(10.dp))
                                Box() {

                                    Image(
                                        bitmap = bitmap.asImageBitmap(),
                                        contentDescription = "QR Code",
                                        modifier = Modifier.size(300.dp)
                                    )

                                    if (validPeriod.value > 0 ){
                                        val time = formatDateTime(
                                            validPeriod.value,
                                            timePattern = TimePattern.MM_SS
                                        ).time
                                        Row(modifier = Modifier.align(Alignment.Center).offset(y = -145.dp)) {
                                            Text("Hiệu lực trong: ")
                                            Text(time)
                                        }
                                    }
                                }

                            }



                        }
                    }
                }
            }


        }
    }
}


