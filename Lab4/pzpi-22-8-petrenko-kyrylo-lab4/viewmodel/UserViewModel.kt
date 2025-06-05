package com.example.pharmacyapp.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.pharmacyapp.data.User
import com.example.pharmacyapp.data.UserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class UserViewModel(private val userRepository: UserRepository) : ViewModel() {
    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user

    fun fetchUser() {
        viewModelScope.launch {
            try {
                val user = userRepository.getCurrentUser()
                _user.value = user
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}

