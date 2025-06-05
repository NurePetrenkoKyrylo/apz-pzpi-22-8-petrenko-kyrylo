package com.example.pharmacyapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.rememberNavController
import com.example.pharmacyapp.data.AuthRepository
import com.example.pharmacyapp.data.MedicationRepository
import com.example.pharmacyapp.data.UserRepository
import com.example.pharmacyapp.viewmodel.AuthViewModel
import com.example.pharmacyapp.viewmodel.AuthViewModelFactory
import com.example.pharmacyapp.ui.theme.MainApp
import com.example.pharmacyapp.viewmodel.MedicationViewModel
import com.example.pharmacyapp.viewmodel.MedicationViewModelFactory



class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val authRepository = AuthRepository()
        val userRepository = UserRepository(authRepository)
        val medicationRepository = MedicationRepository(authRepository)

        val authFactory = AuthViewModelFactory(authRepository)
        val medicationFactory = MedicationViewModelFactory(medicationRepository, userRepository)

        setContent {
            val navController = rememberNavController()

            val authViewModel: AuthViewModel = viewModel(factory = authFactory)
            val medicationViewModel: MedicationViewModel = viewModel(factory = medicationFactory)

            AppNavigation(
                navController = navController,
                authViewModel = authViewModel,
                medicationViewModel = medicationViewModel
            )
        }
    }
}
