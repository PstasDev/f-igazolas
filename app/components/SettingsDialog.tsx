"use client"

import * as React from "react"
import {
  User,
  Paintbrush,
  FileText,
  FlaskConical,
  Settings,
  Moon,
  Sun,
  BadgeCheck,
  Mail,
  School,
  UserCircle,
  Check,
  X,
  Clapperboard,
  Info,
  Code2,
  GitBranch,
  GitCommit,
  Calendar,
  Network,
  Database,
  ExternalLink,
  Cog,
  FileHeart,
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  ItemActions,
} from "@/components/ui/item"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "../context/ThemeContext"
import { useRole } from "../context/RoleContext"
import { useHeadingFont } from "../context/HeadingFontContext"
import { useExperimentalFeatures } from "../context/ExperimentalFeaturesContext"
import { apiClient } from "@/lib/api"
import type { IgazolasTipus, Osztaly } from "@/lib/types"
import { getIgazolasType } from "@/app/dashboard/types"
import { toast } from "sonner"
import BKKLogo from "@/components/icons/BKKLogo"

type PageId = "account" | "appearance" | "verification-types" | "experimental" | "info"

interface NavItem {
  id: PageId
  name: string
  icon: React.ComponentType<{ className?: string }>
  teacherOnly?: boolean
  group?: string
}

const navItems: NavItem[] = [
  { id: "account", name: "Fiók", icon: User },
  { id: "appearance", name: "Kinézet", icon: Paintbrush },
  { id: "verification-types", name: "Igazolástípusok", icon: FileText, teacherOnly: true, group: "Osztályom" },
  { id: "experimental", name: "Kísérleti", icon: FlaskConical },
  { id: "info", name: "Információ", icon: Info },
]

const your_admins = [
                  { name: "Molnár Attila", representing: "Intézményi Adminisztrátor", email: "molnar.attila@szlgbp.hu" },
                  { name: "Balla Botond", representing: "Rendszerüzemeltetés és fejlesztés", email: "balla.botond.23f@szlgbp.hu" }
                ]

export function SettingsDialog() {
  const [open, setOpen] = React.useState(false)
  const [activePage, setActivePage] = React.useState<PageId>("account")
  const { theme, toggleTheme } = useTheme()
  const { headingFont, setHeadingFont } = useHeadingFont()
  const { user } = useRole()
  const { ekretaMulasztasokEnabled, setEkretaMulasztasokEnabled } = useExperimentalFeatures()
  const [igazolasTipusok, setIgazolasTipusok] = React.useState<IgazolasTipus[]>([])
  const [myClass, setMyClass] = React.useState<Osztaly | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [togglingTipus, setTogglingTipus] = React.useState<number | null>(null)
  
  const isTeacher = user?.role === 'teacher'

  // Fetch igazolástípusok when dialog opens and verification-types page is active
  React.useEffect(() => {
    if (open && activePage === 'verification-types' && isTeacher) {
      setLoading(true)
      Promise.all([
        apiClient.listIgazolasTipus(),
        apiClient.getMyProfile()
      ])
        .then(([tipusok, profile]) => {
          setIgazolasTipusok(tipusok)
          
          // Get the teacher's class information
          if (profile.osztalyom) {
            return apiClient.getOsztaly(profile.osztalyom.id)
          }
          return null
        })
        .then((osztaly) => {
          if (osztaly) {
            setMyClass(osztaly)
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open, activePage, isTeacher])

  const handleToggleIgazolasTipus = async (tipusId: number, currentlyEnabled: boolean) => {
    if (!myClass) {
      toast.error('Nem található osztály')
      return
    }

    setTogglingTipus(tipusId)
    
    try {
      const result = await apiClient.toggleIgazolasTipus({
        tipus_id: tipusId,
        enabled: !currentlyEnabled, // Toggle the current state
      })
      
      toast.success(result.message)
      
      // Refresh the class data to get updated nem_fogadott_igazolas_tipusok
      const updatedClass = await apiClient.getOsztaly(myClass.id)
      setMyClass(updatedClass)
    } catch (error) {
      console.error('Failed to toggle igazolás tipus:', error)
      
      let errorMessage = 'Hiba történt a típus módosításakor'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setTogglingTipus(null)
    }
  }

  const filteredNavItems = navItems.filter(item => !item.teacherOnly || isTeacher)

  // Group nav items by their group property
  const groupedNavItems = React.useMemo(() => {
    const groups: Record<string, NavItem[]> = {
      main: [],
    }
    
    filteredNavItems.forEach(item => {
      const groupName = item.group || 'main'
      if (!groups[groupName]) {
        groups[groupName] = []
      }
      groups[groupName].push(item)
    })
    
    return groups
  }, [filteredNavItems])

  const renderPageContent = () => {
    switch (activePage) {
      case "account":
        return (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <h2 className="text-lg font-semibold">Profil adatok</h2>
            <ItemGroup className="gap-2">
              <Item variant="outline">
                <ItemMedia>
                  <UserCircle className="h-5 w-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Név</ItemTitle>
                  <ItemDescription>{user?.name || "Felhasználó"}{user?.username ? ` (@${user?.username})` : ""}</ItemDescription>
                </ItemContent>
              </Item>
              <Item variant="outline">
                <ItemMedia>
                  <Mail className="h-5 w-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Email cím</ItemTitle>
                  <span className="text-muted-foreground">{user?.email || "Nincs megadva"}</span>
                  <span className="inline-flex text-green-500 dark:text-green-400 gap-2 items-center"><BadgeCheck className="size-4"/> E-mail cím megerősítve</span>
                </ItemContent>
              </Item>
              <Item variant="outline">
                <ItemMedia>
                  <School className="h-5 w-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Intézmény</ItemTitle>
                  <ItemDescription>Kőbányai Szent László Gimnázium, Budapest X.</ItemDescription>
                </ItemContent>
              </Item>
            </ItemGroup>
          </div>
        )
      
      case "appearance":
        return (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <FieldGroup>
              <FieldSet>
                <FieldLabel htmlFor="theme-selector">
                  Téma
                </FieldLabel>
                <FieldDescription>
                  Válaszd ki az alkalmazás témáját. A beállítás automatikusan szinkronizálódik a szerverrel.
                </FieldDescription>
                <RadioGroup 
                  value={theme} 
                  onValueChange={(value: string) => {
                    if (value !== theme) {
                      toggleTheme()
                    }
                  }}
                >
                  <FieldLabel className="cursor-pointer" htmlFor="light-theme">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          <FieldTitle>Világos</FieldTitle>
                        </div>
                        <FieldDescription>
                          Világos téma használata az alkalmazásban.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="light" id="light-theme" />
                    </Field>
                  </FieldLabel>
                  <FieldLabel className="cursor-pointer" htmlFor="dark-theme">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          <FieldTitle>Sötét</FieldTitle>
                        </div>
                        <FieldDescription>
                          Sötét téma használata az alkalmazásban.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="dark" id="dark-theme" />
                    </Field>
                  </FieldLabel>
                </RadioGroup>
              </FieldSet>

              <FieldSet>
                <FieldLabel htmlFor="heading-font-selector">
                  Címsor betűtípus
                </FieldLabel>
                <FieldDescription>
                  Válaszd ki a címsorok (h1, h2, stb.) betűtípusát.
                </FieldDescription>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHeadingFont('serif')}
                    className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${
                      headingFont === 'serif'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    }`}
                  >
                    <span 
                      className="text-4xl mb-2 font-serif"
                      style={{ fontFamily: 'var(--font-playfair), serif' }}
                    >
                      Aa
                    </span>
                    <span className="text-sm font-medium">Serif</span>
                    <span className="text-xs text-muted-foreground">Playfair Display</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setHeadingFont('sans-serif')}
                    className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${
                      headingFont === 'sans-serif'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    }`}
                  >
                    <span 
                      className="text-4xl mb-2 font-sans"
                      style={{ fontFamily: 'var(--font-noto-sans), sans-serif' }}
                    >
                      Aa
                    </span>
                    <span className="text-sm font-medium">Sans-serif</span>
                    <span className="text-xs text-muted-foreground">Noto Sans</span>
                  </button>
                </div>
              </FieldSet>
            </FieldGroup>
          </div>
        )
      
      case "verification-types":
        return (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div>
              <h2 className="text-lg font-semibold">Igazolástípusok kezelése</h2>
              <p className="text-sm text-muted-foreground">
                Engedélyezd vagy tiltsd le az egyes igazolástípusokat az osztályod számára.
              </p>
              {myClass && (
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-2">
                  Osztály: {myClass.nev}
                </p>
              )}
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">Betöltés...</p>
              </div>
            ) : !myClass ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Nem található osztály.</p>
                  <p className="text-xs text-muted-foreground">
                    Ez a funkció csak osztályfőnökök számára érhető el.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {igazolasTipusok.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Nincsenek elérhető igazolástípusok
                  </div>
                ) : (
                  igazolasTipusok.map((tipus) => {
                    const typeConfig = getIgazolasType(tipus.nev)
                    const isDisabled = myClass.nem_fogadott_igazolas_tipusok?.some(t => t.id === tipus.id) || false
                    const isEnabled = !isDisabled
                    const isToggling = togglingTipus === tipus.id
                    
                    return (
                      <div 
                        key={tipus.id}
                        className={`p-4 rounded-lg border transition-all ${
                          isEnabled 
                            ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{typeConfig.emoji}</span>
                              <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${typeConfig.color}`}>
                                {tipus.nev}
                              </span>
                              {isEnabled ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                  <Check className="h-3 w-3" />
                                  Engedélyezve
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <X className="h-3 w-3" />
                                  Tiltva
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {typeConfig.description}
                            </p>
                            <div className="flex gap-3 text-xs">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                      {tipus.beleszamit ? (
                                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                      ) : (
                                        <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                                      )}
                                      <span className="text-muted-foreground">Beleszámít</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="dark:bg-gray-900 dark:text-white max-w-xs">
                                    <p>Ha igaz, akkor ez az igazolástípus beleszámít a hivatalos mulasztások számába.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                      {tipus.iskolaerdeku ? (
                                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                      ) : (
                                        <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                                      )}
                                      <span className="text-muted-foreground">Iskolaérdekű</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="dark:bg-gray-900 dark:text-white max-w-xs">
                                    <p>Ha igaz, akkor az ilyen típusú igazolás elutasításakor megerősítést kér a rendszer.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={isEnabled}
                              disabled={isToggling}
                              onCheckedChange={() => handleToggleIgazolasTipus(tipus.id, isEnabled)}
                              aria-label={`Toggle ${tipus.nev}`}
                            />
                          </div>
                        </div>
                        
                        {!isEnabled && (
                          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
                            ⚠️ Az osztályod diákjai nem fogják látni ezt a típust az igazolás beküldő űrlapon.
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      
      case "experimental":
        return (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <h2 className="text-lg font-semibold">Kísérleti funkciók</h2>
            <ItemGroup className="gap-4">
              <Item variant="outline" className="bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800">
                <ItemContent>
                  <ItemMedia className="mb-2">
                    <BKKLogo />
                  </ItemMedia>
                  <ItemTitle>BKK Élő Forgalmi Zavar Információk</ItemTitle>
                  <ItemDescription>
                    Integráció a BKK élő forgalmi zavar információival az alkalmazásban.
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch checked={true} disabled />
                </ItemActions>
              </Item>

              <Item variant="outline" className="bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800">
                <ItemContent>
                  <ItemMedia className="mb-2">
                    <BKKLogo />
                  </ItemMedia>
                  <ItemTitle>BKK Élő Jármű Menetmódosítási Információk</ItemTitle>
                  <ItemDescription>
                    Integráció a BKK élő jármű menetmódosítási információival az alkalmazásban.
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch checked={true} disabled />
                </ItemActions>
              </Item>

              <Item variant="outline" className="bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800">
                <ItemContent>
                  <ItemMedia className="mb-2">
                    <div className="inline-flex items-center gap-1">
                      <Clapperboard className="text-blue-500 drop-shadow-md shadow-blue-500 size-5" />
                      <span className="text-blue-500 font-semibold">FTV</span><span className="text-blue-500 font-light">Sync </span></div>
                  </ItemMedia>
                  <ItemTitle>Forgatásszervezési adatok közvetlen integrációja</ItemTitle>
                  <ItemDescription>
                    Az FTV - Forgatásszervező Platform adatainak közvetlen integrációja az alkalmazásban.
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch checked={true} disabled />
                </ItemActions>
              </Item>

              {!isTeacher && (
                <Item variant="outline" className="bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800">
                  <ItemContent>
                    <ItemMedia className="mb-2">
                      <div className="inline-flex items-center gap-1">
                        <FlaskConical className="text-teal-500 drop-shadow-md shadow-teal-500 size-5" />
                        <img 
                          src="https://75a37cbe8a.clvaw-cdnwnd.com/8058bbc8c881bdb6799fafe8ef3094b7/200002106-716d2716d4/kr%C3%A9ta4.jpg?ph=75a37cbe8a" 
                          alt="eKréta" 
                          className="w-5 h-5 rounded object-cover"
                        />
                      </div>
                    </ItemMedia>
                    <ItemTitle>Mulasztások Importálása eKréta ellenőrzőből</ItemTitle>
                    <ItemDescription>
                      Töltsd fel az eKrétából exportált mulasztásaidat XLSX formátumban, és hasonlítsd össze a benyújtott igazolásaiddal.
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Switch 
                      checked={ekretaMulasztasokEnabled} 
                      onCheckedChange={async (checked) => {
                        try {
                          await setEkretaMulasztasokEnabled(checked);
                          toast.success(checked ? 'Mulasztások funkció bekapcsolva' : 'Mulasztások funkció kikapcsolva');
                        } catch (error) {
                          console.error('Failed to toggle eKréta mulasztások:', error);
                          toast.error('Nem sikerült megváltoztatni a beállítást');
                        }
                      }}
                    />
                  </ItemActions>
                </Item>
              )}

            </ItemGroup>
          </div>
        )
      
      case "info":
        return (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div>
              <h2 className="text-lg font-semibold">Információ</h2>
            </div>
            
            <ItemGroup className="gap-3">
              {/* Credits Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Készítette
                </h3>
                <Item variant="outline" className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <ItemMedia>
                    <FileHeart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="text-blue-900 dark:text-blue-100">Balla Botond</ItemTitle>
                    <ItemDescription className="space-y-1">
                      <div className="flex items-center gap-2">
                        <School className="h-3 w-3" />
                        <span>23F osztály</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <a 
                          href="mailto:balla.botond.23f@szlgbp.hu" 
                          className="hover:underline text-blue-600 dark:text-blue-400"
                        >
                          balla.botond.23f@szlgbp.hu
                        </a>
                      </div>
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </div>
              
                <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Az Ön Adminisztrátora{your_admins.length > 1 ? "i" : ""}:
                </h3>

                {your_admins.map((admin) => (
                  <Item key={admin.email} variant="outline" className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                  <ItemMedia>
                    <Cog className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="text-red-900 dark:text-red-100">{admin.name}</ItemTitle>
                    <ItemDescription className="space-y-1">
                    <div className="flex items-center gap-2">
                      <School className="h-3 w-3" />
                      <span>{admin.representing}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <a href={`mailto:${admin.email}`} className="hover:underline text-red-600 dark:text-red-400">
                      {admin.email}
                      </a>
                    </div>
                    </ItemDescription>
                  </ItemContent>
                  </Item>
                ))}
                </div>

              {/* Version Info Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Verzió információk
                </h3>
                <Item variant="outline">
                  <ItemMedia>
                    <Code2 className="h-5 w-5" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>Alkalmazás verzió</ItemTitle>
                    <ItemDescription>
                      <span className="font-mono text-xs">v{process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'}</span>
                    </ItemDescription>
                  </ItemContent>
                </Item>

                {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA && (
                  <Item variant="outline">
                    <ItemMedia>
                      <GitCommit className="h-5 w-5" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>Commit SHA</ItemTitle>
                      <ItemDescription>
                        <span className="font-mono text-xs">
                          {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 7)}
                        </span>
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                )}

                {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF && (
                  <Item variant="outline">
                    <ItemMedia>
                      <GitBranch className="h-5 w-5" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>Git Branch</ItemTitle>
                      <ItemDescription>
                        <span className="font-mono text-xs">
                          {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF}
                        </span>
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                )}

                {process.env.NEXT_PUBLIC_VERCEL_ENV && (
                  <Item variant="outline">
                    <ItemMedia>
                      <Settings className="h-5 w-5" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>Környezet</ItemTitle>
                      <ItemDescription>
                        <span className="font-mono text-xs capitalize">
                          {process.env.NEXT_PUBLIC_VERCEL_ENV}
                        </span>
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                )}

                <Item variant="outline">
                  <ItemMedia>
                    <Calendar className="h-5 w-5" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>Build idő</ItemTitle>
                    <ItemDescription>
                      <span className="text-xs">
                        {new Date().toLocaleString('hu-HU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </div>

              {/* Framework Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Frontend technológiák
                </h3>
                <Item variant="outline">
                  <ItemContent>
                    <ItemDescription className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Next.js</span>
                        <span className="font-mono">15.5.6</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">React</span>
                        <span className="font-mono">19.1.0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">TypeScript</span>
                        <span className="font-mono">5.x</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tailwind CSS</span>
                        <span className="font-mono">4.x</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Framer Motion</span>
                        <span className="font-mono">12.x</span>
                      </div>
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </div>

              {/* Backend Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Backend technológiák
                </h3>
                <Item variant="outline">
                  <ItemContent>
                    <ItemDescription className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Django</span>
                        <span className="font-mono">5.2.7</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Django Ninja</span>
                        <span className="font-mono">1.4.5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pydantic</span>
                        <span className="font-mono">2.12.3</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">PyJWT</span>
                        <span className="font-mono">2.10.1</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Python</span>
                        <span className="font-mono">3.x</span>
                      </div>
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </div>

              {/* Operating Principle */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Működési elv
                </h3>
                <Item variant="outline" className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                  <ItemMedia>
                    <Network className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="text-purple-900 dark:text-purple-100">Rendszerarchitektúra diagram</ItemTitle>
                    <ItemDescription>
                      <a 
                        href="https://excalidraw.com/#json=EcRoDuCSLh5-0e_LFzdNH,Qz3E_PgJsk0pIPZP9yy9_Q"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline text-xs"
                      >
                        Megnyitás Excalidraw-ban
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </div>

              {/* Data Sources */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Adatforrások
                </h3>
                <Item variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
                  <ItemMedia>
                    <BKKLogo />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="text-emerald-900 dark:text-emerald-100">BKK Élő adatok</ItemTitle>
                    <ItemDescription className="space-y-2">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <Database className="h-3 w-3" />
                          <span className="font-semibold">GTFS & GTFS-RT</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Database className="h-3 w-3" />
                          <span className="font-semibold">Futár API v1</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-2">
                          RealCity verzió: 1.0.0-244104.gecea8b8-SNAPSHOT
                        </div>
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                        Adatok forrása: BKK Zrt., CC BY 4.0
                      </div>
                    </ItemDescription>
                  </ItemContent>
                </Item>

                <Item variant="outline" className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <ItemMedia>
                    <div className="inline-flex items-center gap-1">
                      <Clapperboard className="text-blue-500 drop-shadow-md shadow-blue-500 size-5" />
                    </div>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="text-blue-900 dark:text-blue-100">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-semibold">FTV</span>
                        <span className="font-light">Sync</span>
                      </span>
                    </ItemTitle>
                    <ItemDescription className="space-y-2">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <Database className="h-3 w-3" />
                          <span className="font-semibold">Forgatásszervező Platform API</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-2">
                          Valós idejű forgatási adatok szinkronizálása
                        </div>
                      </div>
                      <div className="text-[10px] text-blue-700 dark:text-blue-300 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                        Adatok forrása: FTV - Forgatásszervező Platform
                      </div>
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </div>
            </ItemGroup>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Beállítások</DialogTitle>
        <DialogDescription className="sr-only">
          Itt tudod testreszabni a beállításokat.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              {/* Main group without label */}
              {groupedNavItems.main && groupedNavItems.main.length > 0 && (
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {groupedNavItems.main.map((item) => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            isActive={activePage === item.id}
                            onClick={() => setActivePage(item.id)}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
              
              {/* Other groups with labels */}
              {Object.entries(groupedNavItems)
                .filter(([groupName]) => groupName !== 'main')
                .map(([groupName, items]) => (
                  <SidebarGroup key={groupName}>
                    <SidebarGroupLabel>{groupName}</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {items.map((item) => (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              isActive={activePage === item.id}
                              onClick={() => setActivePage(item.id)}
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                ))}
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4 w-full">
                {/* Mobile dropdown selector */}
                <div className="md:hidden w-full">
                  <Select value={activePage} onValueChange={(value) => setActivePage(value as PageId)}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {filteredNavItems.find(item => item.id === activePage)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {/* Main group without label */}
                      {groupedNavItems.main && groupedNavItems.main.length > 0 && (
                        <SelectGroup>
                          {groupedNavItems.main.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              <div className="flex items-center gap-2">
                                <item.icon className="h-4 w-4" />
                                <span>{item.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      
                      {/* Other groups with labels */}
                      {Object.entries(groupedNavItems)
                        .filter(([groupName]) => groupName !== 'main')
                        .map(([groupName, items]) => (
                          <SelectGroup key={groupName}>
                            <SelectLabel>{groupName}</SelectLabel>
                            {items.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                <div className="flex items-center gap-2">
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Desktop breadcrumb */}
                <Breadcrumb className="hidden md:block">
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink>Beállítások</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {filteredNavItems.find(item => item.id === activePage)?.name}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col overflow-y-auto">
              {renderPageContent()}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
