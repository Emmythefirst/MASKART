import { Package, DollarSign, TrendingUp } from 'lucide-react';
import type { Storefront } from '../../types';
import { formatNumber } from '../../utils/format';

interface DashboardProps {
  storefront: Storefront;
}

function Dashboard({ storefront }: DashboardProps) {
  const stats = [
    {
      label: 'Total Products',
      value: storefront.stats.totalProducts,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/20'
    },
    {
      label: 'Total Sales',
      value: storefront.stats.totalSales,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      label: 'Total Revenue',
      value: `${storefront.stats.totalRevenue.toFixed(2)} SOL`,
      icon: DollarSign,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{storefront.storeName}</h1>
        <p className="text-gray-400">{storefront.description || 'No description'}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold">
                  {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;