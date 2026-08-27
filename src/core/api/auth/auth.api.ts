import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';
import { mapAuthUserToUser } from '@core/api/auth/auth.helpers';

import type {
  AuthUser,
  ForgotPasswordPayload,
  GoogleCredentialPayload,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
  ResendVerificationPayload,
  ResetPasswordPayload,
  SetPasswordPayload,
  UpdatePreferredLanguagePayload,
  UpdateProfilePayload,
  User,
  UserPhotoConfirmRequest,
  UserPhotoUploadRequest,
  UserPhotoUploadResponse,
  VerifyEmailPayload,
  VerifyEmailResponse,
} from './auth.models';

export class AuthAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async refreshToken() {
    return this.httpClient.call<void>({
      path: '/auth/refresh-token',
      method: 'POST',
    });
  }

  async login(payload: LoginPayload) {
    return this.httpClient.call<AuthUser, LoginPayload, User>(
      {
        path: '/auth/signin',
        method: 'POST',
        data: payload,
      },
      mapAuthUserToUser,
    );
  }

  async googleSignIn(payload: GoogleCredentialPayload) {
    return this.httpClient.call<AuthUser, GoogleCredentialPayload, User>(
      {
        path: '/auth/google',
        method: 'POST',
        data: payload,
      },
      mapAuthUserToUser,
    );
  }

  async linkGoogle(payload: GoogleCredentialPayload) {
    return this.httpClient.call<AuthUser, GoogleCredentialPayload, User>(
      {
        path: '/auth/google/link',
        method: 'POST',
        data: payload,
      },
      mapAuthUserToUser,
    );
  }

  async setPassword(payload: SetPasswordPayload) {
    return this.httpClient.call<AuthUser, SetPasswordPayload, User>(
      {
        path: '/auth/password',
        method: 'POST',
        data: payload,
      },
      mapAuthUserToUser,
    );
  }

  async register(payload: RegisterPayload) {
    return this.httpClient.call<RegisterResponse, RegisterPayload>({
      path: '/auth/signup',
      method: 'POST',
      data: payload,
    });
  }

  async verifyEmail(payload: VerifyEmailPayload) {
    return this.httpClient.call<VerifyEmailResponse, VerifyEmailPayload>({
      path: '/auth/verify-email',
      method: 'GET',
      params: payload,
    });
  }

  async resendVerification(payload: ResendVerificationPayload) {
    return this.httpClient.call<RegisterResponse, ResendVerificationPayload>({
      path: '/auth/resend-verification',
      method: 'POST',
      data: payload,
    });
  }

  async logout() {
    return this.httpClient.call<void>({
      path: '/auth/signout',
      method: 'POST',
    });
  }

  async forgotPassword(payload: ForgotPasswordPayload) {
    return this.httpClient.call<void, ForgotPasswordPayload>({
      path: '/auth/forgot-password',
      method: 'POST',
      data: payload,
    });
  }

  async resetPassword(payload: ResetPasswordPayload) {
    return this.httpClient.call<void, ResetPasswordPayload>({
      path: '/auth/reset-password',
      method: 'POST',
      data: payload,
    });
  }

  async getSelfProfile() {
    return this.httpClient.callNoError<AuthUser>({
      path: '/auth/profile',
      method: 'GET',
    });
  }

  async getProfile() {
    return this.httpClient.call<AuthUser, object, User>(
      {
        path: '/auth/profile',
        method: 'GET',
      },
      mapAuthUserToUser,
    );
  }

  async updateProfile(payload: UpdateProfilePayload) {
    return this.httpClient.call<AuthUser, UpdateProfilePayload, User>(
      {
        path: '/auth/profile',
        method: 'PUT',
        data: payload,
      },
      mapAuthUserToUser,
    );
  }

  async updatePreferredLanguage(payload: UpdatePreferredLanguagePayload) {
    return this.httpClient.call<AuthUser, object, User>(
      {
        path: '/auth/profile',
        method: 'PUT',
        data: payload,
      },
      mapAuthUserToUser,
    );
  }

  async getProfilePhotoUploadUrl(payload: UserPhotoUploadRequest) {
    return this.httpClient.call<UserPhotoUploadResponse, UserPhotoUploadRequest>({
      path: '/auth/profile/photo/upload-url',
      method: 'POST',
      data: payload,
    });
  }

  async confirmProfilePhotoUpload(payload: UserPhotoConfirmRequest) {
    return this.httpClient.call<AuthUser, UserPhotoConfirmRequest, User>(
      {
        path: '/auth/profile/photo/confirm',
        method: 'POST',
        data: payload,
      },
      mapAuthUserToUser,
    );
  }

  async uploadProfilePhoto(file: File) {
    const { upload_url, file_key } = await this.getProfilePhotoUploadUrl({
      content_type: file.type as UserPhotoUploadRequest['content_type'],
    });

    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('PROFILE_PHOTO_UPLOAD_FAILED');
    }

    return this.confirmProfilePhotoUpload({ file_key });
  }
}
