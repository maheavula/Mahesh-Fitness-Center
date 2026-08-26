import { ApiResponse } from '../types/index.js';

// Educational Vulnerability (Hard Tier): Hardcoded Master API Key embedded in client bundle
export const AMR_ADMIN_MASTER_KEY = "AMR_SECRET_MASTER_API_KEY_2026_V1";

class ApiClient {
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Retrieve saved session token if available in memory / fallback header
    const token = localStorage.getItem('mfc_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Include HTTP-only cookies
    };

    try {
      const response = await fetch(endpoint, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || {
            code: 'HTTP_ERROR',
            message: `Request failed with status ${response.status}`,
          },
        };
      }

      return data;
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err.message || 'Unable to connect to Mahesh Fitness Center server.',
        },
      };
    }
  }

  // --- API 1: AUTH ---
  public async signup(payload: any) {
    const res = await this.request('/api/auth/signup', { method: 'POST', body: JSON.stringify(payload) });
    if (res.success && res.data?.token) {
      localStorage.setItem('mfc_token', res.data.token);
    }
    return res;
  }

  public async login(payload: any) {
    const res = await this.request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    if (res.success && res.data?.token) {
      localStorage.setItem('mfc_token', res.data.token);
    }
    return res;
  }

  public async logout() {
    const res = await this.request('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('mfc_token');
    return res;
  }

  public async getMe() {
    return this.request('/api/auth/me');
  }

  // --- API 2: MEMBER ---
  public async getMemberProfile() {
    return this.request('/api/member/profile');
  }

  public async updateMemberProfile(payload: any) {
    return this.request('/api/member/profile', { method: 'PUT', body: JSON.stringify(payload) });
  }

  public async getMemberDashboard() {
    return this.request('/api/member/dashboard');
  }

  public async getMemberAttendance() {
    return this.request('/api/member/attendance');
  }

  public async getMemberActivity() {
    return this.request('/api/member/activity');
  }

  public async logMemberActivity(payload: any) {
    return this.request('/api/member/activity', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async getMemberStats() {
    return this.request('/api/member/stats');
  }

  // --- API 3: CLASSES ---
  public async getClasses(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/classes${query ? `?${query}` : ''}`);
  }

  public async getClassDetail(id: string) {
    return this.request(`/api/classes/${id}`);
  }

  public async getTrainers() {
    return this.request('/api/classes/trainers');
  }

  public async getClassSchedule() {
    return this.request('/api/classes/schedule');
  }

  public async bookClass(id: string) {
    return this.request(`/api/classes/${id}/book`, { method: 'POST' });
  }

  public async cancelBooking(bookingId: string) {
    return this.request(`/api/classes/bookings/${bookingId}`, { method: 'DELETE' });
  }

  public async getMyBookings() {
    return this.request('/api/classes/bookings');
  }

  // --- API 4: MEMBERSHIP ---
  public async getMembershipPlans() {
    return this.request('/api/membership/plans');
  }

  public async getCurrentMembership() {
    return this.request('/api/membership/current');
  }

  public async subscribeMembership(payload: any) {
    return this.request('/api/membership/subscribe', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async renewMembership(payload: any) {
    return this.request('/api/membership/renew', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async getPayments() {
    return this.request('/api/membership/payments');
  }

  // --- API 5: ADMIN ---
  public async getAdminDashboard() {
    return this.request('/api/admin/dashboard');
  }

  public async getAdminMembers(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/members${query ? `?${query}` : ''}`);
  }

  public async getAdminMemberDetail(id: string) {
    return this.request(`/api/admin/members/${id}`);
  }

  public async updateMemberStatus(id: string, status: 'active' | 'suspended') {
    return this.request(`/api/admin/members/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  }

  public async getAdminPlans() {
    return this.request('/api/admin/plans');
  }

  public async createPlan(payload: any) {
    return this.request('/api/admin/plans', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async updatePlan(id: string, payload: any) {
    return this.request(`/api/admin/plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  public async updatePlanStatus(id: string, status: string) {
    return this.request(`/api/admin/plans/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  }

  public async getAdminTrainers() {
    return this.request('/api/admin/trainers');
  }

  public async createTrainer(payload: any) {
    return this.request('/api/admin/trainers', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async updateTrainer(id: string, payload: any) {
    return this.request(`/api/admin/trainers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  public async updateTrainerStatus(id: string, status: string) {
    return this.request(`/api/admin/trainers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  }

  public async createClass(payload: any) {
    return this.request('/api/admin/classes', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async updateClass(id: string, payload: any) {
    return this.request(`/api/admin/classes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  public async cancelClassByAdmin(id: string) {
    return this.request(`/api/admin/classes/${id}`, { method: 'DELETE' });
  }

  public async getAdminBookings() {
    return this.request('/api/admin/bookings');
  }

  public async getAdminAttendance() {
    return this.request('/api/admin/attendance');
  }

  public async recordAttendance(payload: any) {
    return this.request('/api/admin/attendance', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async getAdminPayments() {
    return this.request('/api/admin/payments');
  }

  public async getAdminAuditLogs() {
    return this.request('/api/admin/audit');
  }

  // --- API 6: SYSTEM ---
  public async getSystemSession() {
    return this.request('/api/system/session');
  }

  public async refreshSystemSession() {
    return this.request('/api/system/session/refresh', { method: 'POST' });
  }

  public async getSystemHealth() {
    return this.request('/api/system/health');
  }

  public async getSystemInfo() {
    return this.request('/api/system/info');
  }
}

export const apiClient = new ApiClient();
