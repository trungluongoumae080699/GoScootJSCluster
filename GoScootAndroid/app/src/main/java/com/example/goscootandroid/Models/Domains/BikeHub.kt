package com.example.goscootandroid.Models.Domains

import android.annotation.SuppressLint
import kotlinx.serialization.Serializable

@SuppressLint("UnsafeOptInUsageError")
@Serializable
data class BikeHub(
    val id: String,
    val address: String,
    val longitude: Double,
    val latitude: Double
)