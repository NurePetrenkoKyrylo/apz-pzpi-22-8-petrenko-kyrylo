package com.example.pharmacyapp.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.pharmacyapp.data.MedicationRepository
import com.example.pharmacyapp.data.MedicationItem
import com.example.pharmacyapp.data.PurchaseRequest
import com.example.pharmacyapp.data.UserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class MedicationViewModel(
    private val repository: MedicationRepository,
    private val userRepository: UserRepository
) : ViewModel() {
    private val _medications = MutableStateFlow<List<MedicationItem>>(emptyList())
    private val _error = MutableStateFlow<String?>(null)

    val medications: StateFlow<List<MedicationItem>> = _medications
    val error: StateFlow<String?> = _error

    fun fetchMedications() {
        viewModelScope.launch {
            try {
                val meds = repository.getAllMedications()
                _medications.value = meds
                _error.value = null
            } catch (e: Exception) {
                _error.value = "Failed to load medications: ${e.message}"
                _medications.value = emptyList()
            }
        }
    }

    fun purchaseMedication(request: PurchaseRequest, onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = userRepository.purchaseMedication(request)
            onResult(success)
        }
    }
}

