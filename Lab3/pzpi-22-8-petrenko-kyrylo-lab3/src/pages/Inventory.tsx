import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import axios from 'axios';

interface Pharmacy {
  _id: string;
  name: string;
  address: string;
}

interface Medication {
  _id: string;
  name: string;
  category: string;
  manufacturer: string;
  isPrescriptionOnly: boolean;
}

interface MedicationInPharmacy {
  _id: string;
  pharmacy: Pharmacy;
  medication: Medication;
  price: number;
  manufactureDate: string;
  quantity: number;
  batchCode: string;
}

interface RestockRecommendation {
  pharmacy: string;
  medication: string;
  currentQuantity: number;
  manufactureDate: string;
  expirationTime: number;
  recommendedQuantity: number;
  reason: string;
}

interface InventoryStats {
  medication: string;
  totalQuantity: number;
  averagePrice: number;
  averageSalesPerMonth: number;
}

interface AddFormData {
  pharmacyId: string;
  medicationId: string;
  price: number;
  manufactureDate: string;
  quantity: number;
  batchCode: string;
}

interface UpdateFormData {
  medicationInPharmacyId: string;
  newQuantity: number;
}

interface WriteOffFormData {
  medicationInPharmacyId: string;
  quantity: number;
  reason: string;
}

interface AddFormErrors {
  pharmacyId?: string;
  medicationId?: string;
  price?: string;
  manufactureDate?: string;
  quantity?: string;
  batchCode?: string;
}

interface UpdateFormErrors {
  newQuantity?: string;
}

interface WriteOffFormErrors {
  medicationInPharmacyId?: string;
  quantity?: string;
  reason?: string;
}

type Language = 'uk' | 'en';
type Tab = 'all' | 'low' | 'restock' | 'stats';

const translations = {
  uk: {
    title: 'Запаси медикаментів',
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
    tabs: {
      all: 'Всі запаси',
      low: 'Низькі запаси',
      restock: 'Рекомендації поповнення',
      stats: 'Статистика',
    },
    table: {
      medicationName: 'Назва медикаменту',
      category: 'Категорія',
      manufacturer: 'Виробник',
      isPrescriptionOnly: 'Тільки за рецептом',
      pharmacyName: 'Назва аптеки',
      pharmacyAddress: 'Адреса аптеки',
      price: 'Ціна (грн)',
      manufactureDate: 'Дата виробництва',
      quantity: 'Кількість',
      batchCode: 'Код партії',
      actions: 'Дії',
      currentQuantity: 'Поточна кількість',
      expirationTime: 'Термін придатності (дні)',
      recommendedQuantity: 'Рекомендована кількість',
      reason: 'Причина',
      totalQuantity: 'Загальна кількість',
      averagePrice: 'Середня ціна (грн)',
      averageSalesPerMonth: 'Середні продажі на місяць',
    },
    form: {
      addTitle: 'Додати медикамент до інвентарю',
      updateTitle: 'Оновити кількість',
      writeOffTitle: 'Списати медикамент',
      pharmacy: 'Аптека',
      medication: 'Медикамент',
      price: 'Ціна (грн)',
      manufactureDate: 'Дата виробництва',
      quantity: 'Кількість',
      batchCode: 'Код партії',
      newQuantity: 'Нова кількість',
      reason: 'Причина списання',
      save: 'Зберегти',
      cancel: 'Скасувати',
      selectOption: 'Виберіть...',
      threshold: 'Поріг кількості',
      apply: 'Застосувати',
      validation: {
        pharmacyRequired: 'Аптека є обов’язковою',
        medicationRequired: 'Медикамент є обов’язковим',
        priceInvalid: 'Ціна має бути не менше 0',
        manufactureDateInvalid: 'Дата виробництва є обов’язковою і не може бути в майбутньому',
        quantityInvalid: 'Кількість має бути не менше 0',
        batchCodeRequired: 'Код партії є обов’язковим',
        newQuantityInvalid: 'Нова кількість має бути не менше 0',
        thresholdInvalid: 'Поріг має бути більше 0',
        reasonRequired: 'Причина списання є обов’язковою',
        quantityExceeds: 'Кількість для списання перевищує наявну',
      },
    },
    buttons: {
      add: 'Додати медикамент',
      updateQuantity: 'Оновити кількість',
      writeOff: 'Списати',
    },
    success: {
      added: 'Медикамент додано до інвентарю',
      updated: 'Кількість оновлено успішно',
      writtenOff: 'Медикамент успішно списано',
    },
    error: 'Помилка: {message}',
    noToken: 'Токен відсутній. Будь ласка, увійдіть знову.',
    language: 'Мова',
  },
  en: {
    title: 'Medicine Inventory',
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
    tabs: {
      all: 'All Inventory',
      low: 'Low Inventory',
      restock: 'Restock Recommendations',
      stats: 'Statistics',
    },
    table: {
      medicationName: 'Medicine Name',
      category: 'Category',
      manufacturer: 'Manufacturer',
      isPrescriptionOnly: 'Prescription Only',
      pharmacyName: 'Pharmacy Name',
      pharmacyAddress: 'Pharmacy Address',
      price: 'Price (UAH)',
      manufactureDate: 'Manufacture Date',
      quantity: 'Quantity',
      batchCode: 'Batch Code',
      actions: 'Actions',
      currentQuantity: 'Current Quantity',
      expirationTime: 'Expiration Time (days)',
      recommendedQuantity: 'Recommended Quantity',
      reason: 'Reason',
      totalQuantity: 'Total Quantity',
      averagePrice: 'Average Price (UAH)',
      averageSalesPerMonth: 'Average Sales per Month',
    },
    form: {
      addTitle: 'Add Medicine to Inventory',
      updateTitle: 'Update Quantity',
      writeOffTitle: 'Write Off Medicine',
      pharmacy: 'Pharmacy',
      medication: 'Medicine',
      price: 'Price (UAH)',
      manufactureDate: 'Manufacture Date',
      quantity: 'Quantity',
      batchCode: 'Batch Code',
      newQuantity: 'New Quantity',
      reason: 'Write-off Reason',
      save: 'Save',
      cancel: 'Cancel',
      selectOption: 'Select...',
      threshold: 'Quantity Threshold',
      apply: 'Apply',
      validation: {
        pharmacyRequired: 'Pharmacy is required',
        medicationRequired: 'Medicine is required',
        priceInvalid: 'Price must be 0 or greater',
        manufactureDateInvalid: 'Manufacture date is required and cannot be in the future',
        quantityInvalid: 'Quantity must be 0 or greater',
        batchCodeRequired: 'Batch code is required',
        newQuantityInvalid: 'New quantity must be 0 or greater',
        thresholdInvalid: 'Threshold must be greater than 0',
        reasonRequired: 'Write-off reason is required',
        quantityExceeds: 'Write-off quantity exceeds available',
      },
    },
    buttons: {
      add: 'Add Medicine',
      updateQuantity: 'Update Quantity',
      writeOff: 'Write Off',
    },
    success: {
      added: 'Medicine added to inventory',
      updated: 'Quantity updated successfully',
      writtenOff: 'Medicine successfully written off',
    },
    error: 'Error: {message}',
    noToken: 'Token missing. Please log in again.',
    language: 'Language',
  },
};

export default function Inventory() {
  const [medicationsInPharmacy, setMedicationsInPharmacy] = useState<MedicationInPharmacy[]>([]);
  const [lowInventory, setLowInventory] = useState<MedicationInPharmacy[]>([]);
  const [restockRecommendations, setRestockRecommendations] = useState<RestockRecommendation[]>([]);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('language') as Language) || 'uk'
  );
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [threshold, setThreshold] = useState<number>(10);
  const [thresholdError, setThresholdError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isWriteOffModalOpen, setIsWriteOffModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState<AddFormData>({
    pharmacyId: '',
    medicationId: '',
    price: 0,
    manufactureDate: '',
    quantity: 0,
    batchCode: '',
  });
  const [updateFormData, setUpdateFormData] = useState<UpdateFormData>({
    medicationInPharmacyId: '',
    newQuantity: 0,
  });
  const [writeOffFormData, setWriteOffFormData] = useState<WriteOffFormData>({
    medicationInPharmacyId: '',
    quantity: 0,
    reason: '',
  });
  const [addFormErrors, setAddFormErrors] = useState<AddFormErrors>({});
  const [updateFormErrors, setUpdateFormErrors] = useState<UpdateFormErrors>({});
  const [writeOffFormErrors, setWriteOffFormErrors] = useState<WriteOffFormErrors>({});
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

  const fetchMedicationsInPharmacy = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      const res = await API.get('/inventory/medications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMedicationsInPharmacy(res.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Unknown error';
        setError(t.error.replace('{message}', message));
        if (err.response?.status === 403 || err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      } else {
        setError(t.error.replace('{message}', 'Unknown error'));
      }
    }
  };

  const fetchLowInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      if (threshold <= 0) {
        setThresholdError(t.form.validation.thresholdInvalid);
        return;
      }
      setThresholdError('');
      const res = await API.get(`/inventory/medications/low-inventory?threshold=${threshold}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLowInventory(res.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Unknown error';
        setError(t.error.replace('{message}', message));
        if (err.response?.status === 403 || err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      } else {
        setError(t.error.replace('{message}', 'Unknown error'));
      }
    }
  };

  const fetchRestockRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      if (threshold <= 0) {
        setThresholdError(t.form.validation.thresholdInvalid);
        return;
      }
      setThresholdError('');
      const res = await API.get(`/inventory/medications/restock-recommendations?threshold=${threshold}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRestockRecommendations(res.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Unknown error';
        setError(t.error.replace('{message}', message));
        if (err.response?.status === 403 || err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      } else {
        setError(t.error.replace('{message}', 'Unknown error'));
      }
    }
  };

  const fetchInventoryStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      const res = await API.get('/inventory/statistics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventoryStats(res.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Unknown error';
        setError(t.error.replace('{message}', message));
        if (err.response?.status === 403 || err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      } else {
        setError(t.error.replace('{message}', 'Unknown error'));
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
        const message = err.response?.data?.message || 'Unknown error';
        setError(t.error.replace('{message}', message));
      } else {
        setError(t.error.replace('{message}', 'Unknown error'));
      }
    }
  };

  const fetchMedications = async () => {
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
      setMedications(res.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Unknown error';
        setError(t.error.replace('{message}', message));
      } else {
        setError(t.error.replace('{message}', 'Unknown error'));
      }
    }
  };

  useEffect(() => {
    fetchMedicationsInPharmacy();
    fetchPharmacies();
    fetchMedications();
    if (activeTab === 'low') fetchLowInventory();
    if (activeTab === 'restock') fetchRestockRecommendations();
    if (activeTab === 'stats') fetchInventoryStats();
  }, [navigate, t, activeTab, threshold]);

  const validateAddForm = () => {
    const errors: AddFormErrors = {};
    if (!addFormData.pharmacyId) errors.pharmacyId = t.form.validation.pharmacyRequired;
    if (!addFormData.medicationId) errors.medicationId = t.form.validation.medicationRequired;
    if (addFormData.price < 0) errors.price = t.form.validation.priceInvalid;
    if (!addFormData.manufactureDate || new Date(addFormData.manufactureDate) > new Date())
      errors.manufactureDate = t.form.validation.manufactureDateInvalid;
    if (addFormData.quantity < 0) errors.quantity = t.form.validation.quantityInvalid;
    if (!addFormData.batchCode) errors.batchCode = t.form.validation.batchCodeRequired;
    setAddFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateUpdateForm = () => {
    const errors: UpdateFormErrors = {};
    if (updateFormData.newQuantity < 0) errors.newQuantity = t.form.validation.newQuantityInvalid;
    setUpdateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateWriteOffForm = () => {
    const errors: WriteOffFormErrors = {};
    const currentMed = medicationsInPharmacy.find(
      (med) => med._id === writeOffFormData.medicationInPharmacyId
    );
    if (!writeOffFormData.medicationInPharmacyId)
      errors.medicationInPharmacyId = t.form.validation.medicationRequired;
    if (writeOffFormData.quantity <= 0) errors.quantity = t.form.validation.quantityInvalid;
    if (currentMed && writeOffFormData.quantity > currentMed.quantity)
      errors.quantity = t.form.validation.quantityExceeds;
    if (!writeOffFormData.reason) errors.reason = t.form.validation.reasonRequired;
    setWriteOffFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMedication = async () => {
    if (!validateAddForm()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      await API.post('/inventory/medications', addFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(t.success.added);
      setIsAddModalOpen(false);
      setAddFormData({
        pharmacyId: '',
        medicationId: '',
        price: 0,
        manufactureDate: '',
        quantity: 0,
        batchCode: '',
      });
      setAddFormErrors({});
      fetchMedicationsInPharmacy();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Unknown error';
        setError(t.error.replace('{message}', message));
      } else {
        setError(t.error.replace('{message}', 'Unknown error'));
      }
    }
  };

  const handleUpdateQuantity = async () => {
    if (!validateUpdateForm()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      await API.put('/inventory/medications/quantity', updateFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(t.success.updated);
      setIsUpdateModalOpen(false);
      setUpdateFormData({ medicationInPharmacyId: '', newQuantity: 0 });
      setUpdateFormErrors({});
      fetchMedicationsInPharmacy();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Unknown error';
        setError(t.error.replace('{message}', message));
      } else {
        setError(t.error.replace('{message}', 'Unknown error'));
      }
    }
  };

  const handleWriteOffMedication = async () => {
    if (!validateWriteOffForm()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      await API.post('/inventory/medications/write-off', writeOffFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(t.success.writtenOff);
      setIsWriteOffModalOpen(false);
      setWriteOffFormData({
        medicationInPharmacyId: '',
        quantity: 0,
        reason: '',
      });
      setWriteOffFormErrors({});
      fetchMedicationsInPharmacy();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Unknown error';
        setError(t.error.replace('{message}', message));
        if (err.response?.status === 403 || err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      } else {
        setError(t.error.replace('{message}', 'Unknown error'));
      }
    }
  };

  const openUpdateModal = (medInPharmacy: MedicationInPharmacy) => {
    setUpdateFormData({
      medicationInPharmacyId: medInPharmacy._id,
      newQuantity: medInPharmacy.quantity,
    });
    setUpdateFormErrors({});
    setIsUpdateModalOpen(true);
  };

  const openWriteOffModal = (medInPharmacy: MedicationInPharmacy) => {
    setWriteOffFormData({
      medicationInPharmacyId: medInPharmacy._id,
      quantity: 0,
      reason: '',
    });
    setWriteOffFormErrors({});
    setIsWriteOffModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setThreshold(value);
    if (value <= 0) {
      setThresholdError(t.form.validation.thresholdInvalid);
    } else {
      setThresholdError('');
      if (activeTab === 'low') fetchLowInventory();
      if (activeTab === 'restock') fetchRestockRecommendations();
    }
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
              <button className="w-full text-left py-2 px-4 bg-blue-700 rounded hover:bg-blue-600">
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

        {/* Tabs */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded ${
              activeTab === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            {t.tabs.all}
          </button>
          <button
            onClick={() => setActiveTab('low')}
            className={`px-4 py-2 rounded ${
              activeTab === 'low' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            {t.tabs.low}
          </button>
          <button
            onClick={() => setActiveTab('restock')}
            className={`px-4 py-2 rounded ${
              activeTab === 'restock' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            {t.tabs.restock}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded ${
              activeTab === 'stats' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            {t.tabs.stats}
          </button>
        </div>

        {/* Add Medicine Button (only for All Inventory tab) */}
        {activeTab === 'all' && (
          <div className="mb-6">
            <button
              onClick={() => {
                setIsAddModalOpen(true);
                setAddFormData({
                  pharmacyId: '',
                  medicationId: '',
                  price: 0,
                  manufactureDate: '',
                  quantity: 0,
                  batchCode: '',
                });
                setAddFormErrors({});
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {t.buttons.add}
            </button>
          </div>
        )}

        {/* Threshold Input (for Low Inventory and Restock Recommendations) */}
        {(activeTab === 'low' || activeTab === 'restock') && (
          <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-end space-x-4">
              <div>
                <label className="block text-sm font-medium">{t.form.threshold}</label>
                <input
                  type="number"
                  value={threshold}
                  onChange={handleThresholdChange}
                  className={`w-full border rounded px-3 py-2 ${
                    thresholdError ? 'border-red-500' : ''
                  }`}
                />
                {thresholdError && <p className="text-red-500 text-sm">{thresholdError}</p>}
              </div>
              <button
                onClick={() => {
                  if (activeTab === 'low') fetchLowInventory();
                  if (activeTab === 'restock') fetchRestockRecommendations();
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {t.form.apply}
              </button>
            </div>
          </div>
        )}

        {/* All Inventory Table */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">{t.table.medicationName}</th>
                  <th className="px-4 py-2 text-left">{t.table.category}</th>
                  <th className="px-4 py-2 text-left">{t.table.manufacturer}</th>
                  <th className="px-4 py-2 text-left">{t.table.isPrescriptionOnly}</th>
                  <th className="px-4 py-2 text-left">{t.table.pharmacyName}</th>
                  <th className="px-4 py-2 text-left">{t.table.pharmacyAddress}</th>
                  <th className="px-4 py-2 text-left">{t.table.price}</th>
                  <th className="px-4 py-2 text-left">{t.table.manufactureDate}</th>
                  <th className="px-4 py-2 text-left">{t.table.quantity}</th>
                  <th className="px-4 py-2 text-left">{t.table.batchCode}</th>
                  <th className="px-4 py-2 text-left">{t.table.actions}</th>
                </tr>
              </thead>
              <tbody>
                {medicationsInPharmacy.map((med) => (
                  <tr key={med._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{med.medication.name}</td>
                    <td className="px-4 py-2">{med.medication.category}</td>
                    <td className="px-4 py-2">{med.medication.manufacturer}</td>
                    <td className="px-4 py-2">{med.medication.isPrescriptionOnly ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2">{med.pharmacy.name}</td>
                    <td className="px-4 py-2">{med.pharmacy.address}</td>
                    <td className="px-4 py-2">{med.price.toFixed(2)}</td>
                    <td className="px-4 py-2">{new Date(med.manufactureDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{med.quantity}</td>
                    <td className="px-4 py-2">{med.batchCode}</td>
                    <td className="px-4 py-2 flex space-x-2">
                      <button
                        onClick={() => openUpdateModal(med)}
                        className="text-blue-500 hover:underline"
                      >
                        {t.buttons.updateQuantity}
                      </button>
                      <button
                        onClick={() => openWriteOffModal(med)}
                        className="text-red-500 hover:underline"
                      >
                        {t.buttons.writeOff}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Low Inventory Table */}
        {activeTab === 'low' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">{t.table.medicationName}</th>
                  <th className="px-4 py-2 text-left">{t.table.category}</th>
                  <th className="px-4 py-2 text-left">{t.table.manufacturer}</th>
                  <th className="px-4 py-2 text-left">{t.table.isPrescriptionOnly}</th>
                  <th className="px-4 py-2 text-left">{t.table.pharmacyName}</th>
                  <th className="px-4 py-2 text-left">{t.table.pharmacyAddress}</th>
                  <th className="px-4 py-2 text-left">{t.table.price}</th>
                  <th className="px-4 py-2 text-left">{t.table.manufactureDate}</th>
                  <th className="px-4 py-2 text-left">{t.table.quantity}</th>
                  <th className="px-4 py-2 text-left">{t.table.batchCode}</th>
                  <th className="px-4 py-2 text-left">{t.table.actions}</th>
                </tr>
              </thead>
              <tbody>
                {lowInventory.map((med) => (
                  <tr key={med._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{med.medication.name}</td>
                    <td className="px-4 py-2">{med.medication.category}</td>
                    <td className="px-4 py-2">{med.medication.manufacturer}</td>
                    <td className="px-4 py-2">{med.medication.isPrescriptionOnly ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2">{med.pharmacy.name}</td>
                    <td className="px-4 py-2">{med.pharmacy.address}</td>
                    <td className="px-4 py-2">{med.price.toFixed(2)}</td>
                    <td className="px-4 py-2">{new Date(med.manufactureDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{med.quantity}</td>
                    <td className="px-4 py-2">{med.batchCode}</td>
                    <td className="px-4 py-2 flex space-x-2">
                      <button
                        onClick={() => openUpdateModal(med)}
                        className="text-blue-500 hover:underline"
                      >
                        {t.buttons.updateQuantity}
                      </button>
                      <button
                        onClick={() => openWriteOffModal(med)}
                        className="text-red-500 hover:underline"
                      >
                        {t.buttons.writeOff}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Restock Recommendations Table */}
        {activeTab === 'restock' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">{t.table.pharmacyName}</th>
                  <th className="px-4 py-2 text-left">{t.table.medicationName}</th>
                  <th className="px-4 py-2 text-left">{t.table.currentQuantity}</th>
                  <th className="px-4 py-2 text-left">{t.table.manufactureDate}</th>
                  <th className="px-4 py-2 text-left">{t.table.expirationTime}</th>
                  <th className="px-4 py-2 text-left">{t.table.recommendedQuantity}</th>
                  <th className="px-4 py-2 text-left">{t.table.reason}</th>
                </tr>
              </thead>
              <tbody>
                {restockRecommendations.map((rec, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{rec.pharmacy}</td>
                    <td className="px-4 py-2">{rec.medication}</td>
                    <td className="px-4 py-2">{rec.currentQuantity}</td>
                    <td className="px-4 py-2">{new Date(rec.manufactureDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{rec.expirationTime}</td>
                    <td className="px-4 py-2">{rec.recommendedQuantity}</td>
                    <td className="px-4 py-2">{rec.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Statistics Table */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">{t.table.medicationName}</th>
                  <th className="px-4 py-2 text-left">{t.table.totalQuantity}</th>
                  <th className="px-4 py-2 text-left">{t.table.averagePrice}</th>
                  <th className="px-4 py-2 text-left">{t.table.averageSalesPerMonth}</th>
                </tr>
              </thead>
              <tbody>
                {inventoryStats.map((stat, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{stat.medication}</td>
                    <td className="px-4 py-2">{stat.totalQuantity}</td>
                    <td className="px-4 py-2">{stat.averagePrice.toFixed(2)}</td>
                    <td className="px-4 py-2">{stat.averageSalesPerMonth.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Medication Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">{t.form.addTitle}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">{t.form.pharmacy}</label>
                  <select
                    value={addFormData.pharmacyId}
                    onChange={(e) => setAddFormData({ ...addFormData, pharmacyId: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${
                      addFormErrors.pharmacyId ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">{t.form.selectOption}</option>
                    {pharmacies.map((pharmacy) => (
                      <option key={pharmacy._id} value={pharmacy._id}>
                        {pharmacy.name} ({pharmacy.address})
                      </option>
                    ))}
                  </select>
                  {addFormErrors.pharmacyId && (
                    <p className="text-red-500 text-sm">{addFormErrors.pharmacyId}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.medication}</label>
                  <select
                    value={addFormData.medicationId}
                    onChange={(e) => setAddFormData({ ...addFormData, medicationId: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${
                      addFormErrors.medicationId ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">{t.form.selectOption}</option>
                    {medications.map((med) => (
                      <option key={med._id} value={med._id}>
                        {med.name} ({med.category})
                      </option>
                    ))}
                  </select>
                  {addFormErrors.medicationId && (
                    <p className="text-red-500 text-sm">{addFormErrors.medicationId}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.price}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addFormData.price}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, price: Number(e.target.value) })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      addFormErrors.price ? 'border-red-500' : ''
                    }`}
                  />
                  {addFormErrors.price && (
                    <p className="text-red-500 text-sm">{addFormErrors.price}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.manufactureDate}</label>
                  <input
                    type="date"
                    value={addFormData.manufactureDate}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, manufactureDate: e.target.value })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      addFormErrors.manufactureDate ? 'border-red-500' : ''
                    }`}
                  />
                  {addFormErrors.manufactureDate && (
                    <p className="text-red-500 text-sm">{addFormErrors.manufactureDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.quantity}</label>
                  <input
                    type="number"
                    value={addFormData.quantity}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, quantity: Number(e.target.value) })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      addFormErrors.quantity ? 'border-red-500' : ''
                    }`}
                  />
                  {addFormErrors.quantity && (
                    <p className="text-red-500 text-sm">{addFormErrors.quantity}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.batchCode}</label>
                  <input
                    type="text"
                    value={addFormData.batchCode}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, batchCode: e.target.value })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      addFormErrors.batchCode ? 'border-red-500' : ''
                    }`}
                  />
                  {addFormErrors.batchCode && (
                    <p className="text-red-500 text-sm">{addFormErrors.batchCode}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setAddFormErrors({});
                  }}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  {t.form.cancel}
                </button>
                <button
                  onClick={handleAddMedication}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {t.form.save}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Quantity Modal */}
        {isUpdateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">{t.form.updateTitle}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">{t.form.newQuantity}</label>
                  <input
                    type="number"
                    value={updateFormData.newQuantity}
                    onChange={(e) =>
                      setUpdateFormData({
                        ...updateFormData,
                        newQuantity: Number(e.target.value),
                      })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      updateFormErrors.newQuantity ? 'border-red-500' : ''
                    }`}
                  />
                  {updateFormErrors.newQuantity && (
                    <p className="text-red-500 text-sm">{updateFormErrors.newQuantity}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setIsUpdateModalOpen(false);
                    setUpdateFormErrors({});
                  }}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  {t.form.cancel}
                </button>
                <button
                  onClick={handleUpdateQuantity}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {t.form.save}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Write Off Medication Modal */}
        {isWriteOffModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">{t.form.writeOffTitle}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">{t.form.medication}</label>
                  <select
                    value={writeOffFormData.medicationInPharmacyId}
                    onChange={(e) =>
                      setWriteOffFormData({
                        ...writeOffFormData,
                        medicationInPharmacyId: e.target.value,
                      })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      writeOffFormErrors.medicationInPharmacyId ? 'border-red-500' : ''
                    }`}
                    disabled
                  >
                    <option value="">{t.form.selectOption}</option>
                    {medicationsInPharmacy.map((med) => (
                      <option key={med._id} value={med._id}>
                        {med.medication.name} ({med.pharmacy.name})
                      </option>
                    ))}
                  </select>
                  {writeOffFormErrors.medicationInPharmacyId && (
                    <p className="text-red-500 text-sm">{writeOffFormErrors.medicationInPharmacyId}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.quantity}</label>
                  <input
                    type="number"
                    value={writeOffFormData.quantity}
                    onChange={(e) =>
                      setWriteOffFormData({
                        ...writeOffFormData,
                        quantity: Number(e.target.value),
                      })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      writeOffFormErrors.quantity ? 'border-red-500' : ''
                    }`}
                  />
                  {writeOffFormErrors.quantity && (
                    <p className="text-red-500 text-sm">{writeOffFormErrors.quantity}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.form.reason}</label>
                  <select
                    value={writeOffFormData.reason}
                    onChange={(e) =>
                      setWriteOffFormData({ ...writeOffFormData, reason: e.target.value })
                    }
                    className={`w-full border rounded px-3 py-2 ${
                      writeOffFormErrors.reason ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">{t.form.selectOption}</option>
                    <option value="expired">{language === 'uk' ? 'Прострочено' : 'Expired'}</option>
                    <option value="damaged">{language === 'uk' ? 'Пошкоджено' : 'Damaged'}</option>
                    <option value="other">{language === 'uk' ? 'Інше' : 'Other'}</option>
                  </select>
                  {writeOffFormErrors.reason && (
                    <p className="text-red-500 text-sm">{writeOffFormErrors.reason}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setIsWriteOffModalOpen(false);
                    setWriteOffFormErrors({});
                  }}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  {t.form.cancel}
                </button>
                <button
                  onClick={handleWriteOffMedication}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
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