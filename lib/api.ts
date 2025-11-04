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
} from './types';

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
    Cookies.set(JWT_COOKIE_KEY, token, { expires: 7, sameSite: 'strict' });
  }

  // Remove JWT token from cookies
  removeToken(): void {
    Cookies.remove(JWT_COOKIE_KEY);
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
}

// Export singleton instance
export const apiClient = new APIClient();

// Export class for testing or multiple instances
export default APIClient;
