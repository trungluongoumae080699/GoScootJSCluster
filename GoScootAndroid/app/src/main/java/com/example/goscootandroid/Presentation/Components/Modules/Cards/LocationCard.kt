package com.example.goscootandroid.Presentation.Components.Modules.Cards

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Directions
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
import androidx.compose.ui.unit.dp
import com.example.goscootandroid.Models.Domains.Destination
import com.example.goscootandroid.Presentation.Components.Inputs.BrandButton
import com.mapbox.search.autocomplete.PlaceAutocompleteSuggestion
import kotlinx.coroutines.launch

@Composable
fun LocationCard(
    suggestion: PlaceAutocompleteSuggestion,
    onCardClick: ()-> Unit,
    onButtonClick: () -> Unit
){
    val interaction = remember { MutableInteractionSource() }
    val isPressed by interaction.collectIsPressedAsState()
    val backgroundColor = if (isPressed) Color(0xFFF5F5F5
    ) else Color.White

    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(5.dp),
        modifier = Modifier.background(backgroundColor).clickable{
            onCardClick()
        }
    ) {
        Icon(imageVector = Icons.Filled.LocationOn, contentDescription = null, tint = Color(0xFFDF6C20))
        Column(modifier = Modifier.weight(1f)){
            Text(suggestion.name, style = MaterialTheme.typography.bodyLarge.copy(
                fontWeight = FontWeight.W700
            ))
            suggestion.formattedAddress?.let { address ->
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
                   onButtonClick()
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