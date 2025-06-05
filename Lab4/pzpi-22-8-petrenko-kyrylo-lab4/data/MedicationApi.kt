package com.example.pharmacyapp.data

import com.example.pharmacyapp.data.MedicationItem
import retrofit2.Response
import retrofit2.http.GET

interface MedicationApi {
    @GET("inventory/medications/")
    suspend fun getMedications(): Response<List<MedicationItem>>
}
