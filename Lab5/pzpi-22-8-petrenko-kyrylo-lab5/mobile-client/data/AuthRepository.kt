package com.example.pharmacyapp.data

import android.util.Log
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class AuthRepository {
    private var authToken: String? = null

    fun saveToken(token: String?) {
        authToken = token
        if (token == null) {
            Log.w("AuthRepository", "Saving null token")
        }
    }

    fun getToken(): String? {
        return authToken
    }

    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val authInterceptor = Interceptor { chain ->
        val original = chain.request()
        val token = authToken

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

    private val api: AuthApi = Retrofit.Builder()
        .baseUrl("http://10.0.2.2:5000/")
        .addConverterFactory(GsonConverterFactory.create())
        .client(client)
        .build()
        .create(AuthApi::class.java)

    suspend fun login(email: String, password: String): AuthResponse {
        val response = api.login(AuthRequest(email, password))
        if (response.token == null) {
            throw IllegalStateException("Server returned null token")
        }
        return response
    }

    suspend fun register(email: String, password: String, firstName: String, lastName: String): AuthResponse {
        return api.register(RegisterRequest(email, password, firstName, lastName))
    }

    suspend fun getCurrentUser(): User {
        return api.getCurrentUser()
    }

    suspend fun getPharmacyTransactions(pharmacyId: String): List<Transaction> {
        return try {
            api.getPharmacyTransactions(pharmacyId)
        } catch (e: Exception) {
            Log.e("AuthRepository", "Error getting transactions", e)
            emptyList()
        }
    }
}