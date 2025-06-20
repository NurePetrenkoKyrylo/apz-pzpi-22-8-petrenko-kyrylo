import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import axios from 'axios';

interface Pharmacy {
  _id: string;
  name: string;
  address: string;
}

interface SalesReport {
  totalQuantity: number;
  totalRevenue: number;
  topMedications: {
    medication: string;
    quantity: number;
    revenue: number;
  }[];
}

interface WriteOffReport {
  totalQuantity: number;
  reasons: { [key: string]: number };
  topMedications: {
    medication: string;
    quantity: number;
    reason: string;
  }[];
}

interface InventorySnapshot {
  _id: string;
  medication: {
    _id: string;
    name: string;
  };
  quantity: number;
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
    title: 'Звіти',
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
    sales: {
      title: 'Звіт по продажах',
      totalQuantity: 'Загальна кількість',
      totalRevenue: 'Загальний дохід (грн)',
      table: {
        medication: 'Медикамент',
        quantity: 'Кількість',
        revenue: 'Дохід (грн)',
      },
    },
    writeOffs: {
      title: 'Звіт по списаннях',
      totalQuantity: 'Загальна кількість',
      reasons: 'Причини',
      table: {
        medication: 'Медикамент',
        quantity: 'Кількість',
        reason: 'Причина',
      },
    },
    usage: {
      title: 'Звіт по використанню',
      totalUsage: 'Загальне використання',
      totalSales: 'Продажі',
      totalWriteOffs: 'Списання',
      usageRatio: 'Частка продажів (%)',
      snapshotTitle: 'Поточні запаси',
      table: {
        medication: 'Медикамент',
        quantity: 'Кількість',
      },
    },
    error: 'Помилка: {message}',
    noToken: 'Токен відсутній. Будь ласка, увійдіть знову.',
    language: 'Мова',
  },
  en: {
    title: 'Reports',
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
    sales: {
      title: 'Sales Report',
      totalQuantity: 'Total Quantity',
      totalRevenue: 'Total Revenue (UAH)',
      table: {
        medication: 'Medication',
        quantity: 'Quantity',
        revenue: 'Revenue (UAH)',
      },
    },
    writeOffs: {
      title: 'Write-Off Report',
      totalQuantity: 'Total Quantity',
      reasons: 'Reasons',
      table: {
        medication: 'Medication',
        quantity: 'Quantity',
        reason: 'Reason',
      },
    },
    usage: {
      title: 'Usage Report',
      totalUsage: 'Total Usage',
      totalSales: 'Sales',
      totalWriteOffs: 'Write-Offs',
      usageRatio: 'Sales Ratio (%)',
      snapshotTitle: 'Current Inventory',
      table: {
        medication: 'Medication',
        quantity: 'Quantity',
      },
    },
    error: 'Error: {message}',
    noToken: 'Token missing. Please log in again.',
    language: 'Language',
  },
};

export default function Reports() {
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [writeOffReport, setWriteOffReport] = useState<WriteOffReport | null>(null);
  const [inventorySnapshot, setInventorySnapshot] = useState<InventorySnapshot[]>([]);
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
        const message = err.response?.data?.message || 'Unknown error';
        setError(t.error.replace('{message}', message));
      } else {
        setError(t.error.replace('{message}', 'Unknown error'));
      }
    }
  };

  const fetchSalesReport = async () => {
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
      if (filterData.pharmacyId) query.append('pharmacyId', filterData.pharmacyId);
      if (filterData.startDate) query.append('startDate', filterData.startDate);
      if (filterData.endDate) query.append('endDate', filterData.endDate);

      const res = await API.get(`/inventory/reports/sales?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalesReport(res.data);
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

  const fetchWriteOffReport = async () => {
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
      if (filterData.pharmacyId) query.append('pharmacyId', filterData.pharmacyId);
      if (filterData.startDate) query.append('startDate', filterData.startDate);
      if (filterData.endDate) query.append('endDate', filterData.endDate);

      const res = await API.get(`/inventory/reports/write-offs?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWriteOffReport(res.data);
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

  const fetchInventorySnapshot = async () => {
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
      setFilterErrors(errors);
      if (Object.keys(errors).length > 0) return;

      const query = new URLSearchParams();
      if (filterData.pharmacyId) query.append('pharmacyId', filterData.pharmacyId);

      const res = await API.get(`/inventory/snapshot?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventorySnapshot(res.data);
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

  const handleFilter = () => {
    fetchSalesReport();
    fetchWriteOffReport();
    fetchInventorySnapshot();
  };

  useEffect(() => {
    fetchPharmacies();
  }, [navigate, t]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // Обчислення звіту по використанню
  const usageReport = salesReport && writeOffReport && inventorySnapshot ? {
    totalSales: salesReport.totalQuantity || 0,
    totalWriteOffs: writeOffReport.totalQuantity || 0,
    totalUsage: (salesReport.totalQuantity || 0) + (writeOffReport.totalQuantity || 0),
    usageRatio: ((salesReport.totalQuantity || 0) / ((salesReport.totalQuantity || 0) + (writeOffReport.totalQuantity || 0)) * 100) || 0,
    snapshot: inventorySnapshot,
  } : null;

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
                className="w-full text-left py-2 px-4 bg-blue-700 rounded hover:bg-blue-600"
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

        {/* Reports */}
        <div className="space-y-6">
          {/* Sales Report */}
          {salesReport && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">{t.sales.title}</h2>
              <p>
                {t.sales.totalQuantity}: {salesReport.totalQuantity}
              </p>
              <p>
                {t.sales.totalRevenue}: {salesReport.totalRevenue.toFixed(2)} грн
              </p>
              <table className="w-full table-auto mt-4">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 text-left">{t.sales.table.medication}</th>
                    <th className="px-4 py-2 text-left">{t.sales.table.quantity}</th>
                    <th className="px-4 py-2 text-left">{t.sales.table.revenue}</th>
                  </tr>
                </thead>
                <tbody>
                  {salesReport.topMedications.map((med) => (
                    <tr key={med.medication} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{med.medication}</td>
                      <td className="px-4 py-2">{med.quantity}</td>
                      <td className="px-4 py-2">{med.revenue.toFixed(2)} грн</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Write-Off Report */}
          {writeOffReport && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">{t.writeOffs.title}</h2>
              <p>
                {t.writeOffs.totalQuantity}: {writeOffReport.totalQuantity}
              </p>
              <h3 className="font-semibold mt-4">{t.writeOffs.reasons}</h3>
              <ul className="list-disc pl-5">
                {Object.entries(writeOffReport.reasons).map(([reason, qty]) => (
                  <li key={reason}>
                    {reason}: {qty}
                  </li>
                ))}
              </ul>
              <table className="w-full table-auto mt-4">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 text-left">{t.writeOffs.table.medication}</th>
                    <th className="px-4 py-2 text-left">{t.writeOffs.table.quantity}</th>
                    <th className="px-4 py-2 text-left">{t.writeOffs.table.reason}</th>
                  </tr>
                </thead>
                <tbody>
                  {writeOffReport.topMedications.map((med) => (
                    <tr key={med.medication + med.reason} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{med.medication}</td>
                      <td className="px-4 py-2">{med.quantity}</td>
                      <td className="px-4 py-2">{med.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Usage Report */}
          {usageReport && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">{t.usage.title}</h2>
              <p>
                {t.usage.totalUsage}: {usageReport.totalUsage}
              </p>
              <p>
                {t.usage.totalSales}: {usageReport.totalSales}
              </p>
              <p>
                {t.usage.totalWriteOffs}: {usageReport.totalWriteOffs}
              </p>
              <p>
                {t.usage.usageRatio}: {usageReport.usageRatio.toFixed(2)}%
              </p>
              <h3 className="font-semibold mt-4">{t.usage.snapshotTitle}</h3>
              <table className="w-full table-auto mt-4">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 text-left">{t.usage.table.medication}</th>
                    <th className="px-4 py-2 text-left">{t.usage.table.quantity}</th>
                  </tr>
                </thead>
                <tbody>
                  {usageReport.snapshot.map((item) => (
                    <tr key={item._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{item.medication.name}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}