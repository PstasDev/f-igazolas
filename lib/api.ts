// API client for communicating with Django backend
import Cookies from 'js-cookie';
import { config } from './config';
import type {
  LoginRequest,
  TokenResponse,
  Profile,
  Osztaly,
  IgazolasTipus,
  Igazolas,
  IgazolasCreateRequest,
  ErrorResponse,
  QuickActionRequest,
  BulkQuickActionRequest,
  QuickActionResponse,
  BulkQuickActionResponse,
  TeacherCommentUpdateRequest,
  TeacherCommentUpdateResponse,
  DiakjaSignle,
  DiakjaCreateRequest,
  DiakjaCreateResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  CheckOTPRequest,
  CheckOTPResponse,
  ChangePasswordOTPRequest,
  ChangePasswordOTPResponse,
  IgazolasTipusToggleRequest,
  IgazolasTipusToggleResponse,
  FTVSyncMode,
  FTVSyncMetadataResponse,
  ManualFTVSyncResponse,
  FTVRegistrationCheckResponse,
  TanevRendje,
  TanitasiSzunetCreateRequest,
  TanitasiSzunetUpdateRequest,
  OverrideCreateRequest,
  OverrideUpdateRequest,
  SuperuserCheckResponse,
  TanitasiSzunet,
  Override,
  MulasztasAnalysis,
  MulasztasUploadResponse,
  MulasztasDeleteResponse,
} from './types';
import { SystemMessage } from './system-message-types';

// Use the config for API base URL
const API_BASE_URL = config.api.baseUrl;

// Cookie key for JWT token
const JWT_COOKIE_KEY = 'jwt_token';

interface APIError extends Error {
  status?: number;
  detail?: string;
}

// Simple in-memory cache for GET requests
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

class APIClient {
  private baseUrl: string;
  private onAuthError?: () => void;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTTL: number = 60000; // 1 minute cache TTL
  private pendingRequests: Map<string, Promise<unknown>> = new Map(); // Request deduplication

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Set callback for authentication errors
  setAuthErrorHandler(handler: () => void): void {
    this.onAuthError = handler;
  }

  // Get JWT token from cookies
  getToken(): string | undefined {
    return Cookies.get(JWT_COOKIE_KEY);
  }

  // Set JWT token in cookies (7 days expiry)
  setToken(token: string): void {
    Cookies.set(JWT_COOKIE_KEY, token, { 
      expires: 7, 
      sameSite: 'strict',
      path: '/',
      secure: window.location.protocol === 'https:'
    });
  }

  // Remove JWT token from cookies
  removeToken(): void {
    Cookies.remove(JWT_COOKIE_KEY, { path: '/' });
    // Clear cache on logout
    this.cache.clear();
    this.pendingRequests.clear();
  }
  
  // Clear cache for a specific key or all cache
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
  
  // Check if cached data is still valid
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.cacheTTL;
  }
  
  // Get cached data if available and valid
  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && this.isCacheValid(entry)) {
      return entry.data as T;
    }
    if (entry) {
      this.cache.delete(key); // Remove stale cache
    }
    return null;
  }
  
  // Set cached data
  private setCachedData(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Generic fetch wrapper with JWT authentication
  private async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const method = options.method || 'GET';
    const cacheKey = `${method}:${endpoint}`;
    
    // For GET requests, check cache first
    if (method === 'GET') {
      const cachedData = this.getCachedData<T>(cacheKey);
      if (cachedData !== null) {
        return cachedData;
      }
      
      // Deduplicate concurrent requests
      const pendingRequest = this.pendingRequests.get(cacheKey);
      if (pendingRequest) {
        return pendingRequest as Promise<T>;
      }
    }
    
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add existing headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const requestPromise = (async () => {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        // Handle error responses
        if (!response.ok) {
          // Handle authentication errors (401, 403)
          if (response.status === 401 || response.status === 403) {
            this.removeToken();
            if (this.onAuthError) {
              this.onAuthError();
            }
          }

          const errorData: ErrorResponse = await response.json().catch(() => ({
            error: 'Request failed',
            detail: `HTTP ${response.status}: ${response.statusText}`,
          }));

          const error = new Error(errorData.detail || errorData.error) as APIError;
          error.status = response.status;
          error.detail = errorData.detail;
          throw error;
        }

        // Handle empty responses (204 No Content)
        if (response.status === 204) {
          return {} as T;
        }

        const data = await response.json();
        
        // Cache GET requests
        if (method === 'GET') {
          this.setCachedData(cacheKey, data);
        }
        
        return data;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('An unexpected error occurred');
      } finally {
        // Remove from pending requests
        if (method === 'GET') {
          this.pendingRequests.delete(cacheKey);
        }
      }
    })();
    
    // Store pending request for deduplication
    if (method === 'GET') {
      this.pendingRequests.set(cacheKey, requestPromise);
    }
    
    return requestPromise;
  }

  // Authentication endpoints

  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await this.fetchWithAuth<TokenResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store token in cookies
    this.setToken(response.token);
    
    return response;
  }

  logout(): void {
    this.removeToken();
  }

  // Profile endpoints

  async getMyProfile(): Promise<Profile> {
    return this.fetchWithAuth<Profile>('/profiles/me');
  }

  async getProfile(profileId: number): Promise<Profile> {
    return this.fetchWithAuth<Profile>(`/profiles/${profileId}`);
  }

  async listProfiles(): Promise<Profile[]> {
    return this.fetchWithAuth<Profile[]>('/profiles');
  }

  // Frontend Config endpoints

  async getMyFrontendConfig(): Promise<Record<string, unknown>> {
    return this.fetchWithAuth<Record<string, unknown>>('/profiles/me/frontend-config');
  }

  async updateMyFrontendConfig(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.fetchWithAuth<Record<string, unknown>>('/profiles/me/frontend-config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Osztaly endpoints

  async listOsztaly(): Promise<Osztaly[]> {
    return this.fetchWithAuth<Osztaly[]>('/osztaly');
  }

  async getOsztaly(osztalyId: number): Promise<Osztaly> {
    return this.fetchWithAuth<Osztaly>(`/osztaly/${osztalyId}`);
  }

  // Toggle igazolás tipus acceptance for teacher's class
  async toggleIgazolasTipus(data: IgazolasTipusToggleRequest): Promise<IgazolasTipusToggleResponse> {
    return this.fetchWithAuth<IgazolasTipusToggleResponse>('/osztaly/igazolas-tipus/toggle', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // IgazolasTipus endpoints

  async listIgazolasTipus(): Promise<IgazolasTipus[]> {
    return this.fetchWithAuth<IgazolasTipus[]>('/igazolas-tipus');
  }

  async getIgazolasTipus(tipusId: number): Promise<IgazolasTipus> {
    return this.fetchWithAuth<IgazolasTipus>(`/igazolas-tipus/${tipusId}`);
  }

  // Igazolas endpoints

  async listIgazolas(mode: FTVSyncMode = 'live', debugPerformance: boolean = false): Promise<Igazolas[]> {
    const params = new URLSearchParams({ mode });
    if (debugPerformance) {
      params.append('debug-performance', 'true');
    }
    return this.fetchWithAuth<Igazolas[]>(`/igazolas?${params.toString()}`);
  }

  async getMyIgazolas(mode: FTVSyncMode = 'live', debugPerformance: boolean = false): Promise<Igazolas[]> {
    const params = new URLSearchParams({ mode });
    if (debugPerformance) {
      params.append('debug-performance', 'true');
    }
    return this.fetchWithAuth<Igazolas[]>(`/igazolas/my?${params.toString()}`);
  }

  async getIgazolas(igazolasId: number): Promise<Igazolas> {
    return this.fetchWithAuth<Igazolas>(`/igazolas/${igazolasId}`);
  }

  async createIgazolas(data: IgazolasCreateRequest): Promise<Igazolas> {
    return this.fetchWithAuth<Igazolas>('/igazolas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // TODO: Add update/delete endpoints when backend implements them
  async updateIgazolasStatus(
    igazolasId: number,
    allapot: string,
    megjegyzes_tanar?: string
  ): Promise<Igazolas> {
    return this.fetchWithAuth<Igazolas>(`/igazolas/${igazolasId}`, {
      method: 'PATCH',
      body: JSON.stringify({ allapot, megjegyzes_tanar }),
    });
  }

  async deleteIgazolas(igazolasId: number): Promise<void> {
    return this.fetchWithAuth<void>(`/igazolas/${igazolasId}`, {
      method: 'DELETE',
    });
  }

  // Quick Action endpoints

  async quickActionIgazolas(
    igazolasId: number,
    data: QuickActionRequest
  ): Promise<QuickActionResponse> {
    return this.fetchWithAuth<QuickActionResponse>(`/igazolas/${igazolasId}/quick-action`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkQuickActionIgazolas(
    data: BulkQuickActionRequest
  ): Promise<BulkQuickActionResponse> {
    return this.fetchWithAuth<BulkQuickActionResponse>('/igazolas/quick-action/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Teacher Comment Update endpoint

  async updateTeacherComment(
    igazolasId: number,
    data: TeacherCommentUpdateRequest
  ): Promise<TeacherCommentUpdateResponse> {
    return this.fetchWithAuth<TeacherCommentUpdateResponse>(`/igazolas/${igazolasId}/teacher-comment`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Diakjaim endpoints (for class teachers only)

  async getDiakjaim(): Promise<DiakjaSignle[]> {
    return this.fetchWithAuth<DiakjaSignle[]>('/diakjaim');
  }

  async createDiakjaim(data: DiakjaCreateRequest[]): Promise<DiakjaCreateResponse> {
    return this.fetchWithAuth<DiakjaCreateResponse>('/diakjaim', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Forgot Password endpoints (these don't require authentication)

  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const url = `${this.baseUrl}/forgot-password`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json().catch(() => ({
          error: 'Request failed',
          detail: `HTTP ${response.status}: ${response.statusText}`,
        }));

        const error = new Error(errorData.detail || errorData.error) as APIError;
        error.status = response.status;
        error.detail = errorData.detail;
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async checkOTP(data: CheckOTPRequest): Promise<CheckOTPResponse> {
    const url = `${this.baseUrl}/check-otp`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json().catch(() => ({
          error: 'Request failed',
          detail: `HTTP ${response.status}: ${response.statusText}`,
        }));

        const error = new Error(errorData.detail || errorData.error) as APIError;
        error.status = response.status;
        error.detail = errorData.detail;
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async changePasswordOTP(data: ChangePasswordOTPRequest): Promise<ChangePasswordOTPResponse> {
    const url = `${this.baseUrl}/change-password-otp`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json().catch(() => ({
          error: 'Request failed',
          detail: `HTTP ${response.status}: ${response.statusText}`,
        }));

        const error = new Error(errorData.detail || errorData.error) as APIError;
        error.status = response.status;
        error.detail = errorData.detail;
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // FTV Sync endpoints

  async getFTVSyncMetadata(syncType: 'base' | 'user' | 'class' = 'base'): Promise<FTVSyncMetadataResponse> {
    return this.fetchWithAuth<FTVSyncMetadataResponse>(`/sync/ftv/metadata?sync_type=${syncType}`);
  }

  async manualFTVSync(debugPerformance: boolean = false): Promise<ManualFTVSyncResponse> {
    const params = debugPerformance ? '?debug-performance=true' : '';
    return this.fetchWithAuth<ManualFTVSyncResponse>(`/sync/ftv${params}`, {
      method: 'POST',
    });
  }

  async checkFTVRegistration(): Promise<FTVRegistrationCheckResponse> {
    return this.fetchWithAuth<FTVRegistrationCheckResponse>('/sync/ftv/check-registration');
  }

  // Tanév Rendje (School Year Schedule) endpoints

  // Check if current user is superuser
  async amISuperuser(): Promise<SuperuserCheckResponse> {
    return this.fetchWithAuth<SuperuserCheckResponse>('/am-i-superuser');
  }

  // Get schedule (breaks and overrides) with optional date filters
  async getTanevRendje(fromDate?: string, toDate?: string): Promise<TanevRendje> {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.fetchWithAuth<TanevRendje>(`/tanev_rendje${query}`);
  }

  // Teacher endpoints - Create override for own class
  async createClassOverride(data: OverrideCreateRequest): Promise<Override> {
    return this.fetchWithAuth<Override>('/override/class', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Teacher endpoints - Update override for own class
  async updateClassOverride(overrideId: number, data: OverrideUpdateRequest): Promise<Override> {
    return this.fetchWithAuth<Override>(`/override/class/${overrideId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Teacher endpoints - Delete override for own class
  async deleteClassOverride(overrideId: number): Promise<void> {
    return this.fetchWithAuth<void>(`/override/class/${overrideId}`, {
      method: 'DELETE',
    });
  }

  // Superuser endpoints - Create any override (global or class-specific)
  async createGlobalOverride(data: OverrideCreateRequest): Promise<Override> {
    return this.fetchWithAuth<Override>('/override/global', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Superuser endpoints - Update any override
  async updateGlobalOverride(overrideId: number, data: OverrideUpdateRequest): Promise<Override> {
    return this.fetchWithAuth<Override>(`/override/global/${overrideId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Superuser endpoints - Delete any override
  async deleteGlobalOverride(overrideId: number): Promise<void> {
    return this.fetchWithAuth<void>(`/override/global/${overrideId}`, {
      method: 'DELETE',
    });
  }

  // Superuser endpoints - Create school break
  async createTanitasiSzunet(data: TanitasiSzunetCreateRequest): Promise<TanitasiSzunet> {
    return this.fetchWithAuth<TanitasiSzunet>('/tanitasi-szunet', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Superuser endpoints - Update school break
  async updateTanitasiSzunet(szunetId: number, data: TanitasiSzunetUpdateRequest): Promise<TanitasiSzunet> {
    return this.fetchWithAuth<TanitasiSzunet>(`/tanitasi-szunet/${szunetId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Superuser endpoints - Delete school break
  async deleteTanitasiSzunet(szunetId: number): Promise<void> {
    return this.fetchWithAuth<void>(`/tanitasi-szunet/${szunetId}`, {
      method: 'DELETE',
    });
  }

  // Phase 1 Admin endpoints - Password Management

  async generatePassword(userId: number, sendEmail: boolean = false): Promise<{
    password?: string;
    message: string;
    email_sent: boolean;
  }> {
    return this.fetchWithAuth(`/admin/users/${userId}/generate-password?send_email=${sendEmail}`, {
      method: 'POST',
    });
  }

  async resetPassword(userId: number, newPassword: string, sendEmail: boolean = false): Promise<{
    message: string;
    email_sent: boolean;
  }> {
    return this.fetchWithAuth(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword, send_email: sendEmail }),
    });
  }

  // Phase 1 Admin endpoints - Teacher Assignment

  async assignTeacherToClass(classId: number, teacherId: number): Promise<{
    message: string;
    teacher: { id: number; username: string; name: string; is_superuser: boolean };
    class_info: { id: number; name: string };
  }> {
    return this.fetchWithAuth(`/admin/classes/${classId}/assign-teacher`, {
      method: 'POST',
      body: JSON.stringify({ teacher_id: teacherId }),
    });
  }

  async removeTeacherFromClass(classId: number, teacherId: number): Promise<{
    message: string;
    removed: boolean;
  }> {
    return this.fetchWithAuth(`/admin/classes/${classId}/remove-teacher/${teacherId}`, {
      method: 'DELETE',
    });
  }

  async moveOsztalyfonokToClass(classId: number): Promise<{
    message: string;
    previous_class: { id: number; name: string };
    new_class: { id: number; name: string };
  }> {
    return this.fetchWithAuth('/admin/users/osztalyfonok/move-to-class', {
      method: 'POST',
      body: JSON.stringify({ class_id: classId }),
    });
  }

  async getTeachersForClass(classId: number): Promise<{
    teachers: Array<{
      id: number;
      username: string;
      name: string;
      is_superuser: boolean;
      assigned_date: string | null;
    }>;
  }> {
    return this.fetchWithAuth(`/admin/classes/${classId}/teachers`);
  }

  // Phase 1 Admin endpoints - Permissions Management

  async promoteToSuperuser(userId: number): Promise<{
    message: string;
    user: { id: number; username: string; is_superuser: boolean };
  }> {
    return this.fetchWithAuth(`/admin/users/${userId}/promote-superuser`, {
      method: 'POST',
    });
  }

  async demoteFromSuperuser(userId: number): Promise<{
    message: string;
    user: { id: number; username: string; is_superuser: boolean };
  }> {
    return this.fetchWithAuth(`/admin/users/${userId}/demote-superuser`, {
      method: 'POST',
    });
  }

  async getUserPermissions(userId: number): Promise<{
    user_id: number;
    username: string;
    is_superuser: boolean;
    is_staff: boolean;
    permissions: unknown[];
    change_history: Array<{
      changed_by: string;
      changed_at: string;
      action: 'promoted' | 'demoted';
      previous_value: boolean;
      new_value: boolean;
    }>;
  }> {
    return this.fetchWithAuth(`/admin/users/${userId}/permissions`);
  }

  // Phase 1 Admin endpoints - Login Statistics

  async getStudentLoginStats(): Promise<{
    summary: {
      total: number;
      logged_in: number;
      never_logged_in: number;
    };
    per_class: Array<{
      class_id: number;
      class_name: string;
      total: number;
      logged_in: number;
      never_logged_in: number;
      students: Array<{
        id: number;
        name: string;
        last_login: string | null;
        login_count: number;
      }>;
    }>;
  }> {
    return this.fetchWithAuth('/admin/students/login-stats');
  }

  // System Messages endpoints (no authentication required)

  async getActiveSystemMessages(): Promise<SystemMessage[]> {
    const url = `${this.baseUrl}/system-messages/active`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Don't throw error for system messages, just return empty array
        console.error('Failed to fetch system messages:', response.statusText);
        return [];
      }

      return await response.json();
    } catch (error) {
      // Don't throw error for system messages, just return empty array
      console.error('Error fetching system messages:', error);
      return [];
    }
  }

  // Mulasztások (eKréta Absences) endpoints - EXPERIMENTAL

  /**
   * Upload eKréta XLSX file and create/update Mulasztás records
   * @param file - XLSX file from eKréta export
   * @returns Upload response with analysis
   */
  async uploadEkretaMulasztasok(file: File): Promise<MulasztasUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Use custom fetch for file upload (no JSON content-type)
    const token = this.getToken();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/mulasztas/upload-ekreta`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.detail || 'Failed to upload file') as APIError;
      error.status = response.status;
      error.detail = errorData.detail;
      throw error;
    }

    return response.json();
  }

  /**
   * Get my uploaded mulasztások with analysis
   * @param includeIgazolt - Include absences already justified in eKréta (default: false)
   * @returns Analysis with mulasztások list
   */
  async getMyMulasztasok(includeIgazolt: boolean = false): Promise<MulasztasAnalysis> {
    const params = new URLSearchParams();
    if (includeIgazolt) {
      params.append('include_igazolt', 'true');
    }
    
    const url = `/mulasztas/my${params.toString() ? `?${params.toString()}` : ''}`;
    return this.fetchWithAuth<MulasztasAnalysis>(url);
  }

  /**
   * Delete all my uploaded mulasztások
   * @returns Deletion response with count
   */
  async deleteMyMulasztasok(): Promise<MulasztasDeleteResponse> {
    return this.fetchWithAuth<MulasztasDeleteResponse>('/mulasztas/my', {
      method: 'DELETE',
    });
  }

  // Phase 2 Admin endpoints - Analytics & Monitoring

  async getClassActivityHeatmap(fromDate: string, toDate: string, metricType: 'submissions' | 'approvals' | 'logins' = 'submissions'): Promise<{
    dates: string[];
    classes: Array<{
      id: number;
      name: string;
      data: Array<{
        date: string;
        value: number;
        intensity: number;
      }>;
    }>;
  }> {
    return this.fetchWithAuth(`/admin/classes/activity-heatmap?from_date=${fromDate}&to_date=${toDate}&metric_type=${metricType}`);
  }

  async getClassesOverviewStats(): Promise<{
    classes: Array<{
      id: number;
      name: string;
      total_students: number;
      active_students: number;
      pending_count: number;
      approval_rate: number;
      last_activity: string | null;
    }>;
  }> {
    return this.fetchWithAuth('/admin/classes/overview-stats');
  }

  async getTeacherWorkload(): Promise<{
    teachers: Array<{
      id: number;
      name: string;
      classes: string[];
      total_students: number;
      pending_count: number;
      approved_today: number;
      rejected_today: number;
      avg_response_time_hours: number | null;
    }>;
  }> {
    return this.fetchWithAuth('/admin/teachers/workload');
  }

  async getTeacherActivity(teacherId: number, fromDate: string, toDate: string): Promise<{
    user: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    login_count: number;
    total_actions: number;
    actions_breakdown: {
      approved: number;
      rejected: number;
      commented: number;
    };
    activity_timeline: Array<{
      date: string;
      action_type: string;
      count: number;
    }>;
  }> {
    return this.fetchWithAuth(`/admin/teachers/${teacherId}/activity?from_date=${fromDate}&to_date=${toDate}`);
  }

  async getApprovalRates(fromDate: string, toDate: string, groupBy: 'teacher' | 'type' | 'class' | 'all' = 'all'): Promise<{
    overall_rate: number;
    by_teacher: Array<{
      teacher_id: number;
      teacher_name: string;
      total: number;
      approved: number;
      rejected: number;
      approval_rate: number;
    }>;
    by_type: Array<{
      type_id: number;
      type_name: string;
      total: number;
      approved: number;
      rejected: number;
      approval_rate: number;
    }>;
    by_class: Array<{
      class_id: number;
      class_name: string;
      total: number;
      approved: number;
      rejected: number;
      approval_rate: number;
    }>;
    trend: Array<{
      date: string;
      approval_rate: number;
      total: number;
    }>;
  }> {
    return this.fetchWithAuth(`/admin/analytics/approval-rates?from_date=${fromDate}&to_date=${toDate}&group_by=${groupBy}`);
  }

  // Feature #10: Database Statistics
  async getDatabaseStats(): Promise<unknown> {
    return this.fetchWithAuth('/admin/system/database-stats');
  }

  // Feature #12: Storage Usage Monitoring
  async getStorageStats(): Promise<unknown> {
    return this.fetchWithAuth('/admin/system/storage-stats');
  }

  // Feature #19: Maintenance Mode
  async getMaintenanceStatus(): Promise<unknown> {
    return this.fetchWithAuth('/admin/maintenance/status');
  }

  async toggleMaintenanceMode(data: { message?: string }): Promise<unknown> {
    return this.fetchWithAuth('/admin/maintenance/toggle', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Feature #11: API Performance Metrics
  async getAPIMetrics(fromDate?: string, toDate?: string): Promise<unknown> {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    const query = params.toString();
    return this.fetchWithAuth(`/admin/system/api-metrics${query ? `?${query}` : ''}`);
  }

  async refreshAPIMetrics(): Promise<unknown> {
    return this.fetchWithAuth('/admin/system/api-metrics/refresh', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Feature #15: Manual Attendance Management
  async createAttendance(data: unknown): Promise<unknown> {
    return this.fetchWithAuth('/admin/attendance/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAttendance(attendanceId: number, data: unknown): Promise<unknown> {
    return this.fetchWithAuth(`/admin/attendance/${attendanceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAttendance(attendanceId: number): Promise<unknown> {
    return this.fetchWithAuth(`/admin/attendance/${attendanceId}`, {
      method: 'DELETE',
    });
  }

  async getStudentAttendance(studentId: number, fromDate?: string, toDate?: string): Promise<unknown> {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    const query = params.toString();
    return this.fetchWithAuth(`/admin/attendance/student/${studentId}${query ? `?${query}` : ''}`);
  }

  // Feature #20: User Impersonation
  async startImpersonation(userId: number): Promise<unknown> {
    return this.fetchWithAuth('/admin/impersonate/start', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async stopImpersonation(): Promise<unknown> {
    return this.fetchWithAuth('/admin/impersonate/stop', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getImpersonationStatus(): Promise<unknown> {
    return this.fetchWithAuth('/admin/impersonate/status');
  }

  // Feature #28: Permission Matrix
  async getPermissionMatrix(): Promise<unknown> {
    return this.fetchWithAuth('/admin/igazolas-types/permission-matrix');
  }

  async updatePermission(data: { class_id: number; type_id: number; allowed: boolean }): Promise<unknown> {
    return this.fetchWithAuth('/admin/igazolas-types/update-permission', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkUpdatePermissions(data: { updates: Array<{ class_id: number; type_id: number; allowed: boolean }> }): Promise<unknown> {
    return this.fetchWithAuth('/admin/igazolas-types/bulk-update-permissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Feature #8: Multiple Class Support
  async assignClassesToTeacher(teacherId: number, data: { class_ids: number[]; is_primary: boolean; delegation_end_date?: string }): Promise<unknown> {
    return this.fetchWithAuth(`/admin/teachers/${teacherId}/assign-classes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTeacherClasses(teacherId: number): Promise<unknown> {
    return this.fetchWithAuth(`/admin/teachers/${teacherId}/classes`);
  }

  // Feature #25: Group Absences
  async getGroupEnabledTypes(): Promise<unknown> {
    return this.fetchWithAuth('/igazolastipus/group-enabled');
  }

  async getEligibleClassmates(): Promise<unknown> {
    return this.fetchWithAuth('/students/classmates-eligible');
  }

  async createGroupIgazolas(data: unknown): Promise<unknown> {
    return this.fetchWithAuth('/igazolasok/create-group', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGroupMembers(igazolasId: number): Promise<unknown> {
    return this.fetchWithAuth(`/igazolasok/${igazolasId}/group-members`);
  }

  // Feature #27: Period Configuration
  async getPeriodConfig(classId: number): Promise<unknown> {
    return this.fetchWithAuth(`/classes/${classId}/period-config`);
  }

  async updatePeriodConfig(classId: number, data: { enabled_periods: number[] }): Promise<unknown> {
    return this.fetchWithAuth(`/classes/${classId}/period-config`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getPeriodUsageAnalysis(classId: number): Promise<unknown> {
    return this.fetchWithAuth(`/classes/${classId}/period-usage-analysis`);
  }

  // Feature #14: Academic Year Archival
  async archiveAcademicYear(data: { year_start: number; archive_classes: boolean; archive_igazolasok: boolean }): Promise<unknown> {
    return this.fetchWithAuth('/admin/academic-year/archive', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getArchivedYears(): Promise<unknown> {
    return this.fetchWithAuth('/admin/academic-year/archived');
  }

  async getArchivedYearData(year: string): Promise<unknown> {
    return this.fetchWithAuth(`/admin/academic-year/${year}/data`);
  }

  // Feature #9: Bulk Assignment
  async createClassWithStudents(data: { tagozat: string; kezdes_eve: number; teacher_email: string; student_emails: string[] }): Promise<unknown> {
    return this.fetchWithAuth('/admin/academic-year/create-class', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkCreateStudents(data: { emails: string[]; class_id: number }): Promise<unknown> {
    return this.fetchWithAuth('/admin/bulk/create-students-with-passwords', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Feature #26: Teacher-Created Igazolások
  async getEligibleStudentsForIgazolas(): Promise<unknown> {
    return this.fetchWithAuth('/teachers/students/eligible-for-igazolas');
  }

  async createIgazolasForStudent(data: unknown): Promise<unknown> {
    return this.fetchWithAuth('/teachers/igazolasok/create-for-student', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkCreateIgazolasForStudents(data: unknown): Promise<unknown> {
    return this.fetchWithAuth('/teachers/igazolasok/create-bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export class for testing or multiple instances
export default APIClient;
