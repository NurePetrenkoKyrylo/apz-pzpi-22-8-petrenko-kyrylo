package com.example.pharmacyapp.data

data class User(
    val firstName: String,
    val lastName: String,
    val role: String,
    val email: String,
    val bonusPoints: Int = 0,
    val transactionHistory: List<Transaction> = emptyList()
)

