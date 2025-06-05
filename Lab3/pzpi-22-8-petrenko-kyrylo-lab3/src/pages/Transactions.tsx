import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import axios, { AxiosError } from 'axios';

interface Pharmacy {
  _id: string;
  name: string;
  address: string;
}

interface Transaction {
  _id: string;
  quantity: number;
  date: string;
  price: number;
  customerDetails: {
    firstName: string;
    lastName: string;
    email: string;
  };
  pharmacistDetails: {
    firstName: string;
    lastName: string;
  };
  medicationInfo: {
    name: string;
    isPrescriptionOnly: boolean;
  };
  medicationDetails: {
    price: number;
    batchCode: string;
    manufactureDate: string;
    quantity: number;
  };
}

interface FilterData {
  pharmacyId: string;
  startDate: string;
  endDate: string;
}

interface FilterErrors {
  pharmacyId?: string;
  dateOrder?: string;
}

type Language = 'uk' | 'en';

const translations = {
  uk: {
    title: 'Історія видачі',
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
    filter: {
      pharmacy: 'Аптека',
      startDate: 'Дата початку',
      endDate: 'Дата закінчення',
      filterButton: 'Фільтрувати',
      selectOption: 'Виберіть...',
      validation: {
        pharmacyRequired: 'Аптека є обов’язковою',
        dateOrder: 'Дата початку не може бути пізніше дати закінчення',
      },
    },
    table: {
      transactionId: 'ID транзакції',
      date: 'Дата',
      medicationName: 'Медикамент',
      quantity: 'Кількість',
      price: 'Ціна (грн)',
      customer: 'Покупець',
      pharmacist: 'Фармацевт',
      batchCode: 'Код партії',
      manufactureDate: 'Дата виробництва',
      isPrescriptionOnly: 'За рецептом',
    },
    error: 'Помилка: {message}',
    noToken: 'Токен відсутній. Будь ласка, увійдіть знову.',
    language: 'Мова',
  },
  en: {
    title: 'Transaction History',
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
    filter: {
      pharmacy: 'Pharmacy',
      startDate: 'Start Date',
      endDate: 'End Date',
      filterButton: 'Filter',
      selectOption: 'Select...',
      validation: {
        pharmacyRequired: 'Pharmacy is required',
        dateOrder: 'Start date cannot be later than end date',
      },
    },
    table: {
      transactionId: 'Transaction ID',
      date: 'Date',
      medicationName: 'Medicine',
      quantity: 'Quantity',
      price: 'Price (UAH)',
      customer: 'Customer',
      pharmacist: 'Pharmacist',
      batchCode: 'Batch Code',
      manufactureDate: 'Manufacture Date',
      isPrescriptionOnly: 'Prescription Only',
    },
    error: 'Error: {message}',
    noToken: 'Token missing. Please log in again.',
    language: 'Language',
  },
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('language') as Language) || 'uk'
  );
  const [filterData, setFilterData] = useState<FilterData>({
    pharmacyId: '',
    startDate: '',
    endDate: '',
  });
  const [filterErrors, setFilterErrors] = useState<FilterErrors>({});
  const navigate = useNavigate();
  const t = translations[language];

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }

      const errors: FilterErrors = {};
      if (!filterData.pharmacyId) {
        errors.pharmacyId = t.filter.validation.pharmacyRequired;
      }
      if (filterData.startDate && filterData.endDate && new Date(filterData.startDate) > new Date(filterData.endDate)) {
        errors.dateOrder = t.filter.validation.dateOrder;
      }
      setFilterErrors(errors);
      if (Object.keys(errors).length > 0) return;

      const query = new URLSearchParams();
      if (filterData.startDate) query.append('startDate', filterData.startDate);
      if (filterData.endDate) query.append('endDate', filterData.endDate);

      const res = await API.get(`/inventory/transactions/${filterData.pharmacyId}?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
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
    fetchPharmacies();
  }, [navigate, t]);

  const handleFilter = () => {
    fetchTransactions();
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
                className="w-full text-left py-2 px-4 bg-blue-700 rounded hover:bg-blue-600"
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

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium">{t.filter.pharmacy}</label>
              <select
                value={filterData.pharmacyId}
                onChange={(e) => setFilterData({ ...filterData, pharmacyId: e.target.value })}
                className={`w-full border rounded px-3 py-2 ${
                  filterErrors.pharmacyId ? 'border-red-500' : ''
                }`}
              >
                <option value="">{t.filter.selectOption}</option>
                {pharmacies.map((pharmacy) => (
                  <option key={pharmacy._id} value={pharmacy._id}>
                    {pharmacy.name} ({pharmacy.address})
                  </option>
                ))}
              </select>
              {filterErrors.pharmacyId && (
                <p className="text-red-500 text-sm">{filterErrors.pharmacyId}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">{t.filter.startDate}</label>
              <input
                type="date"
                value={filterData.startDate}
                onChange={(e) => setFilterData({ ...filterData, startDate: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">{t.filter.endDate}</label>
              <input
                type="date"
                value={filterData.endDate}
                onChange={(e) => setFilterData({ ...filterData, endDate: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
              {filterErrors.dateOrder && (
                <p className="text-red-500 text-sm">{filterErrors.dateOrder}</p>
              )}
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFilter}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {t.filter.filterButton}
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 text-left">{t.table.transactionId}</th>
                <th className="px-4 py-2 text-left">{t.table.date}</th>
                <th className="px-4 py-2 text-left">{t.table.medicationName}</th>
                <th className="px-4 py-2 text-left">{t.table.quantity}</th>
                <th className="px-4 py-2 text-left">{t.table.price}</th>
                <th className="px-4 py-2 text-left">{t.table.customer}</th>
                <th className="px-4 py-2 text-left">{t.table.pharmacist}</th>
                <th className="px-4 py-2 text-left">{t.table.batchCode}</th>
                <th className="px-4 py-2 text-left">{t.table.manufactureDate}</th>
                <th className="px-4 py-2 text-left">{t.table.isPrescriptionOnly}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{transaction._id}</td>
                  <td className="px-4 py-2">{new Date(transaction.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{transaction.medicationInfo.name}</td>
                  <td className="px-4 py-2">{transaction.quantity}</td>
                  <td className="px-4 py-2">{transaction.price.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    {transaction.customerDetails.firstName} {transaction.customerDetails.lastName} ({transaction.customerDetails.email})
                  </td>
                  <td className="px-4 py-2">
                    {transaction.pharmacistDetails.firstName} {transaction.pharmacistDetails.lastName}
                  </td>
                  <td className="px-4 py-2">{transaction.medicationDetails.batchCode}</td>
                  <td className="px-4 py-2">
                    {new Date(transaction.medicationDetails.manufactureDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    {transaction.medicationInfo.isPrescriptionOnly ? 'Так' : 'Ні'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}