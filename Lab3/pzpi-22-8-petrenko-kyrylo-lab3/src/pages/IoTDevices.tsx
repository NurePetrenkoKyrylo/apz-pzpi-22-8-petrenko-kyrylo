import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import axios from 'axios';

interface Pharmacy {
  _id: string;
  name: string;
  address: string;
}

interface NormalRange {
  temperature: { min: number; max: number };
  humidity: { min: number; max: number };
}

interface IoTDevice {
  _id: string;
  pharmacy: Pharmacy;
  status: 'active' | 'inactive';
  measurementInterval: number;
  normalRange: NormalRange;
}

interface FormData {
  pharmacyId: string;
  status: 'active' | 'inactive';
  measurementInterval: number;
  normalRange: {
    temperature: { min: number; max: number };
    humidity: { min: number; max: number };
  };
}

interface FormErrors {
  pharmacyId?: string;
  measurementInterval?: string;
  temperatureMin?: string;
  temperatureMax?: string;
  humidityMin?: string;
  humidityMax?: string;
}

type Language = 'uk' | 'en';

const translations = {
  uk: {
    title: 'IoT-пристрої',
    sidebar: {
      dashboard: 'Дашборд',
      inventory: 'Запаси',
      transactions: 'Історія видачі',
      reports: 'Звіти',
      iotDevices: 'IoT-пристрої',
      logout: 'Вийти',
      pharmacies: 'Аптеки',
      users: 'Користувачі',
    },
    table: {
      pharmacyName: 'Назва аптеки',
      pharmacyAddress: 'Адреса аптеки',
      status: 'Статус',
      measurementInterval: 'Інтервал вимірювання (сек)',
      normalRange: 'Нормальний діапазон',
      actions: 'Дії',
    },
    form: {
      addTitle: 'Додати IoT-пристрій',
      editTitle: 'Редагувати IoT-пристрій',
      pharmacy: 'Аптека',
      status: 'Статус',
      measurementInterval: 'Інтервал вимірювання (сек)',
      temperatureMin: 'Мін. температура (°C)',
      temperatureMax: 'Макс. температура (°C)',
      humidityMin: 'Мін. вологість (%)',
      humidityMax: 'Макс. вологість (%)',
      active: 'Активний',
      inactive: 'Неактивний',
      save: 'Зберегти',
      cancel: 'Скасувати',
      selectOption: 'Виберіть...',
      validation: {
        pharmacyRequired: 'Аптека є обов’язковою',
        measurementIntervalInvalid: 'Інтервал вимірювання має бути більше 0',
        temperatureMinInvalid: 'Мінімальна температура має бути числом',
        temperatureMaxInvalid: 'Максимальна температура має бути числом і більше мінімальної',
        humidityMinInvalid: 'Мінімальна вологість має бути числом від 0 до 100',
        humidityMaxInvalid: 'Максимальна вологість має бути числом від 0 до 100 і більше мінімальної',
      },
    },
    buttons: {
      add: 'Додати пристрій',
      edit: 'Редагувати',
      delete: 'Видалити',
    },
    success: {
      added: 'IoT-пристрій додано успішно',
      updated: 'IoT-пристрій оновлено успішно',
      deleted: 'IoT-пристрій видалено успішно',
    },
    error: 'Помилка: {message}',
    noToken: 'Токен відсутній. Будь ласка, увійдіть знову.',
    language: 'Мова',
    deleteConfirm: 'Ви впевнені, що хочете видалити цей IoT-пристрій?',
  },
  en: {
    title: 'IoT Devices',
    sidebar: {
      dashboard: 'Dashboard',
      inventory: 'Inventory',
      transactions: 'Transaction History',
      reports: 'Reports',
      iotDevices: 'IoT Devices',
      logout: 'Logout',
      pharmacies: 'Pharmacies',
      users: 'Users',
    },
    table: {
      pharmacyName: 'Pharmacy Name',
      pharmacyAddress: 'Pharmacy Address',
      status: 'Status',
      measurementInterval: 'Measurement Interval (sec)',
      normalRange: 'Normal Range',
      actions: 'Actions',
    },
    form: {
      addTitle: 'Add IoT Device',
      editTitle: 'Edit IoT Device',
      pharmacy: 'Pharmacy',
      status: 'Status',
      measurementInterval: 'Measurement Interval (sec)',
      temperatureMin: 'Min Temperature (°C)',
      temperatureMax: 'Max Temperature (°C)',
      humidityMin: 'Min Humidity (%)',
      humidityMax: 'Max Humidity (%)',
      active: 'Active',
      inactive: 'Inactive',
      save: 'Save',
      cancel: 'Cancel',
      selectOption: 'Select...',
      validation: {
        pharmacyRequired: 'Pharmacy is required',
        measurementIntervalInvalid: 'Measurement interval must be greater than 0',
        temperatureMinInvalid: 'Minimum temperature must be a number',
        temperatureMaxInvalid: 'Maximum temperature must be a number and greater than minimum',
        humidityMinInvalid: 'Minimum humidity must be a number between 0 and 100',
        humidityMaxInvalid: 'Maximum humidity must be a number between 0 and 100 and greater than minimum',
      },
    },
    buttons: {
      add: 'Add Device',
      edit: 'Edit',
      delete: 'Delete',
    },
    success: {
      added: 'IoT device added successfully',
      updated: 'IoT device updated successfully',
      deleted: 'IoT device deleted successfully',
    },
    error: 'Error: {message}',
    noToken: 'Token missing. Please log in again.',
    language: 'Language',
    deleteConfirm: 'Are you sure you want to delete this IoT device?',
  },
};

export default function IoTDevices() {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('language') as Language) || 'uk'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDeviceId, setEditDeviceId] = useState('');
  const [formData, setFormData] = useState<FormData>({
    pharmacyId: '',
    status: 'active',
    measurementInterval: 300,
    normalRange: {
      temperature: { min: 15, max: 25 },
      humidity: { min: 30, max: 70 },
    },
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const navigate = useNavigate();
  const t = translations[language];

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      const res = await API.get('/admin/iot-devices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevices(res.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Невідома помилка';
        setError(t.error.replace('{message}', message));
        if (err.response?.status === 403 || err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      } else {
        setError(t.error.replace('{message}', 'Невідома помилка'));
      }
    }
  };

  const fetchPharmacies = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      const res = await API.get('/admin/pharmacies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPharmacies(res.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Невідома помилка';
        setError(t.error.replace('{message}', message));
      } else {
        setError(t.error.replace('{message}', 'Невідома помилка'));
      }
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchPharmacies();
  }, [navigate, t]);

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!formData.pharmacyId) errors.pharmacyId = t.form.validation.pharmacyRequired;
    if (formData.measurementInterval <= 0)
      errors.measurementInterval = t.form.validation.measurementIntervalInvalid;
    if (isNaN(formData.normalRange.temperature.min))
      errors.temperatureMin = t.form.validation.temperatureMinInvalid;
    if (
      isNaN(formData.normalRange.temperature.max) ||
      formData.normalRange.temperature.max <= formData.normalRange.temperature.min
    )
      errors.temperatureMax = t.form.validation.temperatureMaxInvalid;
    if (isNaN(formData.normalRange.humidity.min) || formData.normalRange.humidity.min < 0 || formData.normalRange.humidity.min > 100)
      errors.humidityMin = t.form.validation.humidityMinInvalid;
    if (
      isNaN(formData.normalRange.humidity.max) ||
      formData.normalRange.humidity.max <= formData.normalRange.humidity.min ||
      formData.normalRange.humidity.max > 100
    )
      errors.humidityMax = t.form.validation.humidityMaxInvalid;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddDevice = async () => {
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      await API.post('/admin/iot-devices', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(t.success.added);
      setIsModalOpen(false);
      setFormData({
        pharmacyId: '',
        status: 'active',
        measurementInterval: 300,
        normalRange: { temperature: { min: 15, max: 25 }, humidity: { min: 30, max: 70 } },
      });
      setFormErrors({});
      fetchDevices();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Невідома помилка';
        setError(t.error.replace('{message}', message));
      } else {
        setError(t.error.replace('{message}', 'Невідома помилка'));
      }
    }
  };

  const handleUpdateDevice = async () => {
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      await API.put(`/admin/iot-devices/${editDeviceId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(t.success.updated);
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditDeviceId('');
      setFormData({
        pharmacyId: '',
        status: 'active',
        measurementInterval: 300,
        normalRange: { temperature: { min: 15, max: 25 }, humidity: { min: 30, max: 70 } },
      });
      setFormErrors({});
      fetchDevices();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Невідома помилка';
        setError(t.error.replace('{message}', message));
      } else {
        setError(t.error.replace('{message}', 'Невідома помилка'));
      }
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!window.confirm(t.deleteConfirm)) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      await API.delete(`/admin/iot-devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(t.success.deleted);
      fetchDevices();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Невідома помилка';
        setError(t.error.replace('{message}', message));
      } else {
        setError(t.error.replace('{message}', 'Невідома помилка'));
      }
    }
  };

  const openEditModal = (device: IoTDevice) => {
    setIsEditMode(true);
    setEditDeviceId(device._id);
    setFormData({
      pharmacyId: device.pharmacy._id,
      status: device.status,
      measurementInterval: device.measurementInterval,
      normalRange: {
        temperature: { min: device.normalRange.temperature.min, max: device.normalRange.temperature.max },
        humidity: { min: device.normalRange.humidity.min, max: device.normalRange.humidity.max },
      },
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-800 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Pharmacy System</h2>
        <nav>
          <ul>
            <li className="mb-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded"
              >
                {t.sidebar.dashboard}
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => navigate('/inventory')}
                className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded"
              >
                {t.sidebar.inventory}
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => navigate('/transactions')}
                className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded"
              >
                {t.sidebar.transactions}
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => navigate('/reports')}
                className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded"
              >
                {t.sidebar.reports}
              </button>
            </li>
            <li className="mb-4">
              <button
                className="w-full text-left py-2 px-4 bg-blue-700 rounded hover:bg-blue-600"
              >
                {t.sidebar.iotDevices}
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => navigate('/pharmacies')}
                className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded"
              >
                {t.sidebar.pharmacies}
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => navigate('/users')}
                className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded"
              >
                {t.sidebar.users}
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={handleLogout}
                className="w-full text-left py-2 px-4 hover:bg-red-600 rounded"
              >
                {t.sidebar.logout}
              </button>
            </li>
          </ul>
        </nav>
        <div className="mt-6">
          <label className="block text-sm mb-2">{t.language}</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="w-full bg-white text-gray-800 rounded px-2 py-1"
          >
            <option value="uk">Українська</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{t.title}</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}

        {/* Add Device Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setIsModalOpen(true);
              setIsEditMode(false);
              setFormData({
                pharmacyId: '',
                status: 'active',
                measurementInterval: 300,
                normalRange: { temperature: { min: 15, max: 25 }, humidity: { min: 30, max: 70 } },
              });
              setFormErrors({});
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 from-blue-500 to-blue-600 bg-gradient-to-r"
          >
            {t.buttons.add}
          </button>
        </div>

        {/* Devices Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 text-left">{t.table.pharmacyName}</th>
                <th className="px-4 py-2 text-left">{t.table.pharmacyAddress}</th>
                <th className="px-4 py-2 text-left">{t.table.status}</th>
                <th className="px-4 py-2 text-left">{t.table.measurementInterval}</th>
                <th className="px-4 py-2 text-left">{t.table.normalRange}</th>
                <th className="px-4 py-2 text-left">{t.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{device.pharmacy.name}</td>
                  <td className="px-4 py-2">{device.pharmacy.address}</td>
                  <td className="px-4 py-2">
                    {device.status === 'active' ? t.form.active : t.form.inactive}
                  </td>
                  <td className="px-4 py-2">{device.measurementInterval}</td>
                  <td className="px-4 py-2">
                    {`Темп: ${device.normalRange.temperature.min}–${device.normalRange.temperature.max}°C, Вологість: ${device.normalRange.humidity.min}–${device.normalRange.humidity.max}%`}
                  </td>
                  <td className="px-4 py-2 flex space-x-2">
                    <button
                      onClick={() => openEditModal(device)}
                      className="text-blue-500 hover:underline"
                    >
                      {t.buttons.edit}
                    </button>
                    <button
                      onClick={() => handleDeleteDevice(device._id)}
                      className="text-red-500 hover:underline"
                    >
                      {t.buttons.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Device Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {isEditMode ? t.form.editTitle : t.form.addTitle}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">{t.form.pharmacy}</label>
                  <select
                    value={formData.pharmacyId}
                    onChange={(e) => setFormData({ ...formData, pharmacyId: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.pharmacyId ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">{t.form.selectOption}</option>
                    {pharmacies.map((pharmacy) => (
                      <option key={pharmacy._id} value={pharmacy._id}>
                        {pharmacy.name} ({pharmacy.address})
                      </option>
                    ))}
                  </select>
                  {formErrors.pharmacyId && (
                    <p className="text-red-500 text-sm">{formErrors.pharmacyId}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.status}</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="active">{t.form.active}</option>
                    <option value="inactive">{t.form.inactive}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.measurementInterval}</label>
                  <input
                    type="number"
                    value={formData.measurementInterval}
                    onChange={(e) =>
                      setFormData({ ...formData, measurementInterval: Number(e.target.value) })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.measurementInterval ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.measurementInterval && (
                    <p className="text-red-500 text-sm">{formErrors.measurementInterval}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.temperatureMin}</label>
                  <input
                    type="number"
                    value={formData.normalRange.temperature.min}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        normalRange: {
                          ...formData.normalRange,
                          temperature: { ...formData.normalRange.temperature, min: Number(e.target.value) },
                        },
                      })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.temperatureMin ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.temperatureMin && (
                    <p className="text-red-500 text-sm">{formErrors.temperatureMin}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.temperatureMax}</label>
                  <input
                    type="number"
                    value={formData.normalRange.temperature.max}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        normalRange: {
                          ...formData.normalRange,
                          temperature: { ...formData.normalRange.temperature, max: Number(e.target.value) },
                        },
                      })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.temperatureMax ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.temperatureMax && (
                    <p className="text-red-500 text-sm">{formErrors.temperatureMax}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.humidityMin}</label>
                  <input
                    type="number"
                    value={formData.normalRange.humidity.min}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        normalRange: {
                          ...formData.normalRange,
                          humidity: { ...formData.normalRange.humidity, min: Number(e.target.value) },
                        },
                      })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.humidityMin ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.humidityMin && (
                    <p className="text-red-500 text-sm">{formErrors.humidityMin}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.humidityMax}</label>
                  <input
                    type="number"
                    value={formData.normalRange.humidity.max}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        normalRange: {
                          ...formData.normalRange,
                          humidity: { ...formData.normalRange.humidity, max: Number(e.target.value) },
                        },
                      })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.humidityMax ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.humidityMax && (
                    <p className="text-red-500 text-sm">{formErrors.humidityMax}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormErrors({});
                    setIsEditMode(false);
                    setEditDeviceId('');
                  }}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  {t.form.cancel}
                </button>
                <button
                  onClick={isEditMode ? handleUpdateDevice : handleAddDevice}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {t.form.save}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}