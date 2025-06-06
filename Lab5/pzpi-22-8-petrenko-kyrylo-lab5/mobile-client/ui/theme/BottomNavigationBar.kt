package com.example.pharmacyapp.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

@Composable
fun BottomNavigationBar(selected: Screen, onSelected: (Screen) -> Unit) {
    NavigationBar(containerColor = Color.White) {
        Screen.values().forEach { screen ->
            NavigationBarItem(
                selected = screen == selected,
                onClick = { onSelected(screen) },
                icon = { Icon(screen.icon, contentDescription = screen.title) },
                label = { Text(screen.title) }
            )
        }
    }
}
