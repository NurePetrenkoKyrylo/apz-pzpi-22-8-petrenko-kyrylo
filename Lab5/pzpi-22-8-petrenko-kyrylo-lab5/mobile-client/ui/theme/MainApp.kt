package com.example.pharmacyapp.ui.theme

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.example.pharmacyapp.viewmodel.AuthViewModel
import com.example.pharmacyapp.viewmodel.MedicationViewModel

@Composable
fun MainApp(
    medicationViewModel: MedicationViewModel,
    authViewModel: AuthViewModel
) {
    var selectedScreen by remember { mutableStateOf(Screen.HOME) }

    Scaffold(
        bottomBar = {
            BottomNavigationBar(selected = selectedScreen, onSelected = { selectedScreen = it })
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (selectedScreen) {
                Screen.HOME -> MainScreen(medicationViewModel)
                Screen.PROFILE -> ProfileScreen(viewModel = authViewModel)
            }
        }
    }
}

