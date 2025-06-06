package com.example.pharmacyapp.data

import com.example.pharmacyapp.data.MedicationItem
import com.example.pharmacyapp.data.MedicationApi
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class MedicationRepository(private val authRepository: AuthRepository) {
    private val baseUrl = "http://10.0.2.2:5000/"

    private fun getApi(): MedicationApi {
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val token = authRepository.getToken()
                val request = chain.request().newBuilder()
                if (token != null) {
                    request.addHeader("Authorization", "Bearer $token")
                }
                chain.proceed(request.build())
            }
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .addConverterFactory(GsonConverterFactory.create())
            .client(client)
            .build()

        return retrofit.create(MedicationApi::class.java)
    }

    suspend fun getAllMedications(): List<MedicationItem> {
        val api = getApi()
        return try {
            val response = api.getMedications()
            if (response.isSuccessful) {
                response.body() ?: emptyList()
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
}

