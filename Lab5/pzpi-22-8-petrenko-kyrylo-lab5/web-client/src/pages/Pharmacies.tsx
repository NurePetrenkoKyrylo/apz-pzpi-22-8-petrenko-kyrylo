import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import axios from 'axios';
import IoTDevices from './IoTDevices';

interface Pharmacy {
  _id: string;
  name: string;
  address: string;
  workingHours: string;
  maxStorageSize: number;
  bonusPercent: number;
  manager?: { _id: string; firstName: string; lastName: string };
  hasIoTDevice?: boolean; // Додано для перевірки наявності IoT-пристрою
}

interface FormData {
  name: string;
  address: string;
  workingHours: string;
  maxStorageSize: number;
  bonusPercent: number;
  managerId: string;
}

interface FormErrors {
  name?: string;
  address?: string;
  workingHours?: string;
  maxStorageSize?: string;
  bonusPercent?: string;
  managerId?: string;
}

interface StorageConditions {
  message: string;
  temperature?: number;
  humidity?: number;
}

type Language = 'uk' | 'en';

const translations = {
  uk: {
    title: 'Керування аптеками',
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
      address: 'Адреса',
      workingHours: 'Години роботи',
      maxStorageSize: 'Макс. розмір складу',
      bonusPercent: 'Бонус (%)',
      manager: 'Менеджер',
      hasIoTDevice: 'IoT Пристрій',
      actions: 'Дії',
    },
    form: {
      addTitle: 'Додати аптеку',
      editTitle: 'Редагувати аптеку',
      name: 'Назва',
      address: 'Адреса',
      workingHours: 'Години роботи',
      maxStorageSize: 'Макс. розмір складу',
      bonusPercent: 'Бонус (%)',
      managerId: 'ID менеджера',
      save: 'Зберегти',
      cancel: 'Скасувати',
      validation: {
        nameRequired: 'Назва є обов’язковою',
        addressRequired: 'Адреса є обов’язковою',
        workingHoursRequired: 'Години роботи є обов’язковими',
        maxStorageSizeInvalid: 'Розмір складу має бути більше 0',
        bonusPercentInvalid: 'Бонус має бути від 0 до 100',
        managerIdRequired: 'ID менеджера є обов’язковим',
      },
    },
    storageModal: {
      title: 'Умови зберігання',
      status: 'Статус',
      temperature: 'Температура (°C)',
      humidity: 'Вологість (%)',
      close: 'Закрити',
      noData: 'Дані про умови зберігання відсутні',
    },
    buttons: {
      add: 'Додати аптеку',
      edit: 'Редагувати',
      delete: 'Видалити',
      viewStorage: 'Переглянути умови',
    },
    confirmDelete: 'Ви впевнені, що хочете видалити аптеку "{name}"?',
    success: {
      added: 'Аптеку додано успішно',
      updated: 'Аптеку оновлено успішно',
      deleted: 'Аптеку видалено успішно',
    },
    error: 'Помилка: {message}',
    noToken: 'Токен відсутній. Будь ласка, увійдіть знову.',
    language: 'Мова',
  },
  en: {
    title: 'Pharmacy Management',
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
      address: 'Address',
      workingHours: 'Working Hours',
      maxStorageSize: 'Max Storage Size',
      bonusPercent: 'Bonus (%)',
      manager: 'Manager',
      hasIoTDevice: 'IoT Device',
      actions: 'Actions',
    },
    form: {
      addTitle: 'Add Pharmacy',
      editTitle: 'Edit Pharmacy',
      name: 'Name',
      address: 'Address',
      workingHours: 'Working Hours',
      maxStorageSize: 'Max Storage Size',
      bonusPercent: 'Bonus (%)',
      managerId: 'Manager ID',
      save: 'Save',
      cancel: 'Cancel',
      validation: {
        nameRequired: 'Name is required',
        addressRequired: 'Address is required',
        workingHoursRequired: 'Working hours are required',
        maxStorageSizeInvalid: 'Storage size must be greater than 0',
        bonusPercentInvalid: 'Bonus must be between 0 and 100',
        managerIdRequired: 'Manager ID is required',
      },
    },
    storageModal: {
      title: 'Storage Conditions',
      status: 'Status',
      temperature: 'Temperature (°C)',
      humidity: 'Humidity (%)',
      close: 'Close',
      noData: 'Storage condition data not available',
    },
    buttons: {
      add: 'Add Pharmacy',
      edit: 'Edit',
      delete: 'Delete',
      viewStorage: 'View Conditions',
    },
    confirmDelete: 'Are you sure you want to delete the pharmacy "{name}"?',
    success: {
      added: 'Pharmacy added successfully',
      updated: 'Pharmacy updated successfully',
      deleted: 'Pharmacy deleted successfully',
    },
    error: 'Error: {message}',
    noToken: 'Token missing. Please log in again.',
    language: 'Language',
  },
};

export default function Pharmacies() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('language') as Language) || 'uk'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPharmacyId, setEditingPharmacyId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    workingHours: '',
    maxStorageSize: 0,
    bonusPercent: 0,
    managerId: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [storageConditions, setStorageConditions] = useState<StorageConditions | null>(null);
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
      // Перевіряємо наявність IoT-пристрою для кожної аптеки
      const pharmaciesWithIoT = await Promise.all(
        res.data.map(async (pharmacy: Pharmacy) => {
          try {
            await API.get(`/inventory/storage-conditions/${pharmacy._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return { ...pharmacy, hasIoTDevice: true };
          } catch (err) {
            return { ...pharmacy, hasIoTDevice: false };
          }
        })
      );
      setPharmacies(pharmaciesWithIoT);
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

  const fetchStorageConditions = async (pharmacyId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      const res = await API.get(`/inventory/storage-conditions/${pharmacyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStorageConditions(res.data);
      setIsStorageModalOpen(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Невідома помилка';
        setError(t.error.replace('{message}', message));
        if (err.response?.status === 404) {
          setStorageConditions({ message: t.storageModal.noData });
          setIsStorageModalOpen(true);
        }
      } else {
        setError(t.error.replace('{message}', 'Невідома помилка'));
      }
    }
  };

  useEffect(() => {
    fetchPharmacies();
  }, [navigate]);

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!formData.name) errors.name = t.form.validation.nameRequired;
    if (!formData.address) errors.address = t.form.validation.addressRequired;
    if (!formData.workingHours) errors.workingHours = t.form.validation.workingHoursRequired;
    if (formData.maxStorageSize <= 0) errors.maxStorageSize = t.form.validation.maxStorageSizeInvalid;
    if (formData.bonusPercent < 0 || formData.bonusPercent > 100)
      errors.bonusPercent = t.form.validation.bonusPercentInvalid;
    if (!formData.managerId) errors.managerId = t.form.validation.managerIdRequired;
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

      const payload = { ...formData };
      if (isEditing && editingPharmacyId) {
        await API.patch(`/admin/pharmacies/${editingPharmacyId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(t.success.updated);
      } else {
        await API.post('/admin/pharmacies', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(t.success.added);
      }
      setIsModalOpen(false);
      setFormData({
        name: '',
        address: '',
        workingHours: '',
        maxStorageSize: 0,
        bonusPercent: 0,
        managerId: '',
      });
      setFormErrors({});
      setIsEditing(false);
      setEditingPharmacyId(null);
      fetchPharmacies();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || err.response?.data || 'Невідома помилка';
        setError(t.error.replace('{message}', JSON.stringify(message)));
      } else {
        setError(t.error.replace('{message}', 'Невідома помилка'));
      }
    }
  };

  const handleDelete = async (pharmacyId: string, pharmacyName: string) => {
    if (!window.confirm(t.confirmDelete.replace('{name}', pharmacyName))) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      await API.delete(`/admin/pharmacies/${pharmacyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(t.success.deleted);
      fetchPharmacies();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Невідома помилка';
        setError(t.error.replace('{message}', message));
      } else {
        setError(t.error.replace('{message}', 'Невідома помилка'));
      }
    }
  };

  const openEditModal = (pharmacy: Pharmacy) => {
    setIsEditing(true);
    setEditingPharmacyId(pharmacy._id);
    setFormData({
      name: pharmacy.name,
      address: pharmacy.address,
      workingHours: pharmacy.workingHours,
      maxStorageSize: pharmacy.maxStorageSize,
      bonusPercent: pharmacy.bonusPercent,
      managerId: pharmacy.manager?._id || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
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
                onClick={() => navigate('/iot-devices')}
                className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded"
              >
                {t.sidebar.IoTDevices}
              </button>
            </li>
            <li className="mb-4">
              <button className="w-full text-left py-2 px-4 bg-blue-700 rounded hover:bg-blue-600">
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
                onClick={() => {
                  localStorage.removeItem('token');
                  navigate('/');
                }}
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

        {/* Add Pharmacy Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setIsModalOpen(true);
              setIsEditing(false);
              setFormData({
                name: '',
                address: '',
                workingHours: '',
                maxStorageSize: 0,
                bonusPercent: 0,
                managerId: '',
              });
              setFormErrors({});
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {t.buttons.add}
          </button>
        </div>

        {/* Pharmacies Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 text-left">{t.table.name}</th>
                <th className="px-4 py-2 text-left">{t.table.address}</th>
                <th className="px-4 py-2 text-left">{t.table.workingHours}</th>
                <th className="px-4 py-2 text-left">{t.table.maxStorageSize}</th>
                <th className="px-4 py-2 text-left">{t.table.bonusPercent}</th>
                <th className="px-4 py-2 text-left">{t.table.manager}</th>
                <th className="px-4 py-2 text-left">{t.table.hasIoTDevice}</th>
                <th className="px-4 py-2 text-left">{t.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {pharmacies.map((pharmacy) => (
                <tr key={pharmacy._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{pharmacy.name}</td>
                  <td className="px-4 py-2">{pharmacy.address}</td>
                  <td className="px-4 py-2">{pharmacy.workingHours}</td>
                  <td className="px-4 py-2">{pharmacy.maxStorageSize}</td>
                  <td className="px-4 py-2">{pharmacy.bonusPercent}%</td>
                  <td className="px-4 py-2">
                    {pharmacy.manager
                      ? `${pharmacy.manager.firstName} ${pharmacy.manager.lastName}`
                      : 'Немає'}
                  </td>
                  <td className="px-4 py-2">
                    {pharmacy.hasIoTDevice ? t.table.hasIoTDevice === 'IoT Device' ? 'Yes' : 'Так' : t.table.hasIoTDevice === 'IoT Device' ? 'No' : 'Ні'}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => openEditModal(pharmacy)}
                      className="text-blue-500 hover:underline mr-4"
                    >
                      {t.buttons.edit}
                    </button>
                    <button
                      onClick={() => handleDelete(pharmacy._id, pharmacy.name)}
                      className="text-red-500 hover:underline mr-4"
                    >
                      {t.buttons.delete}
                    </button>
                    {pharmacy.hasIoTDevice && (
                      <button
                        onClick={() => fetchStorageConditions(pharmacy._id)}
                        className="text-green-500 hover:underline"
                      >
                        {t.buttons.viewStorage}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal for Add/Edit Pharmacy */}
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
                  <label className="block text-sm font-medium">{t.form.address}</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.address ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.address && (
                    <p className="text-red-500 text-sm">{formErrors.address}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.workingHours}</label>
                  <input
                    type="text"
                    value={formData.workingHours}
                    onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.workingHours ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.workingHours && (
                    <p className="text-red-500 text-sm">{formErrors.workingHours}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.maxStorageSize}</label>
                  <input
                    type="number"
                    value={formData.maxStorageSize}
                    onChange={(e) =>
                      setFormData({ ...formData, maxStorageSize: Number(e.target.value) })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.maxStorageSize ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.maxStorageSize && (
                    <p className="text-red-500 text-sm">{formErrors.maxStorageSize}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.bonusPercent}</label>
                  <input
                    type="number"
                    value={formData.bonusPercent}
                    onChange={(e) =>
                      setFormData({ ...formData, bonusPercent: Number(e.target.value) })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.bonusPercent ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.bonusPercent && (
                    <p className="text-red-500 text-sm">{formErrors.bonusPercent}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.managerId}</label>
                  <input
                    type="text"
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${
                      formErrors.managerId ? 'border-red-500' : ''
                    }`}
                    placeholder="Введіть ID менеджера"
                  />
                  {formErrors.managerId && (
                    <p className="text-red-500 text-sm">{formErrors.managerId}</p>
                  )}
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

        {/* Modal for Storage Conditions */}
        {isStorageModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">{t.storageModal.title}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">{t.storageModal.status}</label>
                  <p className={`text-sm ${storageConditions?.message.includes('нормі') || storageConditions?.message.includes('normal') ? 'text-green-500' : 'text-red-500'}`}>
                    {storageConditions?.message}
                  </p>
                </div>
                {storageConditions?.temperature !== undefined && (
                  <div>
                    <label className="block text-sm font-medium">{t.storageModal.temperature}</label>
                    <p className="text-sm">{storageConditions.temperature.toFixed(1)} °C</p>
                  </div>
                )}
                {storageConditions?.humidity !== undefined && (
                  <div>
                    <label className="block text-sm font-medium">{t.storageModal.humidity}</label>
                    <p className="text-sm">{storageConditions.humidity.toFixed(1)} %</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setIsStorageModalOpen(false);
                    setStorageConditions(null);
                  }}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  {t.storageModal.close}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}