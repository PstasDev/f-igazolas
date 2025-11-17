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

class APIClient {
  private baseUrl: string;
  private onAuthError?: () => void;

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
  }

  // Generic fetch wrapper with JWT authentication
  private async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
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

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
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
}

// Export singleton instance
export const apiClient = new APIClient();

// Export class for testing or multiple instances
export default APIClient;
