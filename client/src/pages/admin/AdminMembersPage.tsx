import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, ShieldAlert, CheckCircle2, XCircle, Eye, UserCheck, UserX } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { useToast } from '../../context/ToastContext.js';
import { formatDate } from '../../utils/formatters.js';
import { NeuCard, NeuButton, NeuBadge, NeuInput, NeuSelect, NeuModal } from '../../components/neumorphic/index.js';

export const AdminMembersPage: React.FC = () => {
  const { showToast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Status Change Confirmation Modal
  const [targetMember, setTargetMember] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<'active' | 'suspended'>('suspended');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMembers = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await apiClient.getAdminMembers(params);
      if (res.success) {
        setMembers(res.data.members || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [search, statusFilter]);

  const handleToggleStatus = async () => {
    if (!targetMember) return;
    setIsSubmitting(true);

    const res = await apiClient.updateMemberStatus(targetMember.id, newStatus);
    setIsSubmitting(false);

    if (res.success) {
      showToast(
        newStatus === 'suspended' ? 'Member Suspended' : 'Member Activated',
        `Member ${targetMember.name} has been ${newStatus}. ${newStatus === 'suspended' ? 'Active sessions invalidated.' : ''}`,
        newStatus === 'suspended' ? 'warning' : 'success'
      );
      setTargetMember(null);
      await loadMembers();
    } else {
      showToast('Action Failed', res.error?.message || 'Failed to update member status.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Member Management</h1>
        <p className="text-xs lg:text-sm text-gray-600 mt-1">
          View registered gym members, check active subscriptions, and suspend/activate accounts.
        </p>
      </div>

      {/* Filters Bar */}
      <NeuCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:w-80">
            <NeuInput
              placeholder="Search by name, email, ID..."
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
                { label: 'All Statuses', value: 'all' },
                { label: 'Active Only', value: 'active' },
                { label: 'Suspended Only', value: 'suspended' }
              ]}
            />
          </div>
        </div>
      </NeuCard>

      {/* Members Table */}
      <NeuCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-200/40 uppercase tracking-wider font-extrabold text-gray-600 border-b border-gray-300/40">
              <tr>
                <th className="p-4">Member ID</th>
                <th className="p-4">Name & Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Active Plan</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/30">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 font-semibold">
                    No members matched your search criteria.
                  </td>
                </tr>
              ) : (
                members.map(m => (
                  <tr key={m.id} className="hover:bg-gray-200/30">
                    <td className="p-4 font-mono font-bold text-gray-900">{m.id}</td>
                    <td className="p-4">
                      <span className="font-bold text-gray-900 block">{m.name}</span>
                      <span className="text-[11px] text-gray-500 block">{m.email}</span>
                    </td>
                    <td className="p-4 font-semibold text-gray-700">{m.phone || 'N/A'}</td>
                    <td className="p-4">
                      {m.subscription?.plan ? (
                        <NeuBadge variant="emerald" size="sm">{m.subscription.plan.name}</NeuBadge>
                      ) : (
                        <NeuBadge variant="gray" size="sm">No Active Plan</NeuBadge>
                      )}
                    </td>
                    <td className="p-4">
                      <NeuBadge variant={m.status === 'active' ? 'emerald' : 'rose'} size="sm">
                        {m.status}
                      </NeuBadge>
                    </td>
                    <td className="p-4 text-gray-500">{formatDate(m.createdAt)}</td>
                    <td className="p-4 text-right space-x-2">
                      <Link to={`/admin/members/${m.id}`}>
                        <NeuButton variant="secondary" size="sm" title="View Full Details">
                          <Eye className="w-3.5 h-3.5" /> View
                        </NeuButton>
                      </Link>
                      {m.status === 'active' ? (
                        <NeuButton
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setTargetMember(m);
                            setNewStatus('suspended');
                          }}
                        >
                          <UserX className="w-3.5 h-3.5" /> Suspend
                        </NeuButton>
                      ) : (
                        <NeuButton
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setTargetMember(m);
                            setNewStatus('active');
                          }}
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Activate
                        </NeuButton>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeuCard>

      {/* Status Toggle Modal */}
      <NeuModal
        isOpen={!!targetMember}
        onClose={() => setTargetMember(null)}
        title={newStatus === 'suspended' ? 'Confirm Member Suspension' : 'Reactivate Member Account'}
      >
        {targetMember && (
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Are you sure you want to {newStatus === 'suspended' ? 'suspend' : 'reactivate'} member <strong className="text-gray-900">{targetMember.name}</strong> ({targetMember.email})?
            </p>

            {newStatus === 'suspended' ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" /> Account Suspension Implications:</p>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-1">
                  <li>Invalidates active server sessions immediately.</li>
                  <li>Blocks member login access and class bookings.</li>
                  <li>Prevents new membership purchases or renewals.</li>
                </ul>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                Reactivating this account will restore login and platform features.
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <NeuButton variant="secondary" onClick={() => setTargetMember(null)}>
                Cancel
              </NeuButton>
              <NeuButton
                variant={newStatus === 'suspended' ? 'danger' : 'primary'}
                onClick={handleToggleStatus}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : `Confirm ${newStatus === 'suspended' ? 'Suspension' : 'Activation'}`}
              </NeuButton>
            </div>
          </div>
        )}
      </NeuModal>
    </div>
  );
};
