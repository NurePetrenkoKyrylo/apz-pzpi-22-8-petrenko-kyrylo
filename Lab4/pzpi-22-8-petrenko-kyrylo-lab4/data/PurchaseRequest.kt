package com.example.pharmacyapp.data

data class PurchaseRequest(
    val email: String,
    val medicationId: String,
    val pharmacyId: String,
    val quantity: Int,
    val useBonusPoints: Boolean
)
