import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import axios, { AxiosError } from 'axios';

interface StorageConditions {
  temperature: { min: number; max: number };
  humidity: { min: number; max: number };
}

interface Medicine {
  _id: string;
  name: string;
  expirationTime: number;
  storageConditions?: StorageConditions | string;
  category: string;
  manufacturer: string;
  isPrescriptionOnly?: boolean;
}

interface FormData {
  name: string;
  expirationTime: number;
  storageConditions: StorageConditions;
  category: string;
  manufacturer: string;
  isPrescriptionOnly: boolean;
}

interface FormErrors {
  name?: string;
  expirationTime?: string;
  storageConditionsTemperatureMin?: string;
  storageConditionsTemperatureMax?: string;
  storageConditionsHumidityMin?: string;
  storageConditionsHumidityMax?: string;
  category?: string;
  manufacturer?: string;
}

type Language = 'uk' | 'en';

const translations = {
  uk: {
    title: 'Список медикаментів',
    sidebar: {
      dashboard: 'Дашборд',
      inventory: 'Запаси',
      transactions: 'Історія видачі',
      reports: 'Звіти',
      IoTDevices: 'IoT-пристрої',
      logout: 'Вийти',
      pharmacies: 'Аптеки',
      users: 'Користувачі',
    },
    table: {
      name: 'Назва',
      category: 'Категорія',
      manufacturer: 'Виробник',
      expiration: 'Термін придатності (днів)',
      storageConditions: 'Умови зберігання',
      isPrescriptionOnly: 'Тільки за рецептом',
      actions: 'Дії',
    },
    form: {
      addTitle: 'Додати медикамент',
      editTitle: 'Редагувати медикамент',
      name: 'Назва',
      expirationTime: 'Термін придатності (днів)',
      storageConditionsTemperatureMin: 'Мін. температура (°C)',
      storageConditionsTemperatureMax: 'Макс. температура (°C)',
      storageConditionsHumidityMin: 'Мін. вологість (%)',
      storageConditionsHumidityMax: 'Макс. вологість (%)',
      category: 'Категорія',
      manufacturer: 'Виробник',
      isPrescriptionOnly: 'Тільки за рецептом',
      save: 'Зберегти',
      cancel: 'Скасувати',
      validation: {
        nameRequired: 'Назва є обов’язковою',
        categoryRequired: 'Категорія є обов’язковою',
        manufacturerRequired: 'Виробник є обов’язковим',
        expirationTimeInvalid: 'Термін придатності має бути більше 0',
        temperatureMinRequired: 'Мінімальна температура є обов’язковою',
        temperatureMaxRequired: 'Максимальна температура є обов’язковою',
        humidityMinRequired: 'Мінімальна вологість є обов’язковою',
        humidityMaxRequired: 'Максимальна вологість є обов’язковою',
        temperatureOrder: 'Мінімальна температура має бути меншою за максимальну',
        humidityOrder: 'Мінімальна вологість має бути меншою за максимальну',
      },
    },
    buttons: {
      add: 'Додати медикамент',
      edit: 'Редагувати',
      delete: 'Видалити',
    },
    confirmDelete: 'Ви впевнені, що хочете видалити медикамент "{name}"?',
    success: {
      added: 'Медикамент додано успішно',
      updated: 'Медикамент оновлено успішно',
      deleted: 'Медикамент видалено успішно',
    },
    error: 'Помилка: {message}',
    noToken: 'Токен відсутній. Будь ласка, увійдіть знову.',
    language: 'Мова',
  },
  en: {
    title: 'Medicine List',
    sidebar: {
      dashboard: 'Dashboard',
      inventory: 'Inventory',
      transactions: 'Transaction History',
      reports: 'Reports',
      IoTDevices: 'Settings',
      logout: 'Logout',
      pharmacies: 'Pharmacies',
      users: 'Users',
    },
    table: {
      name: 'Name',
      category: 'Category',
      manufacturer: 'Manufacturer',
      expiration: 'Expiration (days)',
      storageConditions: 'Storage Conditions',
      isPrescriptionOnly: 'Prescription Only',
      actions: 'Actions',
    },
    form: {
      addTitle: 'Add Medicine',
      editTitle: 'Edit Medicine',
      name: 'Name',
      expirationTime: 'Expiration (days)',
      storageConditionsTemperatureMin: 'Min Temperature (°C)',
      storageConditionsTemperatureMax: 'Max Temperature (°C)',
      storageConditionsHumidityMin: 'Min Humidity (%)',
      storageConditionsHumidityMax: 'Max Humidity (%)',
      category: 'Category',
      manufacturer: 'Manufacturer',
      isPrescriptionOnly: 'Prescription Only',
      save: 'Save',
      cancel: 'Cancel',
      validation: {
        nameRequired: 'Name is required',
        categoryRequired: 'Category is required',
        manufacturerRequired: 'Manufacturer is required',
        expirationTimeInvalid: 'Expiration time must be greater than 0',
        temperatureMinRequired: 'Minimum temperature is required',
        temperatureMaxRequired: 'Maximum temperature is required',
        humidityMinRequired: 'Minimum humidity is required',
        humidityMaxRequired: 'Maximum humidity is required',
        temperatureOrder: 'Minimum temperature must be less than maximum',
        humidityOrder: 'Minimum humidity must be less than maximum',
      },
    },
    buttons: {
      add: 'Add Medicine',
      edit: 'Edit',
      delete: 'Delete',
    },
    confirmDelete: 'Are you sure you want to delete the medicine "{name}"?',
    success: {
      added: 'Medicine added successfully',
      updated: 'Medicine updated successfully',
      deleted: 'Medicine deleted successfully',
    },
    error: 'Error: {message}',
    noToken: 'Token missing. Please log in again.',
    language: 'Language',
  },
};

export default function Dashboard() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('language') as Language) || 'uk'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    expirationTime: 0,
    storageConditions: {
      temperature: { min: 0, max: 0 },
      humidity: { min: 0, max: 0 },
    },
    category: '',
    manufacturer: '',
    isPrescriptionOnly: false,
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

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      const res = await API.get('/admin/medications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMedicines(res.data);
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

  useEffect(() => {
    fetchData();
  }, [navigate, t]);

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!formData.name) errors.name = t.form.validation.nameRequired;
    if (!formData.category) errors.category = t.form.validation.categoryRequired;
    if (!formData.manufacturer) errors.manufacturer = t.form.validation.manufacturerRequired;
    if (formData.expirationTime <= 0) errors.expirationTime = t.form.validation.expirationTimeInvalid;
    if (formData.storageConditions.temperature.min === 0 && formData.storageConditions.temperature.min !== 0)
      errors.storageConditionsTemperatureMin = t.form.validation.temperatureMinRequired;
    if (formData.storageConditions.temperature.max === 0 && formData.storageConditions.temperature.max !== 0)
      errors.storageConditionsTemperatureMax = t.form.validation.temperatureMaxRequired;
    if (formData.storageConditions.humidity.min === 0 && formData.storageConditions.humidity.min !== 0)
      errors.storageConditionsHumidityMin = t.form.validation.humidityMinRequired;
    if (formData.storageConditions.humidity.max === 0 && formData.storageConditions.humidity.max !== 0)
      errors.storageConditionsHumidityMax = t.form.validation.humidityMaxRequired;
    if (formData.storageConditions.temperature.min > formData.storageConditions.temperature.max)
      errors.storageConditionsTemperatureMin = t.form.validation.temperatureOrder;
    if (formData.storageConditions.humidity.min > formData.storageConditions.humidity.max)
      errors.storageConditionsHumidityMin = t.form.validation.humidityOrder;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddOrUpdate = async () => {
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }

      const payload = {
        name: formData.name,
        expirationTime: formData.expirationTime,
        storageConditions: formData.storageConditions,
        category: formData.category,
        manufacturer: formData.manufacturer,
        isPrescriptionOnly: formData.isPrescriptionOnly,
      };

      if (isEditing && editingMedicineId) {
        await API.patch(`/admin/medications/${editingMedicineId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(t.success.updated);
      } else {
        await API.post('/admin/medications', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(t.success.added);
      }

      setIsModalOpen(false);
      setFormData({
        name: '',
        expirationTime: 0,
        storageConditions: {
          temperature: { min: 0, max: 0 },
          humidity: { min: 0, max: 0 },
        },
        category: '',
        manufacturer: '',
        isPrescriptionOnly: false,
      });
      setFormErrors({});
      setIsEditing(false);
      setEditingMedicineId(null);
      fetchData();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Невідома помилка';
        setError(t.error.replace('{message}', message));
      } else {
        setError(t.error.replace('{message}', 'Невідома помилка'));
      }
    }
  };

  const handleDelete = async (medicineId: string, medicineName: string) => {
    if (!window.confirm(t.confirmDelete.replace('{name}', medicineName))) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      await API.delete(`/admin/medications/${medicineId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(t.success.deleted);
      fetchData();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Невідома помилка';
        setError(t.error.replace('{message}', message));
      } else {
        setError(t.error.replace('{message}', 'Невідома помилка'));
      }
    }
  };

  const openEditModal = (medicine: Medicine) => {
    setIsEditing(true);
    setEditingMedicineId(medicine._id);
    setFormData({
      name: medicine.name,
      expirationTime: medicine.expirationTime,
      storageConditions:
        typeof medicine.storageConditions === 'object' && medicine.storageConditions
          ? {
              temperature: {
                min: medicine.storageConditions.temperature.min,
                max: medicine.storageConditions.temperature.max,
              },
              humidity: {
                min: medicine.storageConditions.humidity.min,
                max: medicine.storageConditions.humidity.max,
              },
            }
          : { temperature: { min: 0, max: 0 }, humidity: { min: 0, max: 0 } },
      category: medicine.category,
      manufacturer: medicine.manufacturer,
      isPrescriptionOnly: medicine.isPrescriptionOnly || false,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const formatStorageConditions = (conditions?: StorageConditions | string) => {
    if (!conditions) return 'Невідомо';
    if (typeof conditions === 'string') return conditions;
    return `Temp: ${conditions.temperature.min}-${conditions.temperature.max}°C, Hum: ${conditions.humidity.min}-${conditions.humidity.max}%`;
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
              <button className="w-full text-left py-2 px-4 bg-blue-700 rounded hover:bg-blue-600">
                {t.sidebar.dashboard}
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => navigate('/inventory')}
                className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded">
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
              <button className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded">
                {t.sidebar.reports}
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => navigate('/iot-devices')}
                className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded">
                {t.sidebar.IoTDevices}
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

        {/* Add Medicine Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setIsModalOpen(true);
              setIsEditing(false);
              setFormData({
                name: '',
                expirationTime: 0,
                storageConditions: {
                  temperature: { min: 0, max: 0 },
                  humidity: { min: 0, max: 0 },
                },
                category: '',
                manufacturer: '',
                isPrescriptionOnly: false,
              });
              setFormErrors({});
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {t.buttons.add}
          </button>
        </div>

        {/* Medicines Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 text-left">{t.table.name}</th>
                <th className="px-4 py-2 text-left">{t.table.category}</th>
                <th className="px-4 py-2 text-left">{t.table.manufacturer}</th>
                <th className="px-4 py-2 text-left">{t.table.expiration}</th>
                <th className="px-4 py-2 text-left">{t.table.storageConditions}</th>
                <th className="px-4 py-2 text-left">{t.table.isPrescriptionOnly}</th>
                <th className="px-4 py-2 text-left">{t.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med) => (
                <tr key={med._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{med.name}</td>
                  <td className="px-4 py-2">{med.category}</td>
                  <td className="px-4 py-2">{med.manufacturer}</td>
                  <td className="px-4 py-2">{med.expirationTime}</td>
                  <td className="px-4 py-2">{formatStorageConditions(med.storageConditions)}</td>
                  <td className="px-4 py-2">{med.isPrescriptionOnly ? 'Так' : 'Ні'}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => openEditModal(med)}
                      className="text-blue-500 hover:underline mr-4"
                    >
                      {t.buttons.edit}
                    </button>
                    <button
                      onClick={() => handleDelete(med._id, med.name)}
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

        {/* Modal for Add/Edit Medicine */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? t.form.editTitle : t.form.addTitle}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">{t.form.name}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.name ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.expirationTime}</label>
                  <input
                    type="number"
                    value={formData.expirationTime}
                    onChange={(e) =>
                      setFormData({ ...formData, expirationTime: Number(e.target.value) })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.expirationTime ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.expirationTime && (
                    <p className="text-red-500 text-sm">{formErrors.expirationTime}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    {t.form.storageConditionsTemperatureMin}
                  </label>
                  <input
                    type="number"
                    value={formData.storageConditions.temperature.min}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storageConditions: {
                          ...formData.storageConditions,
                          temperature: {
                            ...formData.storageConditions.temperature,
                            min: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.storageConditionsTemperatureMin ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.storageConditionsTemperatureMin && (
                    <p className="text-red-500 text-sm">
                      {formErrors.storageConditionsTemperatureMin}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    {t.form.storageConditionsTemperatureMax}
                  </label>
                  <input
                    type="number"
                    value={formData.storageConditions.temperature.max}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storageConditions: {
                          ...formData.storageConditions,
                          temperature: {
                            ...formData.storageConditions.temperature,
                            max: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.storageConditionsTemperatureMax ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.storageConditionsTemperatureMax && (
                    <p className="text-red-500 text-sm">
                      {formErrors.storageConditionsTemperatureMax}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    {t.form.storageConditionsHumidityMin}
                  </label>
                  <input
                    type="number"
                    value={formData.storageConditions.humidity.min}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storageConditions: {
                          ...formData.storageConditions,
                          humidity: {
                            ...formData.storageConditions.humidity,
                            min: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.storageConditionsHumidityMin ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.storageConditionsHumidityMin && (
                    <p className="text-red-500 text-sm">{formErrors.storageConditionsHumidityMin}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    {t.form.storageConditionsHumidityMax}
                  </label>
                  <input
                    type="number"
                    value={formData.storageConditions.humidity.max}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storageConditions: {
                          ...formData.storageConditions,
                          humidity: {
                            ...formData.storageConditions.humidity,
                            max: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.storageConditionsHumidityMax ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.storageConditionsHumidityMax && (
                    <p className="text-red-500 text-sm">{formErrors.storageConditionsHumidityMax}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.category}</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.category ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.category && (
                    <p className="text-red-500 text-sm">{formErrors.category}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.manufacturer}</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.manufacturer ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.manufacturer && (
                    <p className="text-red-500 text-sm">{formErrors.manufacturer}</p>
                  )}
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isPrescriptionOnly}
                      onChange={(e) =>
                        setFormData({ ...formData, isPrescriptionOnly: e.target.checked })
                      }
                      className="mr-2"
                    />
                    {t.form.isPrescriptionOnly}
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormErrors({});
                  }}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  {t.form.cancel}
                </button>
                <button
                  onClick={handleAddOrUpdate}
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