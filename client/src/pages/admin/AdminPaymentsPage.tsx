import React, { useEffect, useState } from 'react';
import { Receipt, Search, Filter } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { formatINR, formatDate } from '../../utils/formatters.js';
import { NeuCard, NeuBadge, NeuInput, NeuSelect } from '../../components/neumorphic/index.js';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      try {
        const res = await apiClient.getAdminPayments();
        if (res.success) setPayments(res.data.payments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  const filtered = payments.filter(p => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch = !search ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.memberUser?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Simulated Payment Ledger</h1>
        <p className="text-xs lg:text-sm text-gray-600 mt-1">
          Review simulated membership revenue transactions, UPI transfers, and payment logs.
        </p>
      </div>

      <NeuCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:w-80">
            <NeuInput
              placeholder="Search payment ID, member, plan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="w-full md:w-56">
            <NeuSelect
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={[
                { label: 'All Payment Statuses', value: 'all' },
                { label: 'Completed Only', value: 'completed' },
                { label: 'Failed Only', value: 'failed' },
                { label: 'Refunded Only', value: 'refunded' }
              ]}
            />
          </div>
        </div>
      </NeuCard>

      <NeuCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-200/40 uppercase tracking-wider font-extrabold text-gray-600 border-b border-gray-300/40">
              <tr>
                <th className="p-4">Payment ID</th>
                <th className="p-4">Member Name</th>
                <th className="p-4">Description</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/30">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 font-semibold">No payment transactions recorded.</td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-200/30">
                    <td className="p-4 font-mono font-bold text-gray-900">{p.id}</td>
                    <td className="p-4">
                      <span className="font-bold text-gray-900 block">{p.memberUser?.name || 'Member'}</span>
                      <span className="text-[11px] text-gray-500 block">{p.memberUser?.email}</span>
                    </td>
                    <td className="p-4 font-semibold text-gray-800">{p.description}</td>
                    <td className="p-4 font-black text-gray-900">{formatINR(p.amountPaise)}</td>
                    <td className="p-4 uppercase font-semibold text-gray-600">{p.method.replace('_', ' ')}</td>
                    <td className="p-4">
                      <NeuBadge variant={p.status === 'completed' ? 'emerald' : 'rose'} size="sm">
                        {p.status}
                      </NeuBadge>
                    </td>
                    <td className="p-4 text-gray-500">{formatDate(p.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeuCard>
    </div>
  );
};
