"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, Check, Copy, Eye, EyeOff } from "lucide-react"
import { apiClient } from "@/lib/api"
import { AdminUserSelector } from "./AdminUserSelector"
import type { Profile } from "@/lib/types"

interface PasswordManagementProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function PasswordManagement({ isOpen, onOpenChange }: PasswordManagementProps) {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [mode, setMode] = useState<"generate" | "reset">("generate")
  const [sendEmail, setSendEmail] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const validatePassword = (password: string): string | null => {
    if (password.length < 12) {
      return "A jelszónak legalább 12 karakter hosszúnak kell lennie"
    }
    if (!/[A-Z]/.test(password)) {
      return "A jelszónak tartalmaznia kell nagybetűt"
    }
    if (!/[a-z]/.test(password)) {
      return "A jelszónak tartalmaznia kell kisbetűt"
    }
    if (!/[0-9]/.test(password)) {
      return "A jelszónak tartalmaznia kell számot"
    }
    if (!/[!@#$%^&*()_\-=+\[\]{}|;:,.<>?]/.test(password)) {
      return "A jelszónak tartalmaznia kell speciális karaktert"
    }
    return null
  }

  const handleGenerate = async () => {
    if (!selectedUser) {
      setError("Felhasználó szükséges")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      setGeneratedPassword(null)

      const response = await apiClient.generatePassword(selectedUser.user.id, sendEmail)

      if (response.password) {
        setGeneratedPassword(response.password)
        setSuccess("Jelszó sikeresen generálva")
      } else {
        setSuccess(response.message || "Jelszó generálva és elküldve")
      }
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string }
      setError(error.detail || error.message || "Hiba a jelszó generálása közben")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!selectedUser) {
      setError("Felhasználó szükséges")
      return
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (newPassword !== newPasswordConfirm) {
      setError("A jelszavak nem egyeznek")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      await apiClient.resetPassword(selectedUser.user.id, newPassword, sendEmail)

      setSuccess("Jelszó sikeresen visszaállítva")
      setNewPassword("")
      setNewPasswordConfirm("")
      setShowPassword(false)
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string }
      setError(error.detail || error.message || "Hiba a jelszó visszaállítása közben")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setMode("generate")
    setSelectedUser(null)
    setSendEmail(false)
    setGeneratedPassword(null)
    setNewPassword("")
    setNewPasswordConfirm("")
    setShowPassword(false)
    setError(null)
    setSuccess(null)
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Jelszó kezelés</DialogTitle>
          <DialogDescription>
            Válassz felhasználót a jelszó módosításához
          </DialogDescription>
        </DialogHeader>

        {/* User Selector */}
        <div className="space-y-4">
          <AdminUserSelector
            label="Felhasználó"
            placeholder="Keress felhasználó neve szerint..."
            selectedUser={selectedUser}
            onUserSelect={setSelectedUser}
            disabled={loading}
          />

          {/* Mode Selector */}
          <div className="flex gap-2">
            <Button
              variant={mode === "generate" ? "default" : "outline"}
              onClick={() => setMode("generate")}
              disabled={loading || !selectedUser}
              className="flex-1"
            >
              Generálás
            </Button>
            <Button
              variant={mode === "reset" ? "default" : "outline"}
              onClick={() => setMode("reset")}
              disabled={loading || !selectedUser}
              className="flex-1"
            >
              Visszaállítás
            </Button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Generate Mode */}
          {mode === "generate" && (
            <div className="space-y-4">
              {generatedPassword && (
                <div className="space-y-2">
                  <Label>Generált jelszó (csak ezután látható)</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={generatedPassword}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md font-mono text-sm bg-gray-50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Másolatra lett az a jelszó. A felhasználónak el kell küldenie!
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="send-email-generate"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4"
                />
                <Label htmlFor="send-email-generate" className="font-normal cursor-pointer">
                  Jelszó küldése e-mailben
                </Label>
              </div>

              {!generatedPassword && (
                <p className="text-sm text-gray-600">
                  {sendEmail
                    ? "Az új jelszó elküldésre kerül a felhasználó e-mail címére."
                    : "Az új jelszó megjelenik lent, és csak egyszer lesz látható."}
                </p>
              )}
            </div>
          )}

          {/* Reset Mode */}
          {mode === "reset" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-password">Új jelszó</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Legalább 12 karakter..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-600">
                  Nagybetű, kisbetű, szám és speciális karakter szükséges
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Jelszó megerősítése</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  disabled={loading}
                  placeholder="Ismét az új jelszó..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="send-email-reset"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4"
                />
                <Label htmlFor="send-email-reset" className="font-normal cursor-pointer">
                  Értesítés küldése e-mailben
                </Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Bezárás
          </Button>
          <Button
            onClick={mode === "generate" ? handleGenerate : handleReset}
            disabled={loading}
          >
            {loading && <Spinner className="mr-2 h-4 w-4" />}
            {mode === "generate" ? "Generálás" : "Visszaállítás"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
