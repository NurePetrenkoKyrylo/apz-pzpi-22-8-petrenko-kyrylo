package com.example.pharmacyapp.ui.theme

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.pharmacyapp.data.MedicationItem
import com.example.pharmacyapp.data.PurchaseRequest
import com.example.pharmacyapp.viewmodel.MedicationViewModel

@Composable
fun MainScreen(viewModel: MedicationViewModel = viewModel()) {
    val meds by viewModel.medications.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.fetchMedications()
    }

    Column(modifier = Modifier.padding(16.dp)) {
        Text(
            text = "PharmacyGo",
            style = MaterialTheme.typography.headlineLarge,
            color = Color(0xFF2E7D32)
        )
        Spacer(Modifier.height(8.dp))
        LazyColumn {
            items(meds) { item ->
                MedicationCard(item = item, viewModel = viewModel)
            }
        }
    }
}

@Composable
fun MedicationCard(
    item: MedicationItem,
    viewModel: MedicationViewModel
) {
    val context = LocalContext.current

    Card(
        modifier = Modifier
            .padding(8.dp)
            .fillMaxWidth(),
        elevation = CardDefaults.cardElevation(6.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = item.medication.name,
                    style = MaterialTheme.typography.titleLarge,
                    color = Color(0xFF2E7D32)
                )
                item.medication.isPrescriptionOnly?.let {
                    Text(
                        text = if (it) "℞" else "OTC",
                        color = if (it) Color.Red else Color.Gray,
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            }

            Text(
                text = "Категорія: ${item.medication.category}",
                style = MaterialTheme.typography.bodyMedium
            )
            Text(
                text = "Виробник: ${item.medication.manufacturer}",
                style = MaterialTheme.typography.bodyMedium
            )

            Spacer(Modifier.height(8.dp))

            Text(
                text = "Аптека: ${item.pharmacy.name}",
                style = MaterialTheme.typography.bodySmall
            )
            Text(
                text = item.pharmacy.address,
                style = MaterialTheme.typography.bodySmall
            )

            Spacer(Modifier.height(4.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Ціна: ${item.price} ₴",
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    text = "Кількість: ${item.quantity}",
                    style = MaterialTheme.typography.bodyLarge
                )
            }

            Text(
                text = "Серія: ${item.batchCode}",
                style = MaterialTheme.typography.bodySmall
            )

            item.normalRange?.let { range ->
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "Температура: ${range.temperature.min}–${range.temperature.max}°C",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "Вологість: ${range.humidity.min}–${range.humidity.max}%",
                    style = MaterialTheme.typography.bodySmall
                )
            }

            Spacer(Modifier.height(8.dp))

            Button(
                onClick = {
                    val purchaseRequest = PurchaseRequest(
                        email = "ivanov@example.com",
                        medicationId = item._id,
                        pharmacyId = item.pharmacy._id,
                        quantity = 1,
                        useBonusPoints = false
                    )
                    viewModel.purchaseMedication(purchaseRequest) { success ->
                        Toast.makeText(
                            context,
                            if (success) "Успішна покупка!" else "Не вдалося купити",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF2E7D32),
                    contentColor = Color.White
                )
            ) {
                Text("Купити")
            }
        }
    }
}