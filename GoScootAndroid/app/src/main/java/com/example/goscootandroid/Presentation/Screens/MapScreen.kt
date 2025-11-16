package com.example.goscootandroid.Presentation.Screens
import com.example.goscootandroid.R

import android.graphics.BitmapFactory
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Directions
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.goscootandroid.Models.Domains.Destination
import com.example.goscootandroid.Presentation.Components.Inputs.BrandButton
import com.example.goscootandroid.Presentation.Components.Inputs.InputField
import com.example.goscootandroid.Presentation.Components.Modules.AppSnackbarHost
import com.example.goscootandroid.Presentation.Components.Modules.Cards.BikeCard
import com.example.goscootandroid.Presentation.Components.Modules.MapModule
import com.example.goscootandroid.Presentation.Components.Modules.ModalBottomSheet
import com.example.goscootandroid.Presentation.ViewModel.MapScreenViewModel
import com.mapbox.search.autocomplete.PlaceAutocomplete
import kotlinx.coroutines.launch


@Composable
fun MapScreen(modifier: Modifier = Modifier, vm: MapScreenViewModel = hiltViewModel()) {
    val hubs by vm.hubList.collectAsState()
    val selectedHub by vm.selectedHub.collectAsState()
    val bikes by vm.bikeList.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val destination by vm.currentDestination.collectAsState()
    val locationSearch by vm.locationSearch.collectAsState()
    val suggestions by vm.locationSuggestions.collectAsState()
    val currentSelectedCameraCenter by vm.currentSelectedCameraCenter.collectAsState()
    
    val hubIcon = BitmapFactory.decodeResource(context.resources, R.drawable.moto_hub)
    //val globalVM = LocalGlobalViewModelProvider.current
    val sheetState = remember {mutableStateOf(false)}
    val locationSearchSheetState = remember {mutableStateOf(false)}
    val snackbarHostState = remember { SnackbarHostState() }
    val placeAutocomplete = PlaceAutocomplete.create()



    LaunchedEffect(Unit) {
        try {
            vm.fetchBikeHubAsync(context)

        } catch (e: Exception) {
            e.printStackTrace()
            // or println("Error: ${e.message}")
        }
    }

    LaunchedEffect(locationSearch) {
        val response = placeAutocomplete.suggestions(
            query = locationSearch,
        )

        if (response.isValue) {
            val suggestions = requireNotNull(response.value)
            if (suggestions.isNotEmpty()) {
                vm.updateLocationSuggestions(suggestions)
            }
        } else {

        }

    }

    Scaffold(
        snackbarHost = {
            AppSnackbarHost(
                hostState = snackbarHostState,
            )
        }
    ) {
        paddingValues ->
        Box(modifier = Modifier.fillMaxSize().background(Color.Red)) {
            MapModule(
                selectedCameraCenter = currentSelectedCameraCenter,
                setCameraCenter = {
                    center -> vm.updateCameraCenter(center)
                },
                destination,
                hubs,
                onHubClick = {
                    hub ->
                    sheetState.value = true
                    vm.selectHub(hub)
                    vm.fetchBikeListAsync(context)
                }
                )
            IconButton(
                modifier = Modifier.align(Alignment.TopStart).offset(x = 5.dp, y = 40.dp).clip(CircleShape).background(Color.White).size(45.dp),
                onClick = { locationSearchSheetState.value = true}
            ) {
                Icon(
                    imageVector = Icons.Filled.ArrowBack,  // or any other icon
                    contentDescription = "Search",
                    tint = Color.Black
                )
            }

            IconButton(
                modifier = Modifier.align(Alignment.TopStart).offset(x = 5.dp, y = 90.dp).clip(CircleShape).background(Color.White).size(45.dp),
                onClick = { locationSearchSheetState.value = true}
            ) {
                Icon(
                    imageVector = Icons.Filled.Search,  // or any other icon
                    contentDescription = "Search",
                    tint = Color.Black
                )
            }
            if (sheetState.value){
                ModalBottomSheet(sheetState) {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxSize().padding(horizontal = 10.dp)) {
                        BrandButton(
                            label = "Chỉ Đường",
                            icon = Icons.Filled.Directions,
                            onClick = {
                                val hub = selectedHub
                                if (hub != null) {
                                    vm.updateDestination(hub.longitude, hub.latitude)
                                }
                                      },
                            enabled = true,
                            textStyle = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.ExtraBold
                            ),
                            contentPadding = PaddingValues(horizontal = 0.dp, vertical = 5.dp)

                        )
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxSize()) {
                            items(bikes, key = { it.id }){bike ->
                                BikeCard(bike, onReserve = null)
                            }
                        }
                    }

                }
            }
            if (locationSearchSheetState.value){
                ModalBottomSheet(locationSearchSheetState) {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxSize().padding(horizontal = 10.dp)) {
                        InputField(
                            value = locationSearch,
                            onValueChange = {text -> vm.updateSearch(text)},
                            placeholder = "Tìm Kiếm Địa Điểm",
                            leadingIcon = Icons.Filled.Search,
                            needSProtection = false,
                            isRequired = false,

                        )
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxSize()) {
                            items(suggestions){place ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(5.dp),
                                    modifier = Modifier.clickable{
                                      scope.launch {
                                        placeAutocomplete.select(place).onValue {
                                            result ->
                                            val newLong: Double = result.coordinate.longitude()
                                            val newLat: Double = result.coordinate.latitude()
                                            vm.updateCameraCenter(Destination(newLong, newLat))
                                        }
                                      }
                                    }
                                    ) {
                                    Icon(imageVector = Icons.Filled.LocationOn, contentDescription = null, tint = Color(0xFFDF6C20))
                                    Column(modifier = Modifier.weight(1f)){
                                        Text(place.name, style = MaterialTheme.typography.bodyLarge.copy(
                                            fontWeight = FontWeight.W700
                                        ))
                                        place.formattedAddress?.let { address ->
                                            Text(address,  style = MaterialTheme.typography.bodyMedium.copy(
                                                fontWeight = FontWeight.W500
                                            ))   // now 'address' is String, not String?
                                        }

                                    }
                                    Row(modifier = Modifier.width(100.dp)){
                                        BrandButton(
                                            label = "Chỉ Đường",
                                            icon = Icons.Filled.Directions,
                                            onClick = {
                                                scope.launch {
                                                    placeAutocomplete.select(place).onValue {
                                                            result ->
                                                        val newLong: Double = result.coordinate.longitude()
                                                        val newLat: Double = result.coordinate.latitude()
                                                        vm.updateDestination(newLong, newLat)
                                                    }
                                                }
                                            },
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
                    }

                }
            }







    }


}}
