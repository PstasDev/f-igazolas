"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, BarChart3 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { format } from "date-fns"
import { hu } from "date-fns/locale"

interface Student {
  id: number
  name: string
  last_login: string | null
  login_count: number
}

interface ClassStats {
  class_id: number
  class_name: string
  total: number
  logged_in: number
  never_logged_in: number
  students: Student[]
}

interface LoginStats {
  summary: {
    total: number
    logged_in: number
    never_logged_in: number
  }
  per_class: ClassStats[]
}

export function LoginStatistics() {
  const [stats, setStats] = useState<LoginStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedClass, setExpandedClass] = useState<number | null>(null)

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getStudentLoginStats()
      setStats(response)
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string }
      setError(error.detail || error.message || "Hiba a statisztikák betöltése közben")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!stats) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Nincs adat</AlertDescription>
      </Alert>
    )
  }

  const loggedInPercentage = stats.summary.total > 0
    ? Math.round((stats.summary.logged_in / stats.summary.total) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Bejelentkezési statisztikák
          </CardTitle>
          <CardDescription>
            Diákok bejelentkezési aktivitásának áttekintése
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Összes diák</p>
              <p className="text-3xl font-bold">{stats.summary.total}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Bejelentkezett</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.summary.logged_in}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{loggedInPercentage}%</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Még soha nem jelentkezett be</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.summary.never_logged_in}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {stats.summary.total > 0
                  ? Math.round((stats.summary.never_logged_in / stats.summary.total) * 100)
                  : 0}%
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Bejelentkezési arány</span>
              <span className="font-medium">{loggedInPercentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 dark:bg-green-400 transition-all"
                style={{ width: `${loggedInPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Class Statistics */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Osztályonkénti bontás</h3>

        {stats.per_class.map((classStats) => (
          <Card key={classStats.class_id}>
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() =>
                setExpandedClass(expandedClass === classStats.class_id ? null : classStats.class_id)
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{classStats.class_name}</CardTitle>
                  <CardDescription>
                    {classStats.logged_in} / {classStats.total} bejelentkezett
                  </CardDescription>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-gray-600 dark:text-gray-400">Bejelentkezett</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{classStats.logged_in}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 dark:text-gray-400">Nem bejelentkezett</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{classStats.never_logged_in}</p>
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Expanded Student List */}
            {expandedClass === classStats.class_id && (
              <CardContent className="space-y-2">
                {classStats.students.length > 0 ? (
                  <div className="space-y-2">
                    {/* Never logged in students first */}
                    {classStats.students
                      .filter((s) => !s.last_login)
                      .map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{student.name}</p>
                            <p className="text-xs text-red-600 dark:text-red-400">Még soha nem jelentkezett be</p>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">ID: {student.id}</span>
                        </div>
                      ))}

                    {/* Logged in students */}
                    {classStats.students
                      .filter((s) => s.last_login)
                      .map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{student.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {student.last_login && (
                                <>
                                  Utolsó bejelentkezés:{" "}
                                  {format(new Date(student.last_login), "yyyy. MMM d., H:mm", {
                                    locale: hu,
                                  })}
                                </>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Bejelentkezések</p>
                            <p className="text-sm font-bold text-green-600 dark:text-green-400">{student.login_count}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-600 dark:text-gray-400 py-4">Nincs diák ebben az osztályban</p>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Refresh Button */}
      <Button onClick={() => void loadStats()} disabled={loading} className="w-full">
        {loading && <Spinner className="mr-2 h-4 w-4" />}
        Frissítés
      </Button>
    </div>
  )
}
