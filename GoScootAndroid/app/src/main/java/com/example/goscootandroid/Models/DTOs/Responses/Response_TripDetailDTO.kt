package com.example.goscootandroid.Models.DTOs.Responses

import android.annotation.SuppressLint
import com.example.goscootandroid.Models.Domains.Bike
import com.example.goscootandroid.Models.Domains.BikeHub
import com.example.goscootandroid.Models.Domains.Trip
import kotlinx.serialization.Serializable

@SuppressLint("UnsafeOptInUsageError")
@Serializable
data class Response_TripDetailDTO(
    val trip: Trip,
    val bike: Bike,
    val hub: BikeHub
)