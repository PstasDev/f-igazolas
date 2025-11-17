"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { AlertCircle, Users, Clock, CheckCircle, XCircle } from "lucide-react"
import { apiClient } from "@/lib/api"

interface TeacherWorkload {
  id: number
  name: string
  classes: string[]
  total_students: number
  pending_count: number
  approved_today: number
  rejected_today: number
  avg_response_time_hours: number | null
}

export function TeacherWorkloadDashboard() {
  const [workloads, setWorkloads] = useState<TeacherWorkload[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'pending' | 'students' | 'name'>('pending')

  const loadWorkloads = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getTeacherWorkload()
      setWorkloads(response.teachers)
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string }
      setError(error.detail || error.message || "Hiba a munkaterhelés betöltése közben")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadWorkloads()
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

  // Sort workloads
  const sortedWorkloads = [...workloads].sort((a, b) => {
    if (sortBy === 'pending') return b.pending_count - a.pending_count
    if (sortBy === 'students') return b.total_students - a.total_students
    return a.name.localeCompare(b.name, 'hu')
  })

  // Calculate totals
  const totalPending = workloads.reduce((sum, w) => sum + w.pending_count, 0)
  const totalApprovedToday = workloads.reduce((sum, w) => sum + w.approved_today, 0)
  const totalRejectedToday = workloads.reduce((sum, w) => sum + w.rejected_today, 0)

  const getPendingColor = (pending: number, total: number) => {
    const ratio = total > 0 ? pending / total : 0
    if (ratio > 0.3) return 'text-red-500'
    if (ratio > 0.1) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tanári munkaterhelés
              </CardTitle>
              <CardDescription>
                Tanárok teljesítménye és függőben lévő feladatok
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadWorkloads} variant="outline" size="sm">
                Frissítés
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tanárok</span>
                </div>
                <p className="text-2xl font-bold mt-1">{workloads.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Függőben</span>
                </div>
                <p className="text-2xl font-bold mt-1">{totalPending}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Ma elfogadva</span>
                </div>
                <p className="text-2xl font-bold mt-1">{totalApprovedToday}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Ma elutasítva</span>
                </div>
                <p className="text-2xl font-bold mt-1">{totalRejectedToday}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sort Controls */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={sortBy === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('pending')}
            >
              Rendezés függőben levők szerint
            </Button>
            <Button
              variant={sortBy === 'students' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('students')}
            >
              Rendezés diákok szerint
            </Button>
            <Button
              variant={sortBy === 'name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('name')}
            >
              Rendezés név szerint
            </Button>
          </div>

          {/* Teacher List */}
          <div className="space-y-3">
            {sortedWorkloads.map((teacher) => {
              const pendingRatio = teacher.total_students > 0 
                ? (teacher.pending_count / teacher.total_students) * 100 
                : 0

              return (
                <div key={teacher.id} className="border rounded-lg p-4 hover:bg-accent/50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{teacher.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {teacher.total_students} diák
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {teacher.classes.map((className) => (
                          <Badge key={className} variant="outline" className="text-xs">
                            {className}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className={`h-3 w-3 ${getPendingColor(teacher.pending_count, teacher.total_students)}`} />
                          <span className={getPendingColor(teacher.pending_count, teacher.total_students)}>
                            {teacher.pending_count} függőben
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{teacher.approved_today} ma elfogadva</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span>{teacher.rejected_today} ma elutasítva</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-2xl font-bold ${getPendingColor(teacher.pending_count, teacher.total_students)}`}>
                        {teacher.pending_count}
                      </span>
                      <Progress value={pendingRatio} className="w-20 h-2" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {workloads.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">
              Nincs tanár adat
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
