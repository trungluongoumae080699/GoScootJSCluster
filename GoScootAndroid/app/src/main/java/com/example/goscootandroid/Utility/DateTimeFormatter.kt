package com.example.goscootandroid.Utility

import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

data class FormattedDateTime(
    val date: String,
    val time: String
)
enum class TimePattern(val value: String) {
    HH_MM_SS("HH:mm:ss"),
    HH_MM("HH:mm"),
    MM_SS("mm:ss")
}

fun formatDateTime(
    timeAsLong: Long,
    timePattern: TimePattern = TimePattern.HH_MM,
): FormattedDateTime {
    val dateTime =
        Instant.ofEpochMilli(timeAsLong).atZone(
            ZoneId.systemDefault())
            .toLocalDateTime()
    val dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    val timeFormatter = DateTimeFormatter.ofPattern(timePattern.value)
    val date = dateTime.toLocalDate()
    val time = dateTime.toLocalTime().withNano(0)
    val formattedDate = date.format(dateFormatter)
    val formattedTime = time.format(timeFormatter)
    return FormattedDateTime(
        date = formattedDate,
        time = formattedTime
    )
}