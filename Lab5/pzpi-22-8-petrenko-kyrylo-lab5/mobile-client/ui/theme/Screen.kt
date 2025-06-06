package com.example.pharmacyapp.ui.theme

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.ui.graphics.vector.ImageVector

enum class Screen(val title: String, val icon: ImageVector) {
    HOME("Головна", Icons.Filled.Home),
    PROFILE("Профіль", Icons.Filled.Person)
}
