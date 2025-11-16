package com.example.goscootandroid.Presentation.Components.Modules
import com.example.goscootandroid.R
import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.RequiresPermission
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChangeHistory
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.example.goscootandroid.Models.Domains.BikeHub
import com.example.goscootandroid.Models.Domains.Destination
import com.example.goscootandroid.Presentation.Components.Inputs.BrandButton

import com.example.goscootandroid.Presentation.Components.Modules.toGson
import com.google.gson.Gson
import com.google.gson.JsonElement
import com.google.gson.JsonParser
import com.mapbox.android.gestures.MoveGestureDetector
import com.mapbox.api.directions.v5.DirectionsCriteria
import com.mapbox.api.directions.v5.models.RouteOptions
import com.mapbox.bindgen.Value
import com.mapbox.common.location.Location
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.EdgeInsets
import com.mapbox.maps.MapView
import com.mapbox.maps.Style
import com.mapbox.maps.extension.style.expressions.dsl.generated.mod
import com.mapbox.maps.plugin.LocationPuck2D
import com.mapbox.maps.plugin.animation.MapAnimationOptions
import com.mapbox.maps.plugin.animation.camera
import com.mapbox.maps.plugin.annotation.annotations
import com.mapbox.maps.plugin.annotation.generated.PointAnnotationManager
import com.mapbox.maps.plugin.annotation.generated.PointAnnotationOptions
import com.mapbox.maps.plugin.annotation.generated.createPointAnnotationManager
import com.mapbox.maps.plugin.compass.compass
import com.mapbox.maps.plugin.gestures.OnMoveListener
import com.mapbox.maps.plugin.gestures.gestures
import com.mapbox.maps.plugin.locationcomponent.createDefault2DPuck
import com.mapbox.maps.plugin.locationcomponent.location
import com.mapbox.maps.plugin.scalebar.scalebar
import com.mapbox.maps.toCameraOptions
import com.mapbox.navigation.base.ExperimentalPreviewMapboxNavigationAPI
import com.mapbox.navigation.base.extensions.applyDefaultNavigationOptions
import com.mapbox.navigation.base.options.NavigationOptions
import com.mapbox.navigation.base.route.NavigationRoute
import com.mapbox.navigation.base.route.NavigationRouterCallback
import com.mapbox.navigation.base.route.RouterFailure
import com.mapbox.navigation.core.MapboxNavigationProvider
import com.mapbox.navigation.core.replay.route.ReplayProgressObserver
import com.mapbox.navigation.core.replay.route.ReplayRouteMapper
import com.mapbox.navigation.core.trip.session.LocationMatcherResult
import com.mapbox.navigation.core.trip.session.LocationObserver
import com.mapbox.navigation.ui.maps.camera.NavigationCamera
import com.mapbox.navigation.ui.maps.camera.data.MapboxNavigationViewportDataSource
import com.mapbox.navigation.ui.maps.location.NavigationLocationProvider
import com.mapbox.navigation.ui.maps.route.line.api.MapboxRouteLineApi
import com.mapbox.navigation.ui.maps.route.line.api.MapboxRouteLineView
import com.mapbox.navigation.ui.maps.route.line.model.MapboxRouteLineApiOptions
import com.mapbox.navigation.ui.maps.route.line.model.MapboxRouteLineViewOptions
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.encodeToJsonElement
import java.nio.file.WatchEvent


@OptIn(ExperimentalPreviewMapboxNavigationAPI::class)
@Composable
fun MapModule(
    selectedCameraCenter: Destination = Destination(106.700981, 10.776889),
    setCameraCenter: (center: Destination) -> Unit,
    destination: Destination? = null,
    hubsList: List<BikeHub>,
    onHubClick: (BikeHub)-> Unit
) {
    val context = LocalContext.current
    val density = LocalDensity.current
    val permission = Manifest.permission.ACCESS_FINE_LOCATION
    val hubBitmap = remember {
        BitmapFactory.decodeResource(context.resources, R.drawable.moto_hub)
    }
    val hasPermission = remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, permission) ==
                    PackageManager.PERMISSION_GRANTED
        )
    }
    // Launcher for requesting permission
    val requestPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasPermission.value = granted
    }
    LaunchedEffect(Unit) {
        if (!hasPermission.value) {
            requestPermissionLauncher.launch(permission)
        }
    }

    val cameraFollowMode = remember {mutableStateOf(true)}
    val mapIsInitialRender = remember {mutableStateOf(true)}

    // ─────────────────────────────────────────────────────────────────────────────
    // MAP + NAVIGATION STATE HOLDERS
    // ─────────────────────────────────────────────────────────────────────────────


    val mapViewState = remember { mutableStateOf<MapView?>(null) }
    val navigationLocationProvider = remember { NavigationLocationProvider() }
    var viewportDataSource by remember { mutableStateOf<MapboxNavigationViewportDataSource?>(null) }
    var navigationCamera by remember { mutableStateOf<NavigationCamera?>(null) }
    val routeLineApi by remember {
        mutableStateOf(
            MapboxRouteLineApi(
                MapboxRouteLineApiOptions
                    .Builder()
                    .build()
            )
        )
    }
    val routeLineView by remember {
        mutableStateOf(
            MapboxRouteLineView(
                MapboxRouteLineViewOptions
                    .Builder(context)
                    .build()
            )
        )
    }

    val mapboxNavigation = remember {
        MapboxNavigationProvider.create(
            NavigationOptions
                .Builder(context)
                .build()
        )
    }

    val routesObserver = remember {
        com.mapbox.navigation.core.directions.session.RoutesObserver { routeUpdate ->
            val mv = mapViewState.value ?: return@RoutesObserver
            if (routeUpdate.navigationRoutes.isNotEmpty()) {
                // Draw the current routes into the Style
                routeLineApi.setNavigationRoutes(routeUpdate.navigationRoutes) { drawData ->
                    mv.mapboxMap.style?.let { style ->
                        routeLineView.renderRouteDrawData(style, drawData)
                    }
                }

                // Update viewport to frame the new route
                viewportDataSource?.onRouteChanged(routeUpdate.navigationRoutes.first())
                viewportDataSource?.evaluate()
                navigationCamera?.requestNavigationCameraToFollowing()
            }
        }
    }

    val locationObserver = remember {
        object : LocationObserver {
            override fun onNewRawLocation(rawLocation: Location) {
                // Raw un-snapped location (rarely needed if you prefer enhanced)
            }

            override fun onNewLocationMatcherResult(result: LocationMatcherResult) {
                val enhanced = result.enhancedLocation

                // Update the visible location puck
                navigationLocationProvider.changePosition(
                    location = enhanced,
                    keyPoints = result.keyPoints
                )

                // Feed the viewport (for camera framing)
                viewportDataSource?.onLocationChanged(enhanced)
                viewportDataSource?.evaluate()
                // Follow the user as they move
                if (cameraFollowMode.value){
                    navigationCamera?.requestNavigationCameraToFollowing()
                }


            }
        }
    }

    // 🔹 Keep a reference to the annotation manager so you can update/clear later
    var pointAnnotationManager by remember { mutableStateOf<PointAnnotationManager?>(null) }

    LaunchedEffect(selectedCameraCenter) {
        val mapView = mapViewState.value ?: return@LaunchedEffect
        val point = Point.fromLngLat(
            selectedCameraCenter.longitude,
            selectedCameraCenter.latitude
        )
        mapView.mapboxMap.setCamera(
            CameraOptions.Builder()
                .center(point)
                .zoom(14.0)
                .build()
        )

        mapView.camera.easeTo(
             CameraOptions.Builder()
                 .center(point)
                 .zoom(14.0)
                 .build(),
             MapAnimationOptions.mapAnimationOptions {
                 duration(1000L)
             }
        )
        if (!mapIsInitialRender.value){
            cameraFollowMode.value = false
            navigationCamera?.requestNavigationCameraToIdle()
        } else {
            mapIsInitialRender.value = false
        }
    }

    LaunchedEffect(destination) {
        val current = navigationLocationProvider.lastLocation
        if (destination != null && current != null) {
            Log.d("Navigation", "Requesting Routes")
            val origin = Point.fromLngLat(current.longitude, current.latitude)
            val destination = Point.fromLngLat(destination.longitude, destination.latitude)
            val coordinates: List<Point> = listOf(origin, destination)
            mapboxNavigation.requestRoutes(
                RouteOptions.builder()
                    .applyDefaultNavigationOptions()
                    .profile(DirectionsCriteria.PROFILE_DRIVING_TRAFFIC)
                    .coordinatesList(coordinates)
                    .alternatives(true)
                    .build(),
                object : NavigationRouterCallback {
                    override fun onRoutesReady(
                        routes: List<NavigationRoute>,
                        routerOrigin: String
                    ) {
                        mapboxNavigation.setNavigationRoutes(routes)
                    }
                    override fun onFailure(reasons: List<RouterFailure>, routeOptions: RouteOptions) {}
                    override fun onCanceled(routeOptions: RouteOptions, routerOrigin: String) {}
                }
            )
            navigationCamera?.requestNavigationCameraToFollowing()
        } else {
            mapboxNavigation.setNavigationRoutes(emptyList())
        }
    }
    Box(){
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                MapView(ctx).apply {
                    val mapbox = this.mapboxMap

                    mapboxMap.setCamera(
                        CameraOptions.Builder()
                            .center(Point.fromLngLat(106.700981, 10.776889))
                            .zoom(14.0)
                            //.pitch(0.0)
                            .build()
                    )
                    pointAnnotationManager = annotations.createPointAnnotationManager()

                    scalebar.updateSettings {
                        enabled = false

                    }

                    compass.updateSettings {
                        enabled = true
                        marginTop = 100f
                    }

                    location.apply {
                        setLocationProvider(navigationLocationProvider)
                        locationPuck = LocationPuck2D()
                        // locationPuck = createDefault2DPuck() // alt: Mapbox default
                        enabled = true
                    }

                    mapViewState.value = this

                    viewportDataSource = MapboxNavigationViewportDataSource(mapboxMap).also { vds ->
                        val top = with(density) { 180.dp.toPx().toDouble() }
                        val left = with(density) { 40.dp.toPx().toDouble() }
                        val bottom = with(density) { 150.dp.toPx().toDouble() }
                        val right = with(density) { 40.dp.toPx().toDouble() }
                        vds.followingPadding = EdgeInsets(top, left, bottom, right)
                    }
                    navigationCamera = NavigationCamera(mapboxMap, camera, viewportDataSource!!)

                    gestures.addOnMoveListener(object : OnMoveListener {
                        override fun onMove(detector: MoveGestureDetector): Boolean {
                            // called continuously while dragging
                            // return false to let default behavior continue
                            return false
                        }
                        override fun onMoveBegin(detector: MoveGestureDetector) {
                            cameraFollowMode.value = false
                            navigationCamera?.requestNavigationCameraToIdle()
                        }
                        override fun onMoveEnd(detector: MoveGestureDetector) {
                            val bounds = mapbox.coordinateBoundsForCamera(mapbox.cameraState.toCameraOptions())
                        }


                    })
                }
            },
            //update runs every time Composable recomposes, with the already existing MapView.
            update = { addHubAnnotations(hubBitmap, pointAnnotationManager, hubsList, onHubClick) }
        )

        if (!cameraFollowMode.value){
            Row(modifier = Modifier
                .width(120.dp)
                .align(Alignment.BottomStart)
                .offset(x = 5.dp, y = -30.dp)
            ){
                BrandButton(
                    label = "Re-center",
                    icon = Icons.Filled.ChangeHistory,
                    iconWidth = 20.dp,
                    iconHeight = 20.dp,
                    onClick = {
                        navigationCamera?.requestNavigationCameraToFollowing()
                    },
                    normalColor = Color.White,
                    pressedColor = Color.Gray,
                    textColor = Color.Blue
                )
            }
        }



    }


    DisposableEffect(Unit) {
        // Ensure the MapView exists first
        mapViewState.value?.let { mv ->
            mv.location.apply {
                setLocationProvider(navigationLocationProvider)
                locationPuck = createDefault2DPuck()
                enabled = true
            }
        }

        // Optional: observe route progress while playing back a simulated trip
        val replayProgressObserver = ReplayProgressObserver(mapboxNavigation.mapboxReplayer)

        // Register observers
        mapboxNavigation.registerRoutesObserver(routesObserver)
        mapboxNavigation.registerLocationObserver(locationObserver)
        mapboxNavigation.registerRouteProgressObserver(replayProgressObserver)

        mapboxNavigation.startTripSession()

        onDispose {
            // Unregister observers, stop sessions, and destroy singleton.
            mapboxNavigation.unregisterRoutesObserver(routesObserver)
            mapboxNavigation.unregisterLocationObserver(locationObserver)
            mapboxNavigation.stopTripSession() // or stopReplayTripSession() if you started replay
            MapboxNavigationProvider.destroy()
            mapViewState.value = null
        }
    }


}

/** Create (or refresh) point annotations for the given hubs. */
private fun addHubAnnotations(
    hubBitMap: Bitmap,
    manager: PointAnnotationManager?,
    hubs: List<BikeHub>,
    onHubClick: (BikeHub) -> Unit
) {
    val m = manager ?: return
    // Simple strategy: clear & re-create (fine for hundreds of points)
    m.deleteAll()

    // Build options for all hubs
    val options = hubs.map { hub ->

        PointAnnotationOptions()
            .withPoint(Point.fromLngLat(hub.longitude, hub.latitude))
            .withIconImage(hubBitMap)
            .withIconSize(0.2)                 // adjust if you use a custom icon
            // .withIconImage("ic_hub_pin")    // if you add an image to the style
            .withData(
                toGson(Json.encodeToJsonElement(hub))
            )
    }

    // Create and hook up clicks
    val created = m.create(options)
    m.addClickListener { ann ->
        val data: JsonElement? = ann.getData()
        val hub: BikeHub? = data?.let { Gson().fromJson(it, BikeHub::class.java) }
        hub?.let(onHubClick)
        true
    }
}

private fun toGson(json: kotlinx.serialization.json.JsonElement): com.google.gson.JsonElement =
    JsonParser.parseString(Json.encodeToString(json))