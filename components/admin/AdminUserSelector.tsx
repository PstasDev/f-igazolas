"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Check, ChevronsUpDown, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api"
import type { Profile } from "@/lib/types"

interface AdminUserSelectorProps {
  label?: string
  placeholder?: string
  selectedUser?: Profile | null
  onUserSelect: (user: Profile) => void
  filterRole?: "teacher" | "student" | "all"
  disabled?: boolean
  className?: string
  showDetails?: boolean
}

export function AdminUserSelector({
  label = "Felhasználó kiválasztása",
  placeholder = "Keres név szerint...",
  selectedUser,
  onUserSelect,
  filterRole = "all",
  disabled = false,
  className = "",
  showDetails = true,
}: AdminUserSelectorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([])

  // Load users on first open
  useEffect(() => {
    if (open && users.length === 0) {
      loadUsers()
    }
  }, [open])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const profiles = await apiClient.listProfiles()
      
      // Filter based on role if needed
      let filtered = profiles
      if (filterRole === "teacher") {
        // Teachers are profiles with no class (osztalyom is null)
        // or we could check user.is_staff from the backend
        filtered = profiles.filter(p => !p.osztalyom) // Simple heuristic
      } else if (filterRole === "student") {
        // Students have a class
        filtered = profiles.filter(p => p.osztalyom)
      }
      
      setUsers(filtered)
      setFilteredUsers(filtered)
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string }
      setError(error.detail || error.message || "Hiba a felhasználók betöltése közben")
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search term
  useEffect(() => {
    const term = searchTerm.toLowerCase()
    const filtered = users.filter((user) => {
      const fullName = `${user.user.first_name || ""} ${user.user.last_name || ""}`.toLowerCase()
      const username = user.user.username.toLowerCase()
      return fullName.includes(term) || username.includes(term)
    })
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const getDisplayName = (user: Profile): string => {
    const firstName = user.user.first_name || ""
    const lastName = user.user.last_name || ""
    const fullName = `${firstName} ${lastName}`.trim()
    return fullName || user.user.username
  }

  const handleSelect = (user: Profile) => {
    onUserSelect(user)
    setOpen(false)
    setSearchTerm("")
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedUser ? (
              <div className="flex items-center gap-2 flex-1 text-left">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{getDisplayName(selectedUser)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{selectedUser.user.username}
                  </p>
                </div>
                {selectedUser.osztalyom && (
                  <Badge variant="secondary" className="flex-shrink-0 ml-2">
                    {selectedUser.osztalyom.nev}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-3 border-b space-y-2">
            <Input
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3">
              <Alert variant="destructive" className="p-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-6 w-6" />
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="p-2 space-y-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelect(user)}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors ${
                      selectedUser?.id === user.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{getDisplayName(user)}</p>
                        <p className="text-xs text-muted-foreground">
                          @{user.user.username}
                          {user.user.email && ` • ${user.user.email}`}
                        </p>
                        {showDetails && user.osztalyom && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Osztály: {user.osztalyom.nev}
                          </p>
                        )}
                      </div>
                      {selectedUser?.id === user.id && (
                        <Check className="h-4 w-4 shrink-0 text-green-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                {searchTerm ? "Nincs találat" : "Nincs felhasználó"}
              </div>
            )}
          </ScrollArea>

          {!loading && users.length > 0 && (
            <div className="p-2 border-t text-xs text-muted-foreground">
              {filteredUsers.length} / {users.length} felhasználó
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
