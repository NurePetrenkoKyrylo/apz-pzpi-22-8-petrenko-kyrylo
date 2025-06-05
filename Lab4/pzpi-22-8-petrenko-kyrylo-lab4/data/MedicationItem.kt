package com.example.pharmacyapp.data

data class MedicationItem(
    val _id: String,
    val pharmacy: Pharmacy,
    val medication: Medication,
    val price: Int,
    val manufactureDate: String, // або Long, якщо перетворюєш ISO8601 на timestamp
    val quantity: Int,
    val batchCode: String,
    val normalRange: NormalRange?
)

data class Pharmacy(
    val _id: String,
    val name: String,
    val address: String
)

data class Medication(
    val _id: String,
    val name: String,
    val category: String,
    val manufacturer: String,
    val isPrescriptionOnly: Boolean? = false // nullable бо в JSON не завжди є
)

data class NormalRange(
    val temperature: MinMax,
    val humidity: MinMax
)

data class MinMax(
    val min: Int,
    val max: Int
)


