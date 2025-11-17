"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { AlertCircle, Check, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { AdminUserSelector } from "./AdminUserSelector"
import type { Profile } from "@/lib/types"

interface Teacher {
  id: number
  username: string
  name: string
  is_superuser: boolean
}

interface TeacherAssignmentProps {
  classId?: number
  className?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function TeacherAssignment({
  classId,
  className,
  isOpen,
  onOpenChange,
}: TeacherAssignmentProps) {
  const [mode, setMode] = useState<"assign" | "manage" | "moveosztalyfonok">("manage")
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<Profile | null>(null)
  const [selectedTargetClass, setSelectedTargetClass] = useState<number | null>(null)
  const [classes, setClasses] = useState<{ id: number; nev: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [teacherToRemove, setTeacherToRemove] = useState<Teacher | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)

  // Load teachers when modal opens
  const loadTeachers = async () => {
    if (!classId) return

    try {
      setFetching(true)
      setError(null)
      const response = await apiClient.getTeachersForClass(classId)
      setTeachers(response.teachers as unknown as Teacher[])
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string }
      setError(error.detail || error.message || "Hiba a tanárok betöltése közben")
    } finally {
      setFetching(false)
    }
  }

  const loadClasses = async () => {
    try {
      const response = await apiClient.listOsztaly()
      setClasses(response.map(c => ({ id: c.id, nev: c.nev })))
    } catch (err: unknown) {
      console.error('Failed to load classes:', err)
    }
  }

  useEffect(() => {
    if (isOpen && classId && mode === "manage") {
      void loadTeachers()
    }
    if (isOpen && mode === "moveosztalyfonok") {
      void loadClasses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, classId, mode])

  const handleAssignTeacher = async () => {
    if (!classId || !selectedTeacher) {
      setError("Osztály és tanár kiválasztása szükséges")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      await apiClient.assignTeacherToClass(classId, selectedTeacher.user.id)

      setSuccess("Tanár sikeresen hozzáadva az osztályhoz")
      setSelectedTeacher(null)
      await loadTeachers()
      setMode("manage")
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string }
      setError(error.detail || error.message || "Hiba a tanár hozzáadása közben")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveTeacher = async () => {
    if (!classId || !teacherToRemove) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      await apiClient.removeTeacherFromClass(classId, teacherToRemove.id)

      setSuccess(`${teacherToRemove.name} eltávolítva az osztályból`)
      setTeacherToRemove(null)
      setShowRemoveDialog(false)
      await loadTeachers()
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string }
      setError(error.detail || error.message || "Hiba a tanár eltávolítása közben")
      setShowRemoveDialog(false)
    } finally {
      setLoading(false)
    }
  }

  const handleMoveOsztalyfonok = async () => {
    if (!selectedTargetClass) {
      setError("Célként megjelölt osztály szükséges")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      await apiClient.moveOsztalyfonokToClass(selectedTargetClass)

      setSuccess("Osztalyfonok teszt felhasználó sikeresen áthelyezve")
      setSelectedTargetClass(null)
      setMode("manage")
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string }
      setError(error.detail || error.message || "Hiba az áthelyezés közben")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setMode("manage")
    setSelectedTeacher(null)
    setSelectedTargetClass(null)
    setError(null)
    setSuccess(null)
    setTeacherToRemove(null)
    setShowRemoveDialog(false)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tanár kezelés</DialogTitle>
            <DialogDescription>
              {className && `Osztály: ${className}`}
            </DialogDescription>
          </DialogHeader>

          {/* Mode Selector */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={mode === "manage" ? "default" : "outline"}
              onClick={() => setMode("manage")}
              disabled={loading || fetching}
              size="sm"
            >
              Kezelés
            </Button>
            <Button
              variant={mode === "assign" ? "default" : "outline"}
              onClick={() => setMode("assign")}
              disabled={loading}
              size="sm"
            >
              Hozzáadás
            </Button>
            <Button
              variant={mode === "moveosztalyfonok" ? "default" : "outline"}
              onClick={() => setMode("moveosztalyfonok")}
              disabled={loading}
              size="sm"
            >
              Osztalyfonok áthelyezés
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

          {/* Manage Mode */}
          {mode === "manage" && (
            <div className="space-y-4">
              {fetching ? (
                <div className="flex justify-center py-8">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : teachers.length > 0 ? (
                <div className="space-y-2">
                  {teachers.map((teacher) => (
                    <Card key={teacher.id}>
                      <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          <p className="text-sm text-gray-600">{teacher.username}</p>
                          {teacher.is_superuser && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                              Szuperfelhasználó
                            </span>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setTeacherToRemove(teacher)
                            setShowRemoveDialog(true)
                          }}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eltávolítás
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-8">Még nincsenek tanárok hozzáadva</p>
              )}
            </div>
          )}

          {/* Assign Mode */}
          {mode === "assign" && (
            <div className="space-y-4">
              <AdminUserSelector
                label="Tanár kiválasztása"
                placeholder="Keress tanár neve szerint..."
                selectedUser={selectedTeacher}
                onUserSelect={setSelectedTeacher}
                disabled={loading}
                showDetails={true}
              />
              {selectedTeacher && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{selectedTeacher.user.first_name} {selectedTeacher.user.last_name}</span>
                      {' '}felhasználónévvel hozzáadódik az{' '}
                      <span className="font-medium">{className}</span> osztályhoz
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Move Osztalyfonok Mode */}
          {mode === "moveosztalyfonok" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-class">Célként megjelölt osztály</Label>
                <select
                  id="target-class"
                  value={selectedTargetClass || ""}
                  onChange={(e) => setSelectedTargetClass(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="">-- Válassz osztályt --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nev}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600">
                  Az osztalyfonok teszt felhasználó az alábbi osztályba kerül át
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Bezárás
            </Button>
            {mode === "assign" && (
              <Button onClick={handleAssignTeacher} disabled={loading}>
                {loading && <Spinner className="mr-2 h-4 w-4" />}
                Hozzáadás
              </Button>
            )}
            {mode === "moveosztalyfonok" && (
              <Button onClick={handleMoveOsztalyfonok} disabled={loading}>
                {loading && <Spinner className="mr-2 h-4 w-4" />}
                Áthelyezés
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Teacher Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Biztosan el szeretnéd távolítani {teacherToRemove?.name}-t az osztályból?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ez a művelet nem visszavonható.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTeacherToRemove(null)}>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveTeacher} disabled={loading}>
              Eltávolítás
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
