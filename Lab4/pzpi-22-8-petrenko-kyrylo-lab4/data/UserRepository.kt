package com.example.pharmacyapp.data

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory


class UserRepository(private val authRepository: AuthRepository) {
    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val authInterceptor = Interceptor { chain ->
        val original = chain.request()
        val token = authRepository.getToken()

        val request = if (token != null) {
            original.newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
        } else {
            original
        }

        chain.proceed(request)
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(logging)
        .addInterceptor(authInterceptor)
        .build()

    private val api: UserApi = Retrofit.Builder()
        .baseUrl("http://10.0.2.2:5000/")
        .addConverterFactory(GsonConverterFactory.create())
        .client(client)
        .build()
        .create(UserApi::class.java)

    suspend fun purchaseMedication(request: PurchaseRequest): Boolean {
        return try {
            val response = api.purchaseMedication(request)
            response.isSuccessful
        } catch (e: Exception) {
            false
        }
    }

    suspend fun getCurrentUser(): User {
        return api.getCurrentUser()
    }
}
