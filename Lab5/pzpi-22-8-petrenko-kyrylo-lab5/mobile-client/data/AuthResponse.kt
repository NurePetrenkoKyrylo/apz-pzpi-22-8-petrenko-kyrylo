package com.example.pharmacyapp.data

import com.google.gson.annotations.SerializedName

data class AuthResponse(
    @SerializedName("accessToken")
    val token: String
)
