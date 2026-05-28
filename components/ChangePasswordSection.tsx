"use client"

import * as React from "react"
import { KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"

export function ChangePasswordSection() {
  const [oldPassword, setOldPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!oldPassword || !newPassword) {
      toast.error("Kérlek töltsd ki az összes mezőt.")
      return
    }
    if (newPassword.length < 8) {
      toast.error("Az új jelszó legalább 8 karakter legyen.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Az új jelszavak nem egyeznek.")
      return
    }
    setSubmitting(true)
    try {
      await apiClient.changePassword({ old_password: oldPassword, new_password: newPassword })
      toast.success("Jelszó sikeresen módosítva.")
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      toast.error("Nem sikerült módosítani a jelszót", {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <div>
        <h2 className="text-lg font-semibold">Jelszó módosítása</h2>
        <p className="text-muted-foreground text-sm">
          Legalább 8 karakteres jelszót adj meg.
        </p>
      </div>
      <div className="space-y-2">
        <div className="grid gap-1.5">
          <Label htmlFor="old-password">Jelenlegi jelszó</Label>
          <Input
            id="old-password"
            type="password"
            autoComplete="current-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="new-password">Új jelszó</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirm-password">Új jelszó újra</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>
      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" /> Módosítás…
          </>
        ) : (
          <>
            <KeyRound className="mr-2 size-4" /> Jelszó módosítása
          </>
        )}
      </Button>
    </form>
  )
}
