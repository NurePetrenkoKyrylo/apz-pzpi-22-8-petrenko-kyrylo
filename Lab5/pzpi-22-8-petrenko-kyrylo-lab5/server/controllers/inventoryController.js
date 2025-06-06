const mongoose = require('mongoose');
const MedicationInPharmacy = require('../models/MedicationInPharmacy');
const StorageConditionHistory = require('../models/StorageConditionHistory');
const IoTDevice = require('../models/IoTDevice');
const WriteOff = require('../models/WriteOff');
const Transaction = require("../models/Transaction");

/*
getAllMedications: Повертає список усіх медикаментів з можливістю обрання конкретної аптеки.

addMedicationToInventory: Додає новий медикамент в інвентар конкретної аптеки.

updateMedicationQuantity: Оновлює кількість медикаментів в інвентарі аптеки.

getLowInventory: Повертає список медикаментів з низьким рівнем запасів,
щоб попередити про потребу в поповненні.

checkStorageConditions: Перевіряє умови зберігання, використовуючи дані сенсорів IoT,
і відображає повідомлення про їх відповідність встановленим нормам.

generateRestockRecommendations: Автоматично генерує рекомендації для поповнення запасів,
якщо їх кількість нижча за певний поріг або в них майже закінчився срок придатності.

getInventoryStatistics: Повертає статистику щодо запасів, включаючи загальну кількість
медикаментів, середню ціну для кожного медикаменту та кількість проданих у середньому за місяць.

getTransactionHistory: Повертає список виданих препаратів за вказаний час.
*/

class InventoryController {

    async getAllMedications(request, response) {
        try {
            const { pharmacyId } = request.query;
            const query = pharmacyId ? { pharmacy: pharmacyId } : {};

            const medications = await MedicationInPharmacy.find(query)
                .populate('pharmacy', 'name address')
                .populate('medication', 'name category manufacturer isPrescriptionOnly');

            response.status(200).json(medications);
        } catch (error) {
            response.status(500).json({ message: "Не вдалося отримати медикаменти.", error: error.message });
        }
    }

    async addMedicationToInventory(req, res) {
        try {
            const { pharmacyId, medicationId, price, manufactureDate, quantity, batchCode } = req.body;

            const medicationInPharmacy = new MedicationInPharmacy({
                pharmacy: pharmacyId,
                medication: medicationId,
                price,
                manufactureDate,
                quantity,
                batchCode
            });

            await medicationInPharmacy.save();
            res.status(201).json({ message: 'Медикамент додано до інвентаря аптеки' });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при додаванні медикаменту', error });
        }
    }

    async updateMedicationQuantity(req, res) {
        try {
            const { medicationInPharmacyId, newQuantity } = req.body;
            const medicationInPharmacy = await MedicationInPharmacy.findById(medicationInPharmacyId);

            if (!medicationInPharmacy) {
                return res.status(404).json({ message: 'Медикамент не знайдено' });
            }

            medicationInPharmacy.quantity = newQuantity;
            await medicationInPharmacy.save();

            res.status(200).json({ message: 'Кількість медикаменту оновлено' });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при оновленні кількості медикаменту', error });
        }
    }

    async getLowInventory(req, res) {
        try {
            const threshold = req.query.threshold || 10;
            const lowInventory = await MedicationInPharmacy.find({ quantity: { $lt: threshold } })
                .populate('pharmacy') // Додаємо populate для pharmacy
                .populate('medication'); // Додаємо populate для medication
            res.status(200).json(lowInventory);
        } catch (error) {
            res.status(500).json({ message: 'Помилка при отриманні низьких запасів', error });
        }
    }

    async checkStorageConditions(req, res) {
        try {
            const { pharmacyId } = req.params;
            const storageHistory = await StorageConditionHistory.find({ pharmacy: pharmacyId })
                .sort({ date: -1 })
                .limit(1);

            if (!storageHistory || storageHistory.length === 0) {
                return res.status(404).json({ message: 'Дані про умови зберігання не знайдено' });
            }

            const { temperature, humidity } = storageHistory[0];
            const iotDevice = await IoTDevice.findOne({ pharmacy: pharmacyId });

            if (
                temperature < iotDevice.normalRange.temperature.min ||
                temperature > iotDevice.normalRange.temperature.max ||
                humidity < iotDevice.normalRange.humidity.min ||
                humidity > iotDevice.normalRange.humidity.max
            ) {
                res.status(200).json({ message: 'Умови зберігання виходять за допустимі межі', temperature, humidity });
            } else {
                res.status(200).json({ message: 'Умови зберігання в нормі', temperature, humidity });
            }
        } catch (error) {
            res.status(500).json({ message: 'Помилка при перевірці умов зберігання', error });
        }
    }

    async generateRestockRecommendations(req, res) {
        try {
            const threshold = req.query.threshold || 10;

            const currentTime = new Date();

            const recommendations = await MedicationInPharmacy.find({
                $or: [
                    { quantity: { $lt: threshold } },
                    {
                        $expr: {
                            $lt: [
                                { $divide: [
                                        { $subtract: [currentTime, "$manufactureDate"] },
                                        { $multiply: ["$expirationTime", 86400000] } // перетворюємо термін придатності з днів у мілісекунди
                                    ] },
                                0.95
                            ]
                        }
                    }
                ]
            })
                .populate('medication')
                .populate('pharmacy');

            const result = recommendations.map(item => {
                const expirationTimeInMilliseconds = item.medication.expirationTime * 86400000;
                const timeElapsed = (currentTime - item.manufactureDate) / expirationTimeInMilliseconds;
                const isNearExpiration = timeElapsed >= 0.95;
                const isLowStock = item.quantity < threshold;

                if (!isNearExpiration && !isLowStock) return null;

                const reason = isNearExpiration
                    ? 'Наближення до закінчення терміну придатності'
                    : 'Низький рівень запасів';

                return {
                    pharmacy: item.pharmacy?.name || 'Невідома аптека',
                    medication: item.medication?.name || 'Невідомий медикамент',
                    currentQuantity: item.quantity,
                    manufactureDate: item.manufactureDate,
                    expirationTime: item.medication?.expirationTime,
                    recommendedQuantity: threshold * 2,
                    reason
                };
            }).filter(Boolean);

            res.status(200).json(result);
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: 'Помилка при створенні рекомендацій для поповнення', error });
        }
    }

    async getInventoryStatistics(req, res) {
        try {
            const statistics = await MedicationInPharmacy.aggregate([
                {
                    $group: {
                        _id: "$medication",
                        totalQuantity: { $sum: "$quantity" },
                        averagePrice: { $avg: "$price" },
                        medicationInPharmacyIds: { $push: "$_id" }
                    }
                },
                {
                    $lookup: {
                        from: "medications",
                        localField: "_id",
                        foreignField: "_id",
                        as: "medication"
                    }
                },
                {
                    $unwind: {
                        path: "$medication",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "transactions",
                        localField: "medicationInPharmacyIds",
                        foreignField: "medication",
                        as: "salesData"
                    }
                },
                {
                    $addFields: {
                        totalSalesQuantity: { $sum: "$salesData.quantity" },
                        firstSaleDate: { $min: "$salesData.date" }
                    }
                },
                {
                    $addFields: {
                        monthsSinceFirstSale: {
                            $cond: {
                                if: { $and: [{ $ne: ["$firstSaleDate", null] }, { $ne: ["$firstSaleDate", []] }] },
                                then: {
                                    $ceil: {
                                        $divide: [
                                            { $subtract: [new Date(), "$firstSaleDate"] },
                                            1000 * 60 * 60 * 24 * 30
                                        ]
                                    }
                                },
                                else: 0
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        averageSalesPerMonth: {
                            $cond: {
                                if: { $gt: ["$monthsSinceFirstSale", 0] },
                                then: { $divide: ["$totalSalesQuantity", "$monthsSinceFirstSale"] },
                                else: 0
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0, // Виключаємо _id
                        medication: "$medication.name",
                        totalQuantity: 1,
                        averagePrice: { $round: ["$averagePrice", 2] },
                        averageSalesPerMonth: { $round: ["$averageSalesPerMonth", 2] }
                    }
                },
                {
                    $sort: { medication: 1 }
                }
            ]);

            res.status(200).json(statistics);
        } catch (error) {
            console.error('Error in getInventoryStatistics:', error);
            res.status(500).json({ message: 'Помилка при отриманні статистики запасів', error: error.message });
        }
    }

    async getSalesReport(req, res) {
        try {
            const { pharmacyId, startDate, endDate, category, medicationId } = req.query;

            // Формуємо об’єкт для $match
            const match = {};
            if (pharmacyId) {
                match['medicationDetails.pharmacy'] = new mongoose.Types.ObjectId(pharmacyId);
            }
            if (medicationId) {
                match.medication = new mongoose.Types.ObjectId(medicationId);
            }
            if (startDate || endDate) {
                match.date = {};
                if (startDate) match.date.$gte = new Date(startDate);
                if (endDate) match.date.$lte = new Date(endDate);
            }

            const pipeline = [
                {
                    $lookup: {
                        from: 'medicationinpharmacies',
                        localField: 'medication',
                        foreignField: '_id',
                        as: 'medicationDetails',
                    },
                },
                { $unwind: '$medicationDetails' },
                {
                    $lookup: {
                        from: 'medications',
                        localField: 'medicationDetails.medication',
                        foreignField: '_id',
                        as: 'medicationInfo',
                    },
                },
                { $unwind: '$medicationInfo' },
                ...(category ? [{ $match: { 'medicationInfo.category': category } }] : []),
                { $match: match },
                {
                    $group: {
                        _id: {
                            medication: '$medication',
                            name: '$medicationInfo.name',
                        },
                        totalQuantity: { $sum: '$quantity' },
                        totalRevenue: { $sum: { $multiply: ['$quantity', '$price'] } },
                    },
                },
                {
                    $sort: { totalQuantity: -1 },
                },
                {
                    $group: {
                        _id: null,
                        totalQuantity: { $sum: '$totalQuantity' },
                        totalRevenue: { $sum: '$totalRevenue' },
                        medications: {
                            $push: {
                                medication: '$_id.name',
                                quantity: '$totalQuantity',
                                revenue: '$totalRevenue',
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalQuantity: 1,
                        totalRevenue: 1,
                        topMedications: { $slice: ['$medications', 5] },
                    },
                },
            ];

            const transactions = await Transaction.aggregate(pipeline);

            res.status(200).json(transactions[0] || { totalQuantity: 0, totalRevenue: 0, topMedications: [] });
        } catch (error) {
            console.error('Error in getSalesReport:', error);
            res.status(500).json({ message: 'Помилка при створенні звіту по продажах', error: error.message });
        }
    }

    async getInventorySnapshot(req, res) {
        try {
            const { pharmacyId, medicationId } = req.query;
            const query = {};
            if (pharmacyId) query.pharmacy = pharmacyId;
            if (medicationId) query.medication = medicationId;

            const snapshot = await MedicationInPharmacy.find(query)
                .populate('medication', 'name')
                .select('medication quantity');

            res.status(200).json(snapshot);
        } catch (error) {
            res.status(500).json({ message: 'Помилка при отриманні знімку запасів', error: error.message });
        }
    }

    async writeOffMedication(req, res) {
        try {
            const { medicationInPharmacyId, quantity, reason } = req.body;
            const userId = req.user._id;

            if (!medicationInPharmacyId || !quantity || !reason) {
                return res.status(400).json({ message: 'Усі поля (medicationInPharmacyId, quantity, reason) є обов’язковими' });
            }

            const medInPharmacy = await MedicationInPharmacy.findById(medicationInPharmacyId);
            if (!medInPharmacy) {
                return res.status(404).json({ message: 'Медикамент не знайдено в аптеці' });
            }

            if (medInPharmacy.quantity < quantity) {
                return res.status(400).json({ message: 'Недостатня кількість для списання' });
            }

            medInPharmacy.quantity -= quantity;
            await medInPharmacy.save();

            await WriteOff.create({
                user: userId,
                medication: medInPharmacy.medication,
                pharmacy: medInPharmacy.pharmacy,
                quantity,
                reason,
                date: new Date(),
            });

            res.status(200).json({ message: 'Медикамент успішно списано' });
        } catch (error) {
            console.error('Error in writeOffMedication:', error);
            res.status(500).json({ message: 'Помилка при списанні медикаменту', error: error.message });
        }
    }

    async getWriteOffReport(req, res) {
        try {
            const { pharmacyId, startDate, endDate, reason } = req.query;

            const match = {};
            if (pharmacyId) match.pharmacy = new mongoose.Types.ObjectId(pharmacyId);
            if (reason) match.reason = reason;
            if (startDate || endDate) {
                match.date = {};
                if (startDate) match.date.$gte = new Date(startDate);
                if (endDate) match.date.$lte = new Date(endDate);
            }

            const writeOffs = await WriteOff.find(match)
                .populate('medication', 'name')
                .select('medication quantity reason');

            const totalQuantity = writeOffs.reduce((sum, w) => sum + w.quantity, 0);
            const reasons = writeOffs.reduce((acc, w) => {
                acc[w.reason] = (acc[w.reason] || 0) + w.quantity;
                return acc;
            }, {});
            const topMedications = writeOffs
                .reduce((acc, w) => {
                    const med = acc.find(m => m.medication === w.medication.name && m.reason === w.reason) || {
                        medication: w.medication.name,
                        quantity: 0,
                        reason: w.reason,
                    };
                    med.quantity += w.quantity;
                    if (!acc.includes(med)) acc.push(med);
                    return acc;
                }, [])
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            res.status(200).json({ totalQuantity, reasons, topMedications });
        } catch (error) {
            console.error('Error in getWriteOffReport:', error);
            res.status(500).json({ message: 'Помилка при створенні звіту по списаннях', error: error.message });
        }
    }

    async getTransactionHistory(req, res) {
        try {
            const { pharmacyId } = req.params;
            const { startDate, endDate } = req.query;

            if (!pharmacyId) {
                return res.status(400).json({ message: "Pharmacy ID обов'язковий." });
            }

            const dateFilter = {};
            if (startDate) {
                dateFilter.$gte = new Date(startDate);
            }
            if (endDate) {
                dateFilter.$lte = new Date(endDate);
            }


            const transactions = await Transaction.aggregate([
                {
                    $lookup: {
                        from: "medicationinpharmacies",
                        localField: "medication",
                        foreignField: "_id",
                        as: "medicationDetails"
                    }
                },
                {
                    $unwind: "$medicationDetails"
                },
                {
                    $match: {
                        "medicationDetails.pharmacy": new mongoose.Types.ObjectId(pharmacyId),
                        ...(startDate || endDate ? { date: dateFilter } : {})
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "customer",
                        foreignField: "_id",
                        as: "customerDetails"
                    }
                },
                {
                    $unwind: "$customerDetails"
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "pharmacist",
                        foreignField: "_id",
                        as: "pharmacistDetails"
                    }
                },
                {
                    $unwind: "$pharmacistDetails"
                },
                {
                    $lookup: {
                        from: "medications",
                        localField: "medicationDetails.medication",
                        foreignField: "_id",
                        as: "medicationInfo"
                    }
                },
                {
                    $unwind: "$medicationInfo"
                },
                {
                    $project: {
                        _id: 1,
                        quantity: 1,
                        date: 1,
                        price: 1,
                        "customerDetails.firstName": 1,
                        "customerDetails.lastName": 1,
                        "customerDetails.email": 1,
                        "pharmacistDetails.firstName": 1,
                        "pharmacistDetails.lastName": 1,
                        "medicationInfo.name": 1,
                        "medicationInfo.isPrescriptionOnly": 1,
                        "medicationDetails.price": 1,
                        "medicationDetails.batchCode": 1,
                        "medicationDetails.manufactureDate": 1,
                        "medicationDetails.quantity": 1
                    }
                }
            ]);

            res.status(200).json(transactions);
        } catch (error) {
            res.status(500).json({ message: 'Помилка при отриманні історії транзакцій', error });
        }
    }
}

module.exports = new InventoryController();