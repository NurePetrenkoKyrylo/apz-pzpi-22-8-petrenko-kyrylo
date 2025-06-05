package com.example.pharmacyapp.data

data class Transaction(
    val id: String,
    val quantity: Int,
    val date: String,
    val price: Int,
    val medicationInfo: MedicationInfo,
    val customerDetails: CustomerDetails,
    val pharmacistDetails: PharmacistDetails
)

data class MedicationInfo(
    val name: String
)

data class CustomerDetails(
    val firstName: String,
    val lastName: String,
    val email: String
)

data class PharmacistDetails(
    val firstName: String,
    val lastName: String
)
