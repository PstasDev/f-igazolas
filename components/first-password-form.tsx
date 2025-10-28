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
import { ArrowLeft, Mail, Lock, KeyRound, UserPlus } from "lucide-react"
import { apiClient } from "@/lib/api"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

type FirstPasswordStep = 'email' | 'otp' | 'newPassword' | 'success';

interface FirstPasswordFormProps extends React.ComponentProps<"div"> {
  onBack?: () => void;
}

export function FirstPasswordForm({
  className,
  onBack,
  ...props
}: FirstPasswordFormProps) {
  const [step, setStep] = useState<FirstPasswordStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Kérlek add meg az email címed!');
      return;
    }

    // Validate email format
    if (!email.includes('@') || email.split('@').length !== 2) {
      toast.error('Kérlek adj meg egy érvényes email címet!');
      return;
    }

    // Extract username from email (part before @)
    const username = email.split('@')[0];
    
    if (!username.trim()) {
      toast.error('Az email cím nem tartalmazhat üres felhasználónevet!');
      return;
    }

    setIsLoading(true);
    
    try {
      await apiClient.forgotPassword({ username: username.trim() });
      toast.success('OTP kód elküldve az email címére!');
      setStep('otp');
    } catch (error) {
      console.error('First password setup error:', error);
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

    // Extract username from email
    const username = email.split('@')[0];

    setIsLoading(true);
    
    try {
      const data = await apiClient.checkOTP({ 
        username: username.trim(), 
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

    // Extract username from email
    const username = email.split('@')[0];

    setIsLoading(true);
    
    try {
      await apiClient.changePasswordOTP({ 
        username: username.trim(), 
        reset_token: resetToken,
        new_password: newPassword 
      });
      toast.success('Első jelszó sikeresen beállítva!');
      setStep('success');
    } catch (error) {
      console.error('Password setup error:', error);
      const errorMessage = (error as Error & { detail?: string })?.detail || 'Hiba történt a jelszó beállítása során.';
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
          <UserPlus className="h-12 w-12 text-muted-foreground mb-2" />
          <h1 className="text-2xl font-bold">Első jelszó beállítása</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Add meg az email címed és küldünk egy OTP kódot az első jelszavad beállításához
          </p>
        </div>
        
        <Field>
          <Label htmlFor="email">Email cím</Label>
          <Input
            id="email"
            type="email"
            placeholder="pelda@iskola.hu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="email"
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
          <h1 className="text-2xl font-bold">Első jelszó beállítása</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Add meg az első jelszavad
          </p>
        </div>
        
        <Field>
          <Label htmlFor="newPassword">Jelszó</Label>
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
            <>Beállítás...</>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Jelszó beállítása
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
        <h1 className="text-2xl font-bold">Jelszó beállítva!</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Az első jelszavad sikeresen beállítottad. Most már bejelentkezhetsz az új jelszavaddal.
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