package com.example.goscootandroid.Presentation.ViewModel

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.goscootandroid.Models.DTOs.Responses.ResponseLogInDTO
import com.example.goscootandroid.Models.Domains.Bike
import com.example.goscootandroid.Models.Domains.BikeHub
import com.example.goscootandroid.Models.Domains.Trip
import com.example.goscootandroid.Models.Domains.TripStatus
import com.mapbox.maps.extension.style.expressions.dsl.generated.floor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import java.io.BufferedReader
import javax.inject.Inject
import kotlin.math.ceil

@HiltViewModel
class TripManagementViewModel @Inject constructor(): ViewModel() {

    private val _trips = MutableStateFlow<List<Trip>>(listOf())
    val trips: StateFlow<List<Trip>> = _trips

    private val _currentPage = MutableStateFlow<Int>(1)
    val page: StateFlow<Int> = _currentPage

    private val _currentPageGroupIndex = MutableStateFlow<Int>(0)
    val currentPageGroupIndex: StateFlow<Int> = _currentPageGroupIndex

    private val _pageGroup = MutableStateFlow<List<List<Int>>>(listOf(listOf(1)))
    val pageGroup: StateFlow<List<List<Int>>> = _pageGroup

    suspend fun fetchTrips(
        context: Context,
        onSuccess: () -> Unit,
        onError: (Throwable) -> Unit
    ) {
        try {
            val json = context.assets.open("trips.json").bufferedReader().use(BufferedReader::readText)
            val result: List<Trip> = Json.decodeFromString(json)
            val numberOfPages = ceil(result.size / 10.0).toInt()

            val groups = mutableListOf<List<Int>>()
            var current = mutableListOf<Int>()

            for (page in 1..numberOfPages) {
                current.add(page)

                if (current.size == 5) {
                    groups.add(current.toList())
                    current = mutableListOf()
                }
            }

            if (current.isNotEmpty()) {
                groups.add(current.toList())
            }
            _pageGroup.value = groups
            val end = page.value * 10
            val origin = end - 10
            _trips.value = result.subList(origin, end)
        } catch (err: Error){
            onError(err)
        }


    }


    private val _trip = MutableStateFlow<Trip?>(Trip(
        id = "trip_001",
        bike = Bike(
            id = "bike_003",
            name = "E-Bike 3",
            battery_status = null,
            maximum_speed = 35,
            maximum_functional_distance = 95
        ),
        hub = BikeHub(
            id = "hub_4",
            address = "16 street 7 Linh Chieu ward Thu Duc district Ho Chi Minh",
            longitude = 106.612219,
            latitude = 106.612219
        ),
        customer_id = "user_456",
        trip_status = TripStatus.IN_PROGRESS,
        reservation_date = System.currentTimeMillis(),
        reservation_expiry = System.currentTimeMillis() + (15 * 60 * 1000), // +15 minutes
        trip_start_date = System.currentTimeMillis(),
        trip_end_date = null,
        trip_end_long = null,
        trip_end_lat = null,
        trip_secret = List(32) {
            "abcdefghijklmnopqrstuvwxyz0123456789".random()
        }.joinToString(""),
        price = null,
        isPaid = null

    ))
    val trip: StateFlow<Trip?> = _trip




}