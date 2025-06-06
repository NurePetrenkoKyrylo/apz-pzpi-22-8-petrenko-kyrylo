package com.example.pharmacyapp.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.pharmacyapp.data.AuthRepository
import com.example.pharmacyapp.data.Transaction
import com.example.pharmacyapp.data.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class AuthViewModel(private val repository: AuthRepository) : ViewModel() {

    private val _token = MutableStateFlow<String?>(null)
    val token: StateFlow<String?> = _token

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user

    init {
        getCurrentUser()
    }

    private val _transactions = MutableStateFlow<List<Transaction>>(emptyList())
    val transactions: StateFlow<List<Transaction>> = _transactions


    fun login(email: String, password: String) {
        viewModelScope.launch {
            try {
                val response = repository.login(email, password)
                repository.saveToken(response.token)
                _token.value = response.token
                _error.value = null
                getCurrentUser()
            } catch (e: Exception) {
                _error.value = "Login failed: ${e.message}"
            }
        }
    }

    fun register(email: String, password: String, firstName: String, lastName: String) {
        viewModelScope.launch {
            if (email.isBlank() || password.isBlank() || firstName.isBlank() || lastName.isBlank()) {
                _error.value = "Please fill all fields"
                return@launch
            }

            try {
                val response = repository.register(email, password, firstName, lastName)
                repository.saveToken(response.token)
                _token.value = response.token
                _error.value = null
                getCurrentUser()
            } catch (e: Exception) {
                _error.value = "Registration failed: ${e.message}"
            }
        }
    }

    fun getCurrentUser() {
        viewModelScope.launch {
            try {
                val currentUser = repository.getCurrentUser()
                _user.value = currentUser
            } catch (e: Exception) {
                if (e.message?.contains("HTTP 401") != true) {
                    _error.value = "Failed to load user: ${e.message}"
                }
            }
        }
    }

    fun loadTransactionHistory(userEmail: String, pharmacyIds: List<String>) {
        viewModelScope.launch {
            try {
                val allTransactions = pharmacyIds.flatMap { id ->
                    repository.getPharmacyTransactions(id)
                }
                val userTransactions = allTransactions.filter {
                    it.customerDetails.email == userEmail
                }
                _transactions.value = userTransactions
            } catch (e: Exception) {
                Log.e("AuthViewModel", "Error loading transactions", e)
                _error.value = "Failed to load transactions: ${e.message}"
            }
        }
    }

}
