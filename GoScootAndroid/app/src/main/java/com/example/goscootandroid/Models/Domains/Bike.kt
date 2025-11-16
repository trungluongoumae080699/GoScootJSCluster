package com.example.goscootandroid.Models.Domains
import android.annotation.SuppressLint
import kotlinx.serialization.Serializable


@Serializable
enum class BikeType {
    SCOOTER,
    BIKE
}


@SuppressLint("UnsafeOptInUsageError")
@Serializable
data class Bike(
    val id: String,
    val name: String,
    val battery_status: Int?,
    val maximum_speed: Int,
    val maximum_functional_distance: Int
)