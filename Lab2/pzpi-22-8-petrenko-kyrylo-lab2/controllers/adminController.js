const StorageConditionHistory = require('../models/StorageConditionHistory');
const IoTDevice = require('../models/IoTDevice');
const Pharmacy = require('../models/Pharmacy');
const Medication = require('../models/Medication');
const MedicationInPharmacy = require('../models/MedicationInPharmacy');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const bcrypt = require("bcryptjs");
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { connection } = require('../config');

class AdminController {
    // Управління IoT пристроями
    async getAllIoTDevices(req, res) {
        try {
            const devices = await IoTDevice.find().populate('pharmacy');
            res.status(200).json(devices);
        } catch (error) {
            res.status(500).json({ message: 'Помилка при отриманні IoT пристроїв', error });
        }
    }

    async getDeviceConfig(req, res) {
        try {
            const { deviceId } = req.params;
            const device = await IoTDevice.findById(deviceId);
            if (!device) {
                return res.status(404).json({ message: 'IoT пристрій не знайдено' });
            }
            res.status(200).json({
                measurementInterval: device.measurementInterval,
                normalRange: device.normalRange,
            });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при отриманні конфігурації пристрою', error: error.message });
        }
    }

    async addIoTDevice(req, res) {
        try {
            const { pharmacyId, status, measurementInterval, normalRange } = req.body;
            const newDevice = new IoTDevice({
                pharmacy: pharmacyId,
                status,
                measurementInterval,
                normalRange,
            });
            await newDevice.save();
            res.status(201).json({ message: 'IoT пристрій додано успішно', device: newDevice });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при додаванні IoT пристрою', error });
        }
    }

    async updateIoTDevice(req, res) {
        try {
            const { deviceId } = req.params;
            const updatedDevice = await IoTDevice.findByIdAndUpdate(deviceId, req.body, { new: true });
            if (!updatedDevice) return res.status(404).json({ message: 'IoT пристрій не знайдено' });
            res.status(200).json({ message: 'IoT пристрій оновлено успішно', device: updatedDevice });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при оновленні IoT пристрою', error });
        }
    }

    async deleteIoTDevice(req, res) {
        try {
            const { deviceId } = req.params;
            await IoTDevice.findByIdAndDelete(deviceId);
            res.status(200).json({ message: 'IoT пристрій видалено успішно' });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при видаленні IoT пристрою', error });
        }
    }

    // Управління аптеками
    async getAllPharmacies(req, res) {
        try {
            const pharmacies = await Pharmacy.find().populate('manager');
            res.status(200).json(pharmacies);
        } catch (error) {
            res.status(500).json({ message: 'Помилка при отриманні списку аптек', error });
        }
    }

    async addPharmacy(req, res) {
        try {
            const { name, address, workingHours, managerId, maxStorageSize, bonusPercent } = req.body;
            const newPharmacy = new Pharmacy({
                name,
                address,
                workingHours,
                manager: managerId,
                maxStorageSize,
                bonusPercent,
            });
            await newPharmacy.save();
            res.status(201).json({ message: 'Аптеку додано успішно', pharmacy: newPharmacy });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при додаванні аптеки', error });
        }
    }

    async updatePharmacy(req, res) {
        try {
            const { pharmacyId } = req.params;
            const updatedPharmacy = await Pharmacy.findByIdAndUpdate(pharmacyId, req.body, { new: true });
            if (!updatedPharmacy) return res.status(404).json({ message: 'Аптеку не знайдено' });
            res.status(200).json({ message: 'Аптеку оновлено успішно', pharmacy: updatedPharmacy });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при оновленні аптеки', error });
        }
    }

    async deletePharmacy(req, res) {
        try {
            const { pharmacyId } = req.params;
            const deletedPharmacy = await Pharmacy.findByIdAndDelete(pharmacyId);
            if (!deletedPharmacy) {
                return res.status(404).json({ message: 'Аптеку не знайдено' });
            }
            await MedicationInPharmacy.deleteMany({ pharmacy: pharmacyId });
            await MedicationInPharmacy.deleteMany({
                $or: [
                    { pharmacy: { $nin: await Pharmacy.distinct('_id') } },
                    { medication: { $nin: await Medication.distinct('_id') } }
                ]
            });
            res.status(200).json({ message: 'Аптеку видалено успішно' });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при видаленні аптеки', error });
        }
    }

    // Управління акаунтами користувачів
    async getAllUsers(req, res) {
        try {
            const users = await User.find();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: 'Помилка при отриманні списку користувачів', error });
        }
    }

    async addUser(req, res) {
        try {
            const { firstName, lastName, email, password, role } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
                bonusPoints: 0,
            });
            await newUser.save();
            res.status(201).json({ message: 'Користувача додано успішно', user: newUser });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Помилка при додаванні користувача', error });
        }
    }

    async updateUser(req, res) {
        try {
            const { userId } = req.params;
            const updatedData = { ...req.body };
            if (updatedData.password) {
                delete updatedData.password;
            }
            const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true });
            if (!updatedUser) return res.status(404).json({ message: 'Користувача не знайдено' });
            res.status(200).json({ message: 'Користувача оновлено успішно', user: updatedUser });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при оновленні користувача', error });
        }
    }

    async deleteUser(req, res) {
        try {
            const { userId } = req.params;
            await User.findByIdAndDelete(userId);
            res.status(200).json({ message: 'Користувача видалено успішно' });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при видаленні користувача', error });
        }
    }

    async createMedication(req, res) {
        try {
            const { name, expirationTime, storageConditions, category, manufacturer, isPrescriptionOnly } = req.body;
            const newMedication = new Medication({
                name,
                expirationTime,
                storageConditions,
                category,
                manufacturer,
                isPrescriptionOnly,
            });
            await newMedication.save();
            res.status(201).json({ message: 'Медикамент створено успішно', medication: newMedication });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при створенні медикаменту', error: error.message });
        }
    }

    async getAllMedications(req, res) {
        try {
            const medications = await Medication.find();
            res.status(200).json(medications);
        } catch (error) {
            res.status(500).json({ message: 'Помилка при отриманні медикаментів', error: error.message });
        }
    }

    async updateMedication(req, res) {
        try {
            const { medicationId } = req.params;
            const updatedMedication = await Medication.findByIdAndUpdate(medicationId, req.body, { new: true });
            if (!updatedMedication) {
                return res.status(404).json({ message: 'Медикамент не знайдено' });
            }
            res.status(200).json({ message: 'Медикамент оновлено успішно', medication: updatedMedication });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при оновленні медикаменту', error: error.message });
        }
    }

    async deleteMedication(req, res) {
        try {
            const { medicationId } = req.params;
            const deletedMedication = await Medication.findByIdAndDelete(medicationId);
            if (!deletedMedication) {
                return res.status(404).json({ message: 'Медикамент не знайдено' });
            }
            await MedicationInPharmacy.deleteMany({ medication: medicationId });
            await MedicationInPharmacy.deleteMany({
                $or: [
                    { pharmacy: { $nin: await Pharmacy.distinct('_id') } },
                    { medication: { $nin: await Medication.distinct('_id') } }
                ]
            });
            res.status(200).json({ message: 'Медикамент видалено успішно' });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при видаленні медикаменту', error: error.message });
        }
    }

    async receiveIoTData(req, res) {
        try {
            const { deviceId } = req.params;
            const { Temperature, Humidity } = req.body;
            console.log(req.body);
            const device = await IoTDevice.findById(deviceId).populate('pharmacy');
            if (!device) {
                return res.status(404).json({ message: 'IoT пристрій не знайдено' });
            }
            const storageConditionEntry = new StorageConditionHistory({
                pharmacy: device.pharmacy,
                iotDevice: device._id,
                date: new Date(),
                temperature: Temperature,
                humidity: Humidity
            });
            await storageConditionEntry.save();
            device.status = 'active';
            await device.save();
            res.status(200).json({
                message: 'Дані успішно збережено',
                measurementInterval: device.measurementInterval,
                normalRange: device.normalRange
            });
        } catch (error) {
            console.log(error.message);
            res.status(500).json({ message: 'Помилка при обробці даних IoT пристрою', error: error.message });
        }
    }

    async executeDb(req, res) {
        try {
            await Medication.deleteMany({});
            await MedicationInPharmacy.deleteMany({});
            await Pharmacy.deleteMany({});
            await Transaction.deleteMany({});
            await StorageConditionHistory.deleteMany({});
            await IoTDevice.deleteMany({});
            res.status(200).json({ message: 'Всі дані успішно видалено з бази даних' });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при видаленні даних з бази даних', error: error.message });
        }
    }

    async createBackup(req, res) {
        try {
            const backupDir = path.join(__dirname, '../backups');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = `backup-${timestamp}.archive`;
            const backupPath = path.join(backupDir, backupFile);

            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            console.log('MongoDB URI:', connection);
            console.log('Backup Path:', backupPath);

            // Явний шлях до mongodump
            const mongodumpPath = '"C:\\mongodb-database-tools\\bin\\mongodump.exe"';
            const dumpCommand = `${mongodumpPath} --uri "${connection}" --archive="${backupPath}"`;

            console.log('Executing command:', dumpCommand);

            // Виконання команди
            exec(dumpCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error('Backup error:', error, stderr);
                    return res.status(500).json({ message: 'Помилка створення бекапу', error: stderr || error.message });
                }
                console.log('Backup created at:', backupPath);
                res.status(200).json({ message: 'Бекап успішно створено', backupPath });
            });

        } catch (error) {
            console.error('Error in createBackup:', error);
            res.status(500).json({ message: 'Помилка при створенні бекапу', error: error.message });
        }
    }
}

module.exports = new AdminController();