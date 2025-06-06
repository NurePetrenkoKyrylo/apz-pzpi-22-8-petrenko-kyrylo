package com.example.pharmacyapp.data

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path

interface AuthApi {
    @POST("user/login/")
    suspend fun login(@Body request: AuthRequest): AuthResponse

    @POST("user/reg/")
    suspend fun register(@Body request: RegisterRequest): AuthResponse

    @GET("user/")
    suspend fun getCurrentUser(): User

    @GET("inventory/transactions/{pharmacyId}")
    suspend fun getPharmacyTransactions(@Path("pharmacyId") pharmacyId: String): List<Transaction>

}
