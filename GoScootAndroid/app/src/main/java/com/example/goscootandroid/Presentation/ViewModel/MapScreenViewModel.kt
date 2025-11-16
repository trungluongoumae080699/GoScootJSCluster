package com.example.goscootandroid.Presentation.ViewModel

import android.content.Context
import android.util.Log
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.goscootandroid.Models.DTOs.Responses.ResponseLogInDTO
import com.example.goscootandroid.Models.Domains.Bike
import com.example.goscootandroid.Models.Domains.BikeHub
import com.example.goscootandroid.Models.Domains.Destination
import com.mapbox.search.autocomplete.PlaceAutocompleteSuggestion
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import java.io.BufferedReader
import java.io.File
import javax.inject.Inject

@HiltViewModel
class MapScreenViewModel @Inject constructor(): ViewModel() {

    private val _hubList = MutableStateFlow<List<BikeHub>>(listOf())
    val hubList: StateFlow<List<BikeHub>> = _hubList
    private val _bikeList = MutableStateFlow<List<Bike>>(listOf())
    val bikeList: StateFlow<List<Bike>> = _bikeList

    private val _routeDestination = MutableStateFlow<Double>(0.0)
    val routeDestination: StateFlow<Double> = _routeDestination

    private val _selectedHub = MutableStateFlow<BikeHub?>(null)
    val selectedHub: StateFlow<BikeHub?> = _selectedHub

    fun selectHub(hub: BikeHub){
        _selectedHub.value = hub
    }

    private val _locationSearch = MutableStateFlow<String>("")
    val locationSearch: StateFlow<String> = _locationSearch
    fun updateSearch(text: String){
        _locationSearch.value = text
    }

    private val _locationSuggestions = MutableStateFlow<List<PlaceAutocompleteSuggestion>>(listOf())
    val locationSuggestions: StateFlow<List<PlaceAutocompleteSuggestion>> = _locationSuggestions
    fun updateLocationSuggestions(suggestions: List<PlaceAutocompleteSuggestion>){
        _locationSuggestions.value = suggestions
    }


    private val _currentDestination = MutableStateFlow<Destination?>(null)
    val currentDestination: StateFlow<Destination?> = _currentDestination
    fun updateDestination(origin: Double, destination: Double){
        _currentDestination.value = Destination(
            origin,
            destination
        )
    }

    private val _currentSelectedCameraCenter = MutableStateFlow<Destination>(Destination(106.700981, 10.776889))
    val currentSelectedCameraCenter: StateFlow<Destination> = _currentSelectedCameraCenter
    fun updateCameraCenter(center: Destination){
        _currentSelectedCameraCenter.value = center
    }



    fun fetchBikeHubAsync(
        context: Context,

        //onSuccess: (ResponseLogInDTO) -> Unit,
        //onError: (Throwable) -> Unit
        ) {
        viewModelScope.launch {
            val json = context.assets.open("bike_hubs.json").bufferedReader().use(BufferedReader::readText)
            _hubList.value = Json.decodeFromString(json)
            Log.d("Hubs", "${_hubList.value.size}")

        }
    }

    fun fetchBikeListAsync(
        context: Context
    ){
        viewModelScope.launch {
            val json = context.assets.open("bikes.json").bufferedReader().use(BufferedReader::readText)
            _bikeList.value = Json.decodeFromString(json)

        }
    }


}