'use client';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Field,
  FieldGroup,
} from "@/components/ui/field"
import { useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, Mail, Lock, KeyRound } from "lucide-react"
import { apiClient } from "@/lib/api"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

type ForgotPasswordStep = 'email' | 'otp' | 'newPassword' | 'success';

interface ForgotPasswordFormProps extends React.ComponentProps<"div"> {
  onBack?: () => void;
}

export function ForgotPasswordForm({
  className,
  onBack,
  ...props
}: ForgotPasswordFormProps) {
  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Kérlek add meg a felhasználóneved vagy e-mail címed!');
      return;
    }

    // Check if input is an email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailFormat = emailRegex.test(username);
    
    // Extract username - either use the input as-is (if username) or extract from email
    const processedUsername = isEmailFormat ? username.split('@')[0] : username;
    
    if (!processedUsername.trim()) {
      toast.error('Érvénytelen felhasználónév!');
      return;
    }

    setIsLoading(true);
    
    try {
      await apiClient.forgotPassword({ username: processedUsername.trim() });
      toast.success('OTP kód elküldve az email címére!');
      setStep('otp');
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = (error as Error & { detail?: string })?.detail || 'Hiba történt. Kérjük próbálja újra.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode.trim() || otpCode.length !== 6) {
      toast.error('Kérlek add meg a 6 jegyű OTP kódot!');
      return;
    }

    // Extract username from email or use directly
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailFormat = emailRegex.test(username);
    const processedUsername = isEmailFormat ? username.split('@')[0] : username;

    setIsLoading(true);
    
    try {
      const data = await apiClient.checkOTP({ 
        username: processedUsername.trim(), 
        otp_code: otpCode.trim() 
      });
      toast.success('OTP kód ellenőrizve!');
      setResetToken(data.reset_token);
      setStep('newPassword');
    } catch (error) {
      console.error('OTP verification error:', error);
      const errorMessage = (error as Error & { detail?: string })?.detail || 'Érvénytelen OTP kód.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword.trim() || newPassword.length < 6) {
      toast.error('A jelszónak legalább 6 karakter hosszúnak kell lennie!');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('A jelszavak nem egyeznek!');
      return;
    }

    // Extract username from email or use directly
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailFormat = emailRegex.test(username);
    const processedUsername = isEmailFormat ? username.split('@')[0] : username;

    setIsLoading(true);
    
    try {
      await apiClient.changePasswordOTP({ 
        username: processedUsername.trim(), 
        reset_token: resetToken,
        new_password: newPassword 
      });
      toast.success('Jelszó sikeresen megváltoztatva!');
      setStep('success');
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage = (error as Error & { detail?: string })?.detail || 'Hiba történt a jelszó megváltoztatása során.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    onBack?.();
  };

  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <Mail className="h-12 w-12 text-muted-foreground mb-2" />
          <h1 className="text-2xl font-bold">Elfelejtett jelszó</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Add meg a felhasználóneved vagy e-mail címed és küldünk egy OTP kódot az email címedre
          </p>
        </div>
        
        <Field>
          <Label htmlFor="username">Felhasználónév vagy E-mail cím</Label>
          <Input
            id="username"
            type="text"
            placeholder="felhasználónév vagy e-mail"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="username"
          />
        </Field>

        <Button 
          type="submit"
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>OTP küldése...</>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              OTP kód küldése
            </>
          )}
        </Button>

        <Button 
          type="button"
          variant="ghost"
          onClick={handleBackToLogin}
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Vissza a bejelentkezéshez
        </Button>
      </FieldGroup>
    </form>
  );

  const renderOtpStep = () => (
    <form onSubmit={handleOtpSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <KeyRound className="h-12 w-12 text-muted-foreground mb-2" />
          <h1 className="text-2xl font-bold">OTP ellenőrzés</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Írd be a 6 jegyű kódot, amit az email címedre küldtünk
          </p>
        </div>
        
        <Field>
          <Label htmlFor="otpCode">OTP kód</Label>
          <div className="flex justify-center">
            <InputOTP 
              maxLength={6} 
              value={otpCode}
              onChange={(value) => setOtpCode(value)}
              disabled={isLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </Field>

        <Button 
          type="submit"
          disabled={isLoading || otpCode.length !== 6}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>Ellenőrzés...</>
          ) : (
            <>
              <KeyRound className="mr-2 h-4 w-4" />
              OTP ellenőrzése
            </>
          )}
        </Button>

        <Button 
          type="button"
          variant="ghost"
          onClick={() => setStep('email')}
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Vissza
        </Button>
      </FieldGroup>
    </form>
  );

  const renderNewPasswordStep = () => (
    <form onSubmit={handlePasswordSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <Lock className="h-12 w-12 text-muted-foreground mb-2" />
          <h1 className="text-2xl font-bold">Új jelszó</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Add meg az új jelszavad
          </p>
        </div>
        
        <Field>
          <Label htmlFor="newPassword">Új jelszó</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isLoading}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </Field>

        <Field>
          <Label htmlFor="confirmPassword">Jelszó megerősítése</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </Field>

        <Button 
          type="submit"
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>Mentés...</>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Jelszó megváltoztatása
            </>
          )}
        </Button>

        <Button 
          type="button"
          variant="ghost"
          onClick={() => setStep('otp')}
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Vissza
        </Button>
      </FieldGroup>
    </form>
  );

  const renderSuccessStep = () => (
    <FieldGroup>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-2">
          <Lock className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold">Jelszó megváltoztatva!</h1>
        <p className="text-muted-foreground text-sm text-balance">
          A jelszavad sikeresen megváltozott. Most már bejelentkezhetsz az új jelszavaddal.
        </p>

        <Button 
          onClick={handleBackToLogin}
          className="w-full"
          size="lg"
        >
          Bejelentkezés
        </Button>
      </div>
    </FieldGroup>
  );

  return (
    <div 
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      {step === 'email' && renderEmailStep()}
      {step === 'otp' && renderOtpStep()}
      {step === 'newPassword' && renderNewPasswordStep()}
      {step === 'success' && renderSuccessStep()}
    </div>
  );
}