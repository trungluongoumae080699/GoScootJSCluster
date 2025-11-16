package com.example.goscootandroid.Presentation.Components.Inputs

import android.annotation.SuppressLint
import android.graphics.drawable.Icon
import android.icu.number.IntegerWidth
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.LinearOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Directions
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * BrandButton that mimics the SwiftUI BrandButtonStyle.
 */
@Composable
fun BrandButton(
    label: String,
    icon: ImageVector? = null,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    // Colors
    normalColor: Color = Color(0xFFDF6C20),
    pressedColor: Color = Color(0xFFDF6C20).copy(alpha = 0.7f),
    disabledColor: Color = Color(0xFFDF6C20).copy(alpha = 0.7f),

    textColor: Color = Color.White,
    pressedTextColor: Color = Color.White.copy(alpha = 0.9f),
    disabledTextColor: Color = Color.White.copy(alpha = 0.6f),
    // Layout
    width: Dp? = null,
    height: Dp? = null,
    cornerRadius: Dp = 25.dp,
    contentPadding: PaddingValues = PaddingValues(horizontal = 16.dp, vertical = 10.dp),
    // Behavior
    enabled: Boolean = true,
    // 🔹 Kiểu chữ có thể truyền vào (mặc định dùng labelLarge)
    textStyle: TextStyle = MaterialTheme.typography.labelLarge,
    iconWidth: Dp = 15.dp,
    iconHeight: Dp = 15.dp,
    iconModifier: Modifier = Modifier.padding(2.dp)

) {
    val interaction = remember { MutableInteractionSource() }
    val isPressed by interaction.collectIsPressedAsState()

    // Animated colors
    val backgroundTarget = when {
        !enabled -> disabledColor
        isPressed -> pressedColor
        else -> normalColor
    }
    val foregroundTarget = when {
        !enabled -> disabledTextColor
        isPressed -> pressedTextColor
        else -> textColor
    }

    val backgroundColor by animateColorAsState(
        targetValue = backgroundTarget,
        animationSpec = tween(150, easing = LinearOutSlowInEasing),
        label = "btnBg"
    )
    val foregroundColor by animateColorAsState(
        targetValue = foregroundTarget,
        animationSpec = tween(150, easing = LinearOutSlowInEasing),
        label = "btnFg"
    )

    val baseModifier = (width?.let { modifier.width(it) } ?: modifier.fillMaxWidth())
        .then(if (height != null) Modifier.height(height) else Modifier)

    Row(
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
        modifier = baseModifier
            .clip(RoundedCornerShape(cornerRadius))
            .background(backgroundColor)
            .clickable(
                enabled = enabled,
                indication = null,
                interactionSource = interaction,
                onClick = onClick
            )
            .padding(contentPadding),

        ) {
        if(icon != null){
            Icon(
                imageVector = icon,
                contentDescription = "Lightning",
                tint = foregroundColor,
                modifier = iconModifier.width(iconWidth).height(iconHeight)
            )
        }
        Text(
            text = label,
            style = textStyle.copy(color = foregroundColor)
        )
    }
}
