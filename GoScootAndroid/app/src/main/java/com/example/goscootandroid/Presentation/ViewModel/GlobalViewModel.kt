package com.example.goscootandroid.Presentation.ViewModel
import android.annotation.SuppressLint
import android.app.Application
import android.content.Context
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTimeFilled
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHostState
import androidx.compose.ui.graphics.Color
import androidx.datastore.preferences.core.edit
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.goscootandroid.EnvironmentObjects.SessionKeys
import com.example.goscootandroid.EnvironmentObjects.dataStore
import com.example.goscootandroid.Models.DTOs.Responses.ResponseLogInDTO
import com.example.goscootandroid.Models.Domains.Customer
import com.example.goscootandroid.Models.Domains.Destination
import com.example.goscootandroid.Repository.AuthenticationRepository
import com.example.goscootandroid.Repository.IgnorableError
import dagger.hilt.android.internal.Contexts.getApplication
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import javax.inject.Inject

/* ---------- Navigation Destinations ---------- */
enum class AppScreen {
    ENTRY,
    LOGIN,
    SIGNUP,
    FORGET_PASSWORD,
    MAP,
    MY_TRIPS,
    CAMERA,
    TRIP_DETAIL
}

/* ---------- Snackbar Type Enum ---------- */
enum class SnackbarType {
    Success, Error, Wait, Info;

    val color: Color
        get() = when (this) {
            Success -> Color(0xFF4CAF50)
            Error   -> Color(0xFFE53935)
            Wait    -> Color(0xFFFFB300)
            Info    -> Color(0xFF2196F3)
        }

    val icon
        get() = when (this) {
            Success -> Icons.Filled.CheckCircle
            Error   -> Icons.Filled.Error
            Wait    -> Icons.Filled.AccessTimeFilled
            Info    -> Icons.Filled.Info
        }
}

sealed class NavEvent {
    data class To(val route: String, val popUpTo: String? = null, val inclusive: Boolean = false) : NavEvent()
    data object Back : NavEvent()
}

/* ---------- ViewModel ---------- */
@HiltViewModel
class GlobalViewModel @Inject constructor(
    private val authRepo: AuthenticationRepository
) : ViewModel() {

    private val _navEvents = MutableSharedFlow<NavEvent>(extraBufferCapacity = 1)
    val navEvents = _navEvents.asSharedFlow()
    private val _currentScreen = MutableStateFlow(AppScreen.ENTRY)
    val currentScreen: StateFlow<AppScreen> = _currentScreen

    private val _snackbarType = MutableStateFlow(SnackbarType.Success)
    val snackbarType: StateFlow<SnackbarType> = _snackbarType

    private val _profile = MutableStateFlow<Customer?>(null)
    val profile: StateFlow<Customer?> = _profile

    fun updateProfile(customer: Customer?) {
        _profile.value = customer
    }

    private val _sessionId = MutableStateFlow<String?>(null)
    val sessionId: StateFlow<String?> = _sessionId

    fun updateSessionId(sessionId: String?) {
        _sessionId.value = sessionId
    }



    // For simplicity, you can store a Trip model later here
    private val _reservedTrip = MutableStateFlow<Any?>(null)
    val reservedTrip: StateFlow<Any?> = _reservedTrip

    /* -------- Navigation -------- */
    fun navigate(to: AppScreen, toClearStack: Boolean) {
        var pop: String? = null
        if (toClearStack){
            pop = _currentScreen.value.name
        }
        _currentScreen.value = to
        _navEvents.tryEmit(NavEvent.To(_currentScreen.value.name, popUpTo = pop, inclusive = false))
    }

    fun goBack() {
        _navEvents.tryEmit(NavEvent.Back)
    }

    fun resetNavigation() {
        _currentScreen.value = AppScreen.ENTRY
    }

    fun updateSnackBarType(type: SnackbarType){
        _snackbarType.value = type
    }
    /* -------- Session-based Login -------- */
    fun logInBySessionId(
        context: Context,
        onSuccess: (ResponseLogInDTO) -> Unit,
        onError: (Throwable) -> Unit
    ) {
        viewModelScope.launch {
            try {
                // 1) Read sessionId from DataStore
                val sessionId = context.dataStore.data
                    .map { prefs -> prefs[SessionKeys.SESSION_ID] }
                    .firstOrNull()

                if (sessionId.isNullOrBlank()) {
                    onError(IgnorableError("No stored session id"))
                    return@launch
                }

                // 2) Call API
                val resp = authRepo.logInWithSessionId(sessionId)

                // 3) Update state
                _profile.value = resp.user_profile
                _sessionId.value = resp.session_id

                // 4) Callback
                onSuccess(resp)
            } catch (t: Throwable) {
                onError(t)
            }
        }
    }

    /* -------- Session Persistence -------- */
    fun saveSessionId(sessionId: String, context: Context) {
        _sessionId.value = sessionId
        viewModelScope.launch {
            context.dataStore.edit { prefs ->
                prefs[SessionKeys.SESSION_ID] = sessionId
            }
        }
    }

    fun clearSession() {
        _sessionId.value = null
        _profile.value = null
    }
}