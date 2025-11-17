"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { AlertCircle, Check, Shield, ShieldOff } from "lucide-react"
import { apiClient } from "@/lib/api"
import { AdminUserSelector } from "./AdminUserSelector"
import type { Profile } from "@/lib/types"
import { format } from "date-fns"
import { hu } from "date-fns/locale"

interface PermissionChange {
  changed_by: string
  changed_at: string
  action: "promoted" | "demoted"
  previous_value: boolean
  new_value: boolean
}

interface PermissionsManagementProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function PermissionsManagement({
  isOpen,
  onOpenChange,
}: PermissionsManagementProps) {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [isSuperuser, setIsSuperuser] = useState(false)
  const [changeHistory, setChangeHistory] = useState<PermissionChange[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<"promote" | "demote" | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const loadPermissions = async (userId?: number) => {
    const userIdToLoad = userId || selectedUser?.user.id
    if (!userIdToLoad) return

    try {
      setFetching(true)
      setError(null)
      const response = await apiClient.getUserPermissions(userIdToLoad)
      setIsSuperuser(response.is_superuser)
      setChangeHistory(response.change_history || [])
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string }
      setError(error.detail || error.message || "Hiba az engedélyek betöltése közben")
    } finally {
      setFetching(false)
    }
  }

  const handlePromote = async () => {
    if (!selectedUser) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      await apiClient.promoteToSuperuser(selectedUser.user.id)

      setSuccess("Felhasználó sikeresen előléptetett szuperfelhasználóvá")
      setIsSuperuser(true)
      await loadPermissions()
      setShowConfirmDialog(false)
      setConfirmAction(null)
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string }
      setError(error.detail || error.message || "Hiba az előléptetés közben")
      setShowConfirmDialog(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDemote = async () => {
    if (!selectedUser) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      await apiClient.demoteFromSuperuser(selectedUser.user.id)

      setSuccess("Felhasználó sikeresen lefokozva")
      setIsSuperuser(false)
      await loadPermissions()
      setShowConfirmDialog(false)
      setConfirmAction(null)
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string }
      setError(error.detail || error.message || "Hiba a lefokozás közben")
      setShowConfirmDialog(false)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedUser(null)
    setError(null)
    setSuccess(null)
    setConfirmAction(null)
    setShowConfirmDialog(false)
    onOpenChange(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (open && selectedUser && !fetching) {
      void loadPermissions()
    }
    if (!open) {
      handleClose()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
          <DialogTitle>Engedélyek kezelése</DialogTitle>
          <DialogDescription>
            Szuperfelhasználó státusz módosítása
          </DialogDescription>
        </DialogHeader>

        {/* User Selector */}
        <AdminUserSelector
          label="Felhasználó"
          placeholder="Keress felhasználó neve szerint..."
          selectedUser={selectedUser}
          onUserSelect={(user) => {
            setSelectedUser(user)
            setError(null)
            setSuccess(null)
            // Load permissions immediately after user selection
            setTimeout(() => loadPermissions(user.user.id), 0)
          }}
          disabled={loading}
          showDetails={true}
        />

        {selectedUser && (
          <div className="space-y-4">
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

            {/* Current Status */}
            {fetching ? (
              <div className="flex justify-center py-8">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (
              <div className="space-y-4">
              {/* Superuser Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isSuperuser ? (
                      <Shield className="h-5 w-5 text-purple-600" />
                    ) : (
                      <ShieldOff className="h-5 w-5 text-gray-400" />
                    )}
                    Szuperfelhasználó státusz
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">
                      Jelenlegi státusz: <span className={isSuperuser ? "text-purple-600 font-bold" : "text-gray-600"}>
                        {isSuperuser ? "Szuperfelhasználó" : "Normál felhasználó"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {isSuperuser
                        ? "Ez a felhasználó teljes adminisztrátori hozzáféréssel rendelkezik."
                        : "Ez a felhasználó normál engedélyekkel rendelkezik."}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!isSuperuser ? (
                      <Button
                        onClick={() => {
                          setConfirmAction("promote")
                          setShowConfirmDialog(true)
                        }}
                        disabled={loading}
                        className="gap-2"
                      >
                        <Shield className="h-4 w-4" />
                        Előléptetés szuperfelhasználóvá
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setConfirmAction("demote")
                          setShowConfirmDialog(true)
                        }}
                        disabled={loading}
                        className="gap-2"
                      >
                        <ShieldOff className="h-4 w-4" />
                        Lefokozás
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Change History */}
              {changeHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Engedély módosítások története</CardTitle>
                    <CardDescription>
                      {changeHistory.length} módosítás
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {changeHistory.map((change, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {change.action === "promoted" ? "Előléptetés" : "Lefokozás"}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Által: <span className="font-mono">{change.changed_by}</span>
                            </p>
                            <p className="text-xs text-gray-600">
                              {format(new Date(change.changed_at), "yyyy. MMMM d., H:mm", {
                                locale: hu,
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                              {change.previous_value ? "✓" : "✗"}
                            </span>
                            <span className="text-xs text-gray-600">→</span>
                            <span className="text-xs bg-blue-200 px-2 py-1 rounded">
                              {change.new_value ? "✓" : "✗"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Bezárás
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "promote"
                ? "Szuperfelhasználóvá szeretnéd előléptetni ezt a felhasználót?"
                : "Valóban lefokozni szeretnéd ezt a szuperfelhasználót?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "promote"
                ? "Ez a felhasználó teljes adminisztrátori hozzáférést fog kapni."
                : "A felhasználó adminisztrátori jogosultságai eltávolításra kerülnek."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAction(null)}>Mégse</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction === "promote" ? handlePromote : handleDemote}
              disabled={loading}
            >
              {confirmAction === "promote" ? "Előléptetés" : "Lefokozás"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
