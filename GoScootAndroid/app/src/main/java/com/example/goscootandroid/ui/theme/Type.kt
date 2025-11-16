package com.example.goscootandroid.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Set of Material typography styles to start with
import androidx.compose.ui.text.font.Font

import com.example.goscootandroid.R

val BeVietnamPro = FontFamily(
    Font(R.font.be_vietnam_pro_extra_light, FontWeight.ExtraLight),
    Font(R.font.be_vietnam_pro_light, FontWeight.Light),
    Font(R.font.be_vietnam_pro_regular, FontWeight.Normal),
    Font(R.font.be_vietnam_pro_medium, FontWeight.Medium),
    Font(R.font.be_vietnam_pro_semi_bold, FontWeight.SemiBold),
    Font(R.font.be_vietnam_pro_bold, FontWeight.Bold),
    Font(R.font.be_vietnam_pro_extra_bold, FontWeight.ExtraBold),
    Font(R.font.be_vietnam_pro_black, FontWeight.Black)
)

val RobotoMono = FontFamily(
    Font(
        resId = R.font.roboto_mono_variable_font_wght,
        weight = FontWeight.Normal // Compose will interpolate weights automatically
    )
)

val Typography = Typography(
    bodyLarge = TextStyle(
        fontFamily = BeVietnamPro,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp,
        lineHeight = 22.sp,   // ~1.46× font size → comfortable for paragraphs
        letterSpacing = 0.3.sp
    ),

    bodyMedium = TextStyle(
        fontFamily = BeVietnamPro,
        fontWeight = FontWeight.Medium,
        fontSize = 15.sp,
        lineHeight = 20.sp,   // ~1.43× font size → balanced for forms/text
        letterSpacing = 0.25.sp
    ),

    bodySmall = TextStyle(
        fontFamily = BeVietnamPro,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 18.sp,   // ~1.38× font size → subtle supporting text
        letterSpacing = 0.2.sp
    ),

    titleLarge = TextStyle(
        fontFamily = BeVietnamPro,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 24.sp,
        lineHeight = 32.sp,   // ~1.33× → crisp headline
        letterSpacing = 0.sp
    ),

    labelLarge = TextStyle(
        fontFamily = BeVietnamPro,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 25.sp,   // ~1.38× font size → well-balanced for buttons/headings
        letterSpacing = 0.15.sp
    ),

    labelSmall = TextStyle(
        fontFamily = BeVietnamPro,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,   // ~1.33× → perfect for captions/links
        letterSpacing = 0.4.sp
    )
)

fun Typography.withDefaultFont(font: FontFamily) = Typography(
    displayLarge   = displayLarge.copy(fontFamily = font),
    displayMedium  = displayMedium.copy(fontFamily = font),
    displaySmall   = displaySmall.copy(fontFamily = font),
    headlineLarge  = headlineLarge.copy(fontFamily = font),
    headlineMedium = headlineMedium.copy(fontFamily = font),
    headlineSmall  = headlineSmall.copy(fontFamily = font),
    titleLarge     = titleLarge.copy(fontFamily = font),
    titleMedium    = titleMedium.copy(fontFamily = font),
    titleSmall     = titleSmall.copy(fontFamily = font),
    bodyLarge      = bodyLarge.copy(fontFamily = font),
    bodyMedium     = bodyMedium.copy(fontFamily = font),
    bodySmall      = bodySmall.copy(fontFamily = font),
    labelLarge     = labelLarge.copy(fontFamily = font),
    labelMedium    = labelMedium.copy(fontFamily = font),
    labelSmall     = labelSmall.copy(fontFamily = font),
)