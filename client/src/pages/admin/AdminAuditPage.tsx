import React, { useEffect, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { formatDate } from '../../utils/formatters.js';
import { NeuCard, NeuBadge, NeuInput } from '../../components/neumorphic/index.js';

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAuditLogs() {
      try {
        const res = await apiClient.getAdminAuditLogs();
        if (res.success) setLogs(res.data.auditLogs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAuditLogs();
  }, []);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      l.id.toLowerCase().includes(term) ||
      l.action.toLowerCase().includes(term) ||
      l.userId.toLowerCase().includes(term) ||
      l.userName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">System Audit Trail</h1>
        <p className="text-xs lg:text-sm text-gray-600 mt-1">
          Complete security event logs for member signups, class bookings, attendance, and administrative changes.
        </p>
      </div>

      <NeuCard className="p-6">
        <div className="w-full md:w-80">
          <NeuInput
            placeholder="Search action, user ID, name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </NeuCard>

      <NeuCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-200/40 uppercase tracking-wider font-extrabold text-gray-600 border-b border-gray-300/40">
              <tr>
                <th className="p-4">Log ID</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action</th>
                <th className="p-4">User</th>
                <th className="p-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/30">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-semibold">No audit logs recorded.</td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-gray-200/30">
                    <td className="p-4 font-mono font-bold text-gray-900">{log.id}</td>
                    <td className="p-4 text-gray-500 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                    <td className="p-4">
                      <NeuBadge variant="blue" size="sm">{log.action}</NeuBadge>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-gray-900 block">{log.userName || log.userId}</span>
                      <span className="text-[10px] font-mono text-gray-500 block">{log.userId}</span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-gray-600 max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '-'}
                    </td>
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
