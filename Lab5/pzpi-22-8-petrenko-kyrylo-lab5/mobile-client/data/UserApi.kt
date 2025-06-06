package com.example.pharmacyapp.data

import com.example.pharmacyapp.data.PurchaseRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface UserApi {
    @POST("user/purchase/")
    suspend fun purchaseMedication(@Body request: PurchaseRequest): Response<Unit>

    @GET("user/")
    suspend fun getCurrentUser(): User
}
