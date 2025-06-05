package com.example.pharmacyapp

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.example.pharmacyapp.ui.theme.LoginScreen
import com.example.pharmacyapp.ui.theme.MainApp
import com.example.pharmacyapp.ui.theme.MainScreen
import com.example.pharmacyapp.ui.theme.RegisterScreen
import com.example.pharmacyapp.viewmodel.AuthViewModel
import com.example.pharmacyapp.viewmodel.MedicationViewModel

@Composable
fun AppNavigation(
    navController: NavHostController,
    authViewModel: AuthViewModel,
    medicationViewModel: MedicationViewModel
) {
    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            LoginScreen(
                viewModel = authViewModel,
                onSuccess = {
                    navController.navigate("main") {
                        popUpTo("login") { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate("register")
                }
            )
        }

        composable("main") {
            MainApp(
                medicationViewModel = medicationViewModel,
                authViewModel = authViewModel
            )
        }


        composable("register") {
            RegisterScreen(
                viewModel = authViewModel,
                onRegisterSuccess = {
                    navController.navigate("login") {
                        popUpTo("register") { inclusive = true }
                    }
                }
            )
        }
    }
}
