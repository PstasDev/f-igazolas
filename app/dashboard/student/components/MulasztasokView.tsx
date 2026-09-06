'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import type { MulasztasAnalysis, MulasztasDetailed, Igazolas } from '@/lib/types';
import { BELL_SCHEDULE, getPeriodSchedule } from '@/lib/periods';
import { getIgazolasType, isMultiDayAbsence, buildCalendarGrid, getDayOfWeekShort } from '@/app/dashboard/types';
import type { IgazolasTableRow } from '@/app/dashboard/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
  Upload,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  Plus,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  User,
  ExternalLink,
  Clapperboard,
  RotateCcw,
  FileText,
  BarChart3,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BKKAlertVerificationCard } from '@/components/ui/BKKAlertVerificationCard';
import { Label as UILabel } from '@/components/ui/label';
import { ChartConfig, ChartContainer, ChartStyle, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Label, Pie, PieChart, Sector, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart, PolarAngleAxis, Radar, RadarChart } from 'recharts';
import { PieSectorDataItem } from 'recharts/types/polar/Pie';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { TOUR_IDS, mulasztasokTourSteps } from '@/lib/onboarding-tours';

type FilterMode = 'all' | 'uncovered' | 'resolved';

export function MulasztasokView() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<MulasztasAnalysis | null>(null);
  // 3-state filter: 'uncovered' shown by default (most actionable for the student)
  const [filterMode, setFilterMode] = useState<FilterMode>('uncovered');
  const [activeTab, setActiveTab] = useState<'table' | 'stats'>('table');
  const [statsFilter, setStatsFilter] = useState<'all' | 'uncovered'>('all');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  
  // Quick create igazolás state
  const [selectedMulasztasok, setSelectedMulasztasok] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Drawer state for showing igazolások
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMulasztas, setDrawerMulasztas] = useState<MulasztasDetailed | null>(null);
  const [drawerIgazolasok, setDrawerIgazolasok] = useState<Igazolas[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedIgazolas, setSelectedIgazolas] = useState<Igazolas | null>(null);

  // Fetch existing mulasztások on mount
  useEffect(() => {
    fetchMulasztasok();
  }, []);

  // Load selection from sessionStorage on mount
  useEffect(() => {
    const savedSelection = sessionStorage.getItem('mulasztasok_selection');
    if (savedSelection) {
      try {
        const ids = JSON.parse(savedSelection) as number[];
        setSelectedMulasztasok(new Set(ids));
        if (ids.length > 0) {
          toast.info(`${ids.length} mulasztás visszatöltve`);
        }
      } catch (e) {
        console.error('Failed to parse saved selection:', e);
      }
    }
  }, []);

  // Save selection to sessionStorage on change
  useEffect(() => {
    if (selectedMulasztasok.size > 0) {
      sessionStorage.setItem('mulasztasok_selection', JSON.stringify(Array.from(selectedMulasztasok)));
    } else {
      sessionStorage.removeItem('mulasztasok_selection');
    }
  }, [selectedMulasztasok]);

  // Keyboard shortcuts for selection (Ctrl/Cmd+A to select all uncovered)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+A to select all uncovered
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && analysis) {
        e.preventDefault();
        const uncovered = analysis.mulasztasok.filter(m => !m.igazolt && !m.is_covered);
        const allUncoveredIds = new Set(uncovered.map(m => m.id));
        setSelectedMulasztasok(allUncoveredIds);
        toast.info(`${uncovered.length} mulasztás kiválasztva`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [analysis]);

  const fetchMulasztasok = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getMyMulasztasok(true); // Always fetch all data
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to fetch mulasztások:', error);
      // Don't show error if no data exists yet
      const apiError = error as { status?: number };
      if (apiError?.status !== 404) {
        toast.error('Nem sikerült betölteni a mulasztásokat');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error('Csak .xlsx vagy .xls fájlokat tölthetsz fel');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const result = await apiClient.uploadEkretaMulasztasok(file);
      toast.success(result.message);
      setAnalysis(result.analysis);
      setUploadErrors(Array.isArray(result.errors) ? result.errors : []);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
      const apiError = error as { detail?: string };
      const errorMessage = apiError?.detail || 'Hiba történt a feltöltés során';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Biztosan törölni szeretnéd az összes feltöltött mulasztást?')) {
      return;
    }

    try {
      const result = await apiClient.deleteMyMulasztasok();
      toast.success(result.message);
      setAnalysis(null);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Nem sikerült törölni a mulasztásokat');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Determine when the mulasztások table was last updated (most recent upload).
  const lastUpdatedAt = useMemo<number | null>(() => {
    if (!analysis || analysis.mulasztasok.length === 0) return null;
    let latest: number | null = null;
    for (const m of analysis.mulasztasok) {
      const t = new Date(m.uploaded_at).getTime();
      if (!isNaN(t) && (latest === null || t > latest)) {
        latest = t;
      }
    }
    return latest;
  }, [analysis]);

  // Number of whole days since the last update (null if never updated).
  const daysSinceLastUpdate = useMemo<number | null>(() => {
    if (lastUpdatedAt === null) return null;
    return Math.floor((Date.now() - lastUpdatedAt) / (1000 * 60 * 60 * 24));
  }, [lastUpdatedAt]);

  // Advise a manual refresh if the data is a few days old or more.
  const isDataStale = daysSinceLastUpdate !== null && daysSinceLastUpdate >= 3;

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Extract minutes from "Késés (X Perc)" format
  const extractMinutesFromTipus = (tipus: string): number => {
    const match = tipus.match(/\((\d+)\s*Perc\)/i);
    return match ? parseInt(match[1]) : 0;
  };

  const getTipusBadge = (tipus: string) => {
    if (tipus === 'Hiányzás' || tipus.startsWith('Hiányzás')) {
      return <Badge variant="destructive">Hiányzás</Badge>;
    }
    const minutes = extractMinutesFromTipus(tipus);
    if (minutes > 0) {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-500">Késés ({minutes} Perc)</Badge>;
    }
    return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-500">Késés</Badge>;
  };

  // Get color-coded icon for tipus (for mobile view)
  const getTipusIcon = (tipus: string) => {
    if (tipus === 'Hiányzás' || tipus.startsWith('Hiányzás')) {
      return <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-red-600 dark:text-red-400" />;
    }
    // Késés
    return <Clock className="w-3 h-3 md:w-4 md:h-4 text-orange-600 dark:text-orange-400" />;
  };

  const fetchIgazolasokForDay = async (mulasztas: MulasztasDetailed) => {
    setDrawerLoading(true);
    setDrawerMulasztas(mulasztas);
    setIsDrawerOpen(true);
    setSelectedIgazolas(null);
    
    try {
      // Fetch all igazolások for the student
      const allIgazolasok = await apiClient.getMyIgazolas();
      
      // Filter igazolások that cover this specific day
      // Normalize dates to compare at day level (ignore time component)
      const mulasztasDateStr = mulasztas.datum; // Format: YYYY-MM-DD
      
      const relevantIgazolasok = allIgazolasok.filter((igazolas: Igazolas) => {
        // Extract date portion from datetime strings
        const igazolasStartDate = igazolas.eleje.split('T')[0]; // Get YYYY-MM-DD part
        const igazolasEndDate = igazolas.vege.split('T')[0]; // Get YYYY-MM-DD part
        
        // Check if the mulasztás date falls within the igazolás date range
        // Simple string comparison works for YYYY-MM-DD format
        return mulasztasDateStr >= igazolasStartDate && mulasztasDateStr <= igazolasEndDate;
      });
      
      setDrawerIgazolasok(relevantIgazolasok);
    } catch (error) {
      console.error('Failed to fetch igazolások:', error);
      toast.error('Nem sikerült betölteni az igazolásokat');
      setDrawerIgazolasok([]);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCoverageBadgeClick = (mulasztas: MulasztasDetailed) => {
    if (mulasztas.is_covered) {
      // Open drawer with igazolások for this day
      fetchIgazolasokForDay(mulasztas);
    }
  };

  const getCoverageBadge = (mulasztas: MulasztasDetailed) => {
    if (mulasztas.igazolt) {
      const ekretaReason = mulasztas.igazolas_tipusa || mulasztas.mulasztas_ok;
      const badge = (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          eKrétában igazolt
          {ekretaReason && (
            <span className="ml-1 hidden sm:inline text-[10px] opacity-80 font-normal">
              ({ekretaReason})
            </span>
          )}
        </Badge>
      );
      if (!ekretaReason) return badge;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{badge}</TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              <p className="font-semibold">Már igazolt eKrétában</p>
              {mulasztas.igazolas_tipusa && (
                <p>Típus: {mulasztas.igazolas_tipusa}</p>
              )}
              {mulasztas.mulasztas_ok && (
                <p>Ok: {mulasztas.mulasztas_ok}</p>
              )}
              {mulasztas.mulasztas_statusz && (
                <p>Státusz: {mulasztas.mulasztas_statusz}</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    if (mulasztas.is_covered) {
      return (
        <Badge 
          className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          onClick={() => handleCoverageBadgeClick(mulasztas)}
          title="Kattints a lefedő igazolás megtekintéséhez"
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Lefedve igazolással
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Nincs lefedve
      </Badge>
    );
  };

  const handleQuickCreateIgazolas = () => {
    if (selectedMulasztasok.size === 0) {
      toast.error('Válassz ki legalább egy mulasztást!');
      return;
    }

    // Get selected mulasztások and calculate time range
    const selected = analysis!.mulasztasok.filter(m => selectedMulasztasok.has(m.id));
    
    // Sort by date and lesson number to ensure correct order
    const sortedSelected = [...selected].sort((a, b) => {
      const dateCompare = a.datum.localeCompare(b.datum);
      if (dateCompare !== 0) return dateCompare;
      return a.ora - b.ora;
    });
    
    // Calculate lesson start and end times using actual bell schedule
    const getTimeForLesson = (date: string, ora: number) => {
      // ora is the lesson number (0-8)
      if (ora < 0 || ora >= BELL_SCHEDULE.length) {
        // Invalid lesson number, fallback to rough estimate
        const startMinutes = 8 * 60 + ora * 45;
        const endMinutes = startMinutes + 45;
        
        const startHour = Math.floor(startMinutes / 60);
        const startMin = startMinutes % 60;
        const endHour = Math.floor(endMinutes / 60);
        const endMin = endMinutes % 60;
        
        const startTime = `${date}T${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}:00`;
        const endTime = `${date}T${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;
        
        return { start: startTime, end: endTime };
      }
      
      const period = BELL_SCHEDULE[ora];
      const startTime = `${date}T${period.start}:00`;
      const endTime = `${date}T${period.end}:00`;
      
      return { start: startTime, end: endTime };
    };

    // Get earliest start (from first lesson) and latest end (from last lesson)
    const firstLesson = sortedSelected[0];
    const lastLesson = sortedSelected[sortedSelected.length - 1];
    
    const earliestTimes = getTimeForLesson(firstLesson.datum, firstLesson.ora);
    const latestTimes = getTimeForLesson(lastLesson.datum, lastLesson.ora);
    
    const earliestStart = earliestTimes.start;
    const latestEnd = latestTimes.end;

    // Check if this spans multiple days
    const isMultiDay = firstLesson.datum !== lastLesson.datum;

    // Prepare covered mulasztasok info
    const coveredInfo = sortedSelected.map(m => ({
      id: m.id,
      datum: m.datum,
      ora: m.ora,
      tantargy: m.tantargy
    }));

    // Store in sessionStorage for the form to pick up
    sessionStorage.setItem('prefill_igazolas', JSON.stringify({
      eleje: earliestStart,
      vege: latestEnd,
      megjegyzes_diak: `Mulasztások lefedése (${sortedSelected.length} óra):\n${sortedSelected.map(m => `📅 ${m.datum} • ${m.ora}. óra • ${m.tantargy}`).join('\n')}`,
      from_mulasztasok: true,
      covered_mulasztasok: coveredInfo,
      is_multi_day: isMultiDay, // Flag to indicate multi-day absence
    }));

    const daysText = isMultiDay ? ` (${sortedSelected.length} óra, több napos)` : ` (${sortedSelected.length} óra)`;
    toast.success(`${sortedSelected.length} mulasztás adatai átadva az űrlapnak${daysText}`, { duration: 3000 });

    // Navigate to new igazolás form
    window.location.hash = 'new';
  };

  const coveragePercentage = analysis 
    ? Math.round(((analysis.covered_by_igazolas + analysis.igazolt_count) / analysis.total_mulasztasok) * 100)
    : 0;

  // Calculate total uncovered késés minutes (danger threshold: 45 minutes)
  const uncoveredKesesMinutes = analysis 
    ? analysis.mulasztasok
        .filter(m => !m.igazolt && !m.is_covered && (m.tipus.startsWith('Késés') || m.tipus === 'Késés'))
        .reduce((total, m) => {
          const minutes = extractMinutesFromTipus(m.tipus);
          // Only count if 0 < minutes < 46
          return (minutes > 0 && minutes < 46) ? total + minutes : total;
        }, 0)
    : 0;

  const isKesesDanger = uncoveredKesesMinutes > 45;

  // Interactive pie chart state
  const pieChartId = "pie-coverage";
  const [activeCoverage, setActiveCoverage] = useState("covered");
  
  // Filter for table display based on the 3-state filterMode
  //  - 'all':       every record
  //  - 'uncovered': not igazolt in eKréta AND not covered by a local igazolás (actionable)
  //  - 'resolved':  igazolt in eKréta OR covered by a local igazolás
  const filteredTableAnalysis = useMemo(() => {
    if (!analysis) return null;
    if (filterMode === 'all') return analysis;

    const filteredMulasztasok = analysis.mulasztasok.filter(m => {
      const resolved = m.igazolt || m.is_covered;
      return filterMode === 'resolved' ? resolved : !resolved;
    });

    return {
      ...analysis,
      mulasztasok: filteredMulasztasok,
      total_mulasztasok: filteredMulasztasok.length,
    };
  }, [analysis, filterMode]);

  // Breakdown for the informative empty/header state
  const breakdown = useMemo(() => {
    if (!analysis) return { total: 0, igazolt: 0, covered: 0, uncovered: 0 };
    const igazolt = analysis.mulasztasok.filter(m => m.igazolt).length;
    const covered = analysis.mulasztasok.filter(m => !m.igazolt && m.is_covered).length;
    const uncovered = analysis.mulasztasok.filter(m => !m.igazolt && !m.is_covered).length;
    return { total: analysis.mulasztasok.length, igazolt, covered, uncovered };
  }, [analysis]);

  // Filter for stats display based on statsFilter dropdown
  const filteredStatsAnalysis = useMemo(() => {
    if (!analysis) return null;
    if (statsFilter === 'all') return analysis;
    
    // Filter to only uncovered mulasztások for stats
    const filteredMulasztasok = analysis.mulasztasok.filter(m => !m.igazolt && !m.is_covered);
    
    return {
      ...analysis,
      mulasztasok: filteredMulasztasok,
      total_mulasztasok: filteredMulasztasok.length,
      igazolt_count: 0,
      covered_by_igazolas: 0,
      not_covered: filteredMulasztasok.length,
    };
  }, [analysis, statsFilter]);
  
  // Pie chart data for stats (uses filteredStatsAnalysis)
  const pieData = useMemo(() => filteredStatsAnalysis ? [
    { category: "igazolt", value: filteredStatsAnalysis?.igazolt_count ?? 0, fill: "var(--color-igazolt)" },
    { category: "covered", value: filteredStatsAnalysis?.covered_by_igazolas ?? 0, fill: "var(--color-covered)" },
    { category: "not_covered", value: filteredStatsAnalysis?.not_covered ?? 0, fill: "var(--color-not_covered)" },
  ] : [], [filteredStatsAnalysis]);

  const pieChartConfig = {
    value: { label: "Mulasztások" },
    igazolt: { label: "eKrétában igazolt", color: "hsl(142, 76%, 36%)" },
    covered: { label: "Lefedve igazolással", color: "hsl(221, 83%, 53%)" },
    not_covered: { label: "Nincs lefedve", color: "hsl(0, 84%, 60%)" },
  } satisfies ChartConfig;

  const activeIndex = useMemo(
    () => pieData.findIndex((item) => item.category === activeCoverage),
    [activeCoverage, pieData]
  );

  // Radial chart for késés
  const kesesChartData = useMemo(() => [{
    name: "keses",
    minutes: uncoveredKesesMinutes,
    fill: isKesesDanger ? "hsl(0, 84%, 60%)" : "hsl(45, 93%, 47%)",
  }], [uncoveredKesesMinutes, isKesesDanger]);

  const kesesChartConfig = {
    minutes: { label: "Percek" },
    keses: { 
      label: "Késési percek",
      color: isKesesDanger ? "hsl(0, 84%, 60%)" : "hsl(45, 93%, 47%)",
    },
  } satisfies ChartConfig;

  // Radar chart for subjects - separate by igazolt, covered, and not_covered
  const subjectData = useMemo(() => {
    if (!filteredStatsAnalysis) return [];
    
    const subjectMap = new Map<string, { igazolt: number; covered: number; not_covered: number }>();
    
    filteredStatsAnalysis.mulasztasok.forEach(m => {
      if (!subjectMap.has(m.tantargy)) {
        subjectMap.set(m.tantargy, { igazolt: 0, covered: 0, not_covered: 0 });
      }
      const stats = subjectMap.get(m.tantargy)!;
      
      if (m.igazolt) {
        stats.igazolt += 1;
      } else if (m.is_covered) {
        stats.covered += 1;
      } else {
        stats.not_covered += 1;
      }
    });
    
    return Array.from(subjectMap.entries())
      .map(([subject, stats]) => ({ 
        subject, 
        igazolt: stats.igazolt,
        covered: stats.covered,
        not_covered: stats.not_covered,
      }))
      .sort((a, b) => (b.igazolt + b.covered + b.not_covered) - (a.igazolt + a.covered + a.not_covered))
      .slice(0, 8); // Top 8 subjects
  }, [filteredStatsAnalysis]);

  const subjectChartConfig = {
    igazolt: {
      label: "eKrétában igazolt",
      color: "hsl(142, 76%, 36%)",
    },
    covered: {
      label: "Lefedve igazolással",
      color: "hsl(221, 83%, 53%)",
    },
    not_covered: {
      label: "Nincs lefedve",
      color: "hsl(0, 84%, 60%)",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Header with "new feature" badge */}
      <div className="flex items-start justify-between" data-tour="mulasztasok-header">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="https://75a37cbe8a.clvaw-cdnwnd.com/8058bbc8c881bdb6799fafe8ef3094b7/200002106-716d2716d4/kr%C3%A9ta4.jpg?ph=75a37cbe8a" 
              alt="eKréta" 
              className="w-6 h-6 md:w-8 md:h-8 rounded object-cover"
            />
            Mulasztások eKrétából
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Töltsd fel az eKrétából exportált mulasztásaidat és elemezd az igazolásokkal való lefedettséget.
          </p>
          <Badge className="mt-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Sparkles className="w-3 h-3 mr-1" />
            Új
          </Badge>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0" data-tour="mulasztasok-goto">
          <a href="https://klik035236001.e-kreta.hu/Hianyzas/Hianyzasok" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Irány a Kréta
          </a>
        </Button>
      </div>

      {/* Instructions - Collapsible */}
      <Collapsible open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20" data-tour="mulasztasok-quick-create">
          <CardHeader className="pb-3">
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-base md:text-lg">Használati útmutató</CardTitle>
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform ${isGuideOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Fájl feltöltése
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-xs md:text-sm text-muted-foreground">
                    <li>Jelentkezz be az eKréta ellenőrzőbe egy számítógépen</li>
                    <li>Navigálj a Mulasztások menüponthoz</li>
                    <li>Exportáld ki a mulasztásokat XLSX formátumban</li>
                    <li>Töltsd fel az exportált fájlt ide</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Statisztikák
                  </h4>
                  <p className="text-xs md:text-sm text-muted-foreground mb-2">
                    Az elemzés automatikusan kategorizálja a mulasztásokat státusz szerint:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      eKrétában igazolt
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Lefedve igazolással
                    </Badge>  
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      Nincs lefedve
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Gyors igazolás létrehozása
                  </h4>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Jelölj ki egyes mulasztásokat (Shift+kattintással tartományokat is kijelölhetsz), 
                    majd a <span className="font-semibold text-yellow-600 dark:text-yellow-400">Kijelöltek Igazolása</span> gombbal 
                    automatikusan kitöltött űrlapon készíthetsz igazolást.
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Upload section */}
      <Card data-tour="mulasztasok-upload">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Upload className="w-4 h-4 md:w-5 md:h-5" />
            Fájl feltöltése
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Válaszd ki az eKrétából exportált .xlsx fájlt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          {lastUpdatedAt !== null && (
            <div
              className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs md:text-sm ${
                isDataStale
                  ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
                  : 'border-muted bg-muted/40 text-muted-foreground'
              }`}
            >
              <Clock className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <div>
                  Utoljára frissítve: <span className="font-medium">{formatDateTime(lastUpdatedAt)}</span>
                  {daysSinceLastUpdate !== null && daysSinceLastUpdate > 0 && (
                    <span> ({daysSinceLastUpdate} napja)</span>
                  )}
                </div>
                {isDataStale && (
                  <div className="font-medium">
                    Az adatok már néhány napja nem frissültek. Érdemes manuálisan frissíteni az eKrétából exportált fájl újbóli feltöltésével.
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
              className="w-full md:w-auto text-xs md:text-sm"
            >
              <FileSpreadsheet className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              {file ? 'Másik fájl választása' : 'Fájl kiválasztása'}
            </Button>
            {file && (
              <span className="text-xs md:text-sm text-muted-foreground truncate max-w-full">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>
          
          {file && (
            <Button onClick={handleUpload} disabled={uploading} className="w-full">
              {uploading ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Feltöltés folyamatban...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Feltöltés és elemzés
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Spinner className="w-8 h-8" />
          </CardContent>
        </Card>
      ) : analysis && analysis.total_mulasztasok > 0 ? (
        <>
        {/* Tabs for Mobile & Laptop */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'table' | 'stats')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="table" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Táblázat
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Statisztikák
            </TabsTrigger>
          </TabsList>

          {/* Table Tab */}
          <TabsContent value="table" className="space-y-4">

            {/* Upload error details (if any) */}
            {uploadErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-sm">
                  {uploadErrors.length} sor nem került feldolgozásra
                </AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 text-xs">
                    {uploadErrors.slice(0, 5).map((err, i) => (
                      <li key={i} className="break-words">{err}</li>
                    ))}
                    {uploadErrors.length > 5 && (
                      <li className="italic">…és {uploadErrors.length - 5} további.</li>
                    )}
                  </ul>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => setUploadErrors([])}
                  >
                    Elrejtés
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Stat overview ribbon — mobile-first, scrolls horizontally on small screens */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3" data-tour="mulasztasok-filters">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`text-left rounded-lg border p-3 transition-colors ${
                  filterMode === 'all'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="text-xs text-muted-foreground">Összesen</div>
                <div className="text-xl md:text-2xl font-bold">{breakdown.total}</div>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('uncovered')}
                className={`text-left rounded-lg border p-3 transition-colors ${
                  filterMode === 'uncovered'
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/30 ring-1 ring-red-500'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                  Nincs lefedve
                </div>
                <div className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
                  {breakdown.uncovered}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('resolved')}
                className={`text-left rounded-lg border p-3 transition-colors ${
                  filterMode === 'resolved'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  Lefedve
                </div>
                <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {breakdown.covered}
                </div>
              </button>
              <div className="rounded-lg border p-3 bg-muted/30">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                  eKrétában igazolt
                </div>
                <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                  {breakdown.igazolt}
                </div>
              </div>
            </div>

            {/* Mulasztások List */}
            <Card className="overflow-hidden">
            <CardHeader className="p-3 md:p-6">
              <div className="flex items-start justify-between flex-wrap gap-2 md:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <CardTitle className="text-base md:text-xl">Mulasztások részletei</CardTitle>
                    {breakdown.uncovered > 0 && filterMode !== 'uncovered' && (
                      <Badge variant="destructive" className="text-xs">
                        {breakdown.uncovered} lefedésre vár
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    {filteredTableAnalysis?.mulasztasok.length ?? 0} / {breakdown.total} mulasztás megjelenítve
                    <br className="hidden md:block" />
                    <span className="text-xs hidden md:inline">
                      Kattints a sorokra kijelöléshez. Shift+Kattintás: tartomány. Ctrl/Cmd+A: összes lefedetlen.
                    </span>
                  </CardDescription>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    className="flex-1 md:flex-initial text-xs md:text-sm"
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    <span className="md:hidden">Törlés</span>
                    <span className="hidden md:inline">Összes törlése</span>
                  </Button>
                </div>
              </div>

              {/* Segmented filter — mobile-first */}
              <div
                role="tablist"
                aria-label="Mulasztás szűrő"
                className="mt-3 grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg text-xs md:text-sm"
              >
                {([
                  { key: 'all', label: 'Összes', count: breakdown.total },
                  { key: 'uncovered', label: 'Lefedetlen', count: breakdown.uncovered },
                  { key: 'resolved', label: 'Rendezve', count: breakdown.covered + breakdown.igazolt },
                ] as { key: FilterMode; label: string; count: number }[]).map(opt => (
                  <button
                    key={opt.key}
                    role="tab"
                    aria-selected={filterMode === opt.key}
                    onClick={() => setFilterMode(opt.key)}
                    className={`px-2 py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      filterMode === opt.key
                        ? 'bg-background shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    <span className="text-[10px] md:text-xs text-muted-foreground">({opt.count})</span>
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              {filteredTableAnalysis?.mulasztasok.length === 0 ? (
                renderEmptyFilteredState({ filterMode, breakdown, onShowAll: () => setFilterMode('all') })
              ) : (
                <>
                  {/* MOBILE: card list */}
                  <div className="md:hidden space-y-2">
                    {filteredTableAnalysis?.mulasztasok.map((mulasztas, index) =>
                      renderMulasztasCard({
                        mulasztas,
                        index,
                        selectedMulasztasok,
                        lastSelectedIndex,
                        setSelectedMulasztasok,
                        setLastSelectedIndex,
                        list: filteredTableAnalysis.mulasztasok,
                        getCoverageBadge,
                        getTipusBadge,
                        getTipusIcon,
                        formatDate,
                        handleCoverageBadgeClick,
                        handleQuickCreateIgazolas,
                      })
                    )}
                  </div>

                  {/* DESKTOP: table */}
                  <div className="hidden md:block overflow-x-auto -mx-3 md:-mx-6">
                    <Table className="relative">
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="w-24 text-sm">Dátum</TableHead>
                          <TableHead className="w-12 text-sm">Óra</TableHead>
                          <TableHead className="min-w-24 text-sm">Tantárgy</TableHead>
                          <TableHead className="text-sm">Típus</TableHead>
                          <TableHead className="hidden lg:table-cell min-w-32 text-sm">Téma</TableHead>
                          <TableHead className="w-20 text-sm">Státusz</TableHead>
                          <TableHead className="text-right w-20 text-sm">Műv.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTableAnalysis?.mulasztasok.map((mulasztas, index) => {
                        const isUncovered = !mulasztas.igazolt && !mulasztas.is_covered;
                        const isSelected = selectedMulasztasok.has(mulasztas.id);
                        const isClickable = isUncovered || mulasztas.is_covered;
                        
                        const handleRowClick = (e: React.MouseEvent) => {
                          if (isUncovered) {
                            // Handle selection for uncovered records
                            if (e.shiftKey && lastSelectedIndex !== null) {
                              // Range selection with Shift
                              e.preventDefault();
                              const start = Math.min(lastSelectedIndex, index);
                              const end = Math.max(lastSelectedIndex, index);
                              const newSelected = new Set(selectedMulasztasok);
                              
                              for (let i = start; i <= end; i++) {
                                const m = filteredTableAnalysis!.mulasztasok[i];
                                if (m && !m.igazolt && !m.is_covered) {
                                  newSelected.add(m.id);
                                }
                              }
                              setSelectedMulasztasok(newSelected);
                            } else {
                              // Single toggle
                              const newSelected = new Set(selectedMulasztasok);
                              if (newSelected.has(mulasztas.id)) {
                                newSelected.delete(mulasztas.id);
                              } else {
                                newSelected.add(mulasztas.id);
                              }
                              setSelectedMulasztasok(newSelected);
                              setLastSelectedIndex(index);
                            }
                          } else if (mulasztas.is_covered) {
                            // Show coverage drawer for covered records
                            handleCoverageBadgeClick(mulasztas);
                          }
                        };
                        
                        return (
                          <TableRow 
                            key={mulasztas.id}
                            onClick={handleRowClick}
                            className={`
                              transition-colors duration-150
                              ${isSelected ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-500' : ''}
                              ${isClickable && !isSelected ? 'hover:bg-muted/50 cursor-pointer' : ''}
                              ${!isClickable ? 'opacity-60' : ''}
                            `}
                            style={{ userSelect: 'none' }}
                          >
                            <TableCell className="text-xs md:text-sm py-2 md:py-4">
                              <div className="flex items-center gap-1 md:gap-2">
                                <span className="md:hidden">{getTipusIcon(mulasztas.tipus)}</span>
                                <Calendar className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground hidden md:inline" />
                                <span className="whitespace-nowrap">{formatDate(mulasztas.datum)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs md:text-sm py-2 md:py-4">
                              <div className="flex items-center gap-1 md:gap-2">
                                <Clock className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground hidden md:inline" />
                                {mulasztas.ora}.
                              </div>
                            </TableCell>
                            <TableCell className="text-xs md:text-sm py-2 md:py-4">
                              <div className="flex items-center gap-1 md:gap-2">
                                <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground hidden md:inline" />
                                {mulasztas.tantargy}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs md:text-sm py-2 md:py-4">{getTipusBadge(mulasztas.tipus)}</TableCell>
                            <TableCell className="hidden lg:table-cell text-xs md:text-sm py-2 md:py-4 max-w-xs truncate" title={mulasztas.tema}>
                              {mulasztas.tema}
                            </TableCell>
                            <TableCell className="py-2 md:py-4">
                              <div className="flex items-center gap-1 md:gap-2">
                                {isSelected && <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />}
                                {getCoverageBadge(mulasztas)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-2 md:py-4">
                              {isUncovered ? (
                                <TooltipProvider>
                                  <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild className="hidden md:inline-flex">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newSelected = new Set<number>();
                                          newSelected.add(mulasztas.id);
                                          setSelectedMulasztasok(newSelected);
                                          handleQuickCreateIgazolas();
                                        }}
                                      >
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Igazolás létrehozása ehhez a mulasztáshoz</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  {/* Mobile button without tooltip */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="md:hidden h-7 w-7 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newSelected = new Set<number>();
                                      newSelected.add(mulasztas.id);
                                      setSelectedMulasztasok(newSelected);
                                      handleQuickCreateIgazolas();
                                    }}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </TooltipProvider>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Floating Action Bar */}
          {selectedMulasztasok.size > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-sm bg-background/95 border-t shadow-lg">
              <div className="container mx-auto px-3 md:px-6 max-w-full">
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 py-3 md:py-4">
                  <Badge variant="secondary" className="text-xs md:text-sm font-medium">
                    {selectedMulasztasok.size} kiválasztva
                  </Badge>
                  <div className="flex flex-row gap-2 w-full md:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMulasztasok(new Set());
                        setLastSelectedIndex(null);
                      }}
                      className="flex-1 md:flex-initial text-xs md:text-sm"
                    >
                      Törlés
                    </Button>
                    <Button
                      onClick={handleQuickCreateIgazolas}
                      size="sm"
                      className="flex-1 md:flex-initial bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="hidden md:inline">Igazolás létrehozása</span>
                      <span className="md:hidden">Létrehozás</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            {/* Stats Filter Dropdown */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Statisztikák</CardTitle>
                    <CardDescription className="text-xs">Mulasztások elemzése</CardDescription>
                  </div>
                  <Select value={statsFilter} onValueChange={(v) => setStatsFilter(v as 'all' | 'uncovered')}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Összes mulasztás</SelectItem>
                      <SelectItem value="uncovered">Csak igazolatlanok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
            </Card>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {/* Interactive Pie Chart - Coverage */}
              <Card data-chart={pieChartId} className="flex flex-col">
                <ChartStyle id={pieChartId} config={pieChartConfig} />
                <CardHeader className="flex-row items-start space-y-0 pb-0">
                  <div className="grid gap-1 flex-1">
                    <CardTitle>Lefedettség</CardTitle>
                    <CardDescription>
                      Összes mulasztás: {filteredStatsAnalysis?.total_mulasztasok ?? 0}
                    </CardDescription>
                  </div>
                  <Select value={activeCoverage} onValueChange={setActiveCoverage}>
                    <SelectTrigger
                      className="ml-auto h-7 w-[160px] rounded-lg pl-2.5"
                      aria-label="Válassz kategóriát"
                    >
                      <SelectValue placeholder="Kategória" />
                    </SelectTrigger>
                    <SelectContent align="end" className="rounded-xl">
                      {pieData.map((item) => {
                        const config = pieChartConfig[item.category as keyof typeof pieChartConfig];
                        if (!config) return null;
                        return (
                          <SelectItem
                            key={item.category}
                            value={item.category}
                            className="rounded-lg [&_span]:flex"
                          >
                            <div className="flex items-center gap-2 text-xs">
                              <span
                                className="flex h-3 w-3 shrink-0 rounded-sm"
                                style={{ backgroundColor: `var(--color-${item.category})` }}
                              />
                              {config?.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="flex flex-1 justify-center pb-0">
                  <ChartContainer
                    id={pieChartId}
                    config={pieChartConfig}
                    className="mx-auto aspect-square w-full max-w-[300px]"
                  >
                    <PieChart>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="category"
                        innerRadius={60}
                        strokeWidth={5}
                        activeIndex={activeIndex}
                        activeShape={(props: PieSectorDataItem) => {
                          const outerRadius = props.outerRadius || 0;
                          return (
                            <g>
                              <Sector {...props} outerRadius={outerRadius + 10} />
                              <Sector
                                {...props}
                                outerRadius={outerRadius + 25}
                                innerRadius={outerRadius + 12}
                              />
                            </g>
                          );
                        }}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-3xl font-bold"
                                  >
                                    {pieData[activeIndex]?.value.toLocaleString()}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                    className="fill-muted-foreground"
                                  >
                                    {coveragePercentage}% lefedve
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm pt-4">
                  <div className="flex items-center gap-2 leading-none font-medium">
                    {coveragePercentage >= 80 ? (
                      <>
                        Kiváló lefedettség! <TrendingUp className="h-4 w-4 text-green-600" />
                      </>
                    ) : coveragePercentage >= 50 ? (
                      <>
                        Jó úton vagy <TrendingUp className="h-4 w-4 text-blue-600" />
                      </>
                    ) : (
                      <>
                        Javításra szorul <TrendingDown className="h-4 w-4 text-red-600" />
                      </>
                    )}
                  </div>
                  <div className="text-muted-foreground leading-none text-center">
                    {(filteredStatsAnalysis?.covered_by_igazolas ?? 0) + (filteredStatsAnalysis?.igazolt_count ?? 0)} mulasztás rendezve {filteredStatsAnalysis?.total_mulasztasok ?? 0}-ból
                  </div>
                </CardFooter>
              </Card>

              {/* Késés Warning - Radial Chart (Mobile Stats Tab) */}
              {uncoveredKesesMinutes > 0 && (
                <Card className={`flex flex-col ${isKesesDanger ? 'border-red-500 dark:border-red-700' : 'border-orange-500 dark:border-orange-700'}`}>
                  <CardHeader className="items-center pb-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertCircle className={`w-4 h-4 ${isKesesDanger ? 'text-red-600' : 'text-orange-600'}`} />
                      <span className={isKesesDanger ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}>
                        Késési figyelmeztetés
                      </span>
                    </CardTitle>
                    <CardDescription className="text-center mt-2 text-xs">
                      {isKesesDanger 
                        ? 'VESZÉLY! 45 perc felett igazolatlan óra!'
                        : 'Közeledik a 45 perces határ'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-0">
                    <ChartContainer
                      config={kesesChartConfig}
                      className="mx-auto aspect-square max-h-[200px]"
                    >
                      <RadialBarChart
                        data={kesesChartData}
                        startAngle={0}
                        endAngle={(uncoveredKesesMinutes / 45) * 360}
                        innerRadius={70}
                        outerRadius={95}
                      >
                        <PolarGrid
                          gridType="circle"
                          radialLines={false}
                          stroke="none"
                          className="first:fill-muted last:fill-background"
                          polarRadius={[76, 64]}
                        />
                        <RadialBar dataKey="minutes" background cornerRadius={10} />
                        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                          <Label
                            content={({ viewBox }) => {
                              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                    <tspan
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      className={`text-4xl font-bold ${isKesesDanger ? 'fill-red-600' : 'fill-yellow-600'}`}
                                    >
                                      {kesesChartData[0].minutes}
                                    </tspan>
                                    <tspan
                                      x={viewBox.cx}
                                      y={(viewBox.cy || 0) + 24}
                                      className="fill-muted-foreground"
                                    >
                                      perc / 45
                                    </tspan>
                                  </text>
                                );
                              }
                            }}
                          />
                        </PolarRadiusAxis>
                      </RadialBarChart>
                    </ChartContainer>
                  </CardContent>
                  <CardFooter className="flex-col gap-2 text-sm pt-4">
                    <div className={`flex items-center gap-2 leading-none font-medium ${
                      isKesesDanger ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {isKesesDanger ? (
                        <>
                          Sürgősen fedezd le! <AlertCircle className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Még {45 - uncoveredKesesMinutes} perc maradt <Clock className="h-4 w-4" />
                        </>
                      )}
                    </div>
                    <div className="text-muted-foreground leading-none text-center">
                      {Math.round((uncoveredKesesMinutes / 45) * 100)}% kitöltöttség
                    </div>
                  </CardFooter>
                </Card>
              )}

              {/* Radar Chart - Subject Statistics */}
              {subjectData.length > 0 && (
                <Card>
                  <CardHeader className="items-center pb-4">
                    <CardTitle>Tantárgyak szerint</CardTitle>
                    <CardDescription className="text-xs">
                      Mulasztások megoszlása
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-0">
                    <ChartContainer
                      config={subjectChartConfig}
                      className="mx-auto aspect-square max-h-[250px]"
                    >
                      <RadarChart data={subjectData}>
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="line" />}
                        />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarGrid radialLines={false} />
                        <Radar
                          dataKey="igazolt"
                          fill="var(--color-igazolt)"
                          fillOpacity={0}
                          stroke="var(--color-igazolt)"
                          strokeWidth={2}
                        />
                        <Radar
                          dataKey="covered"
                          fill="var(--color-covered)"
                          fillOpacity={0}
                          stroke="var(--color-covered)"
                          strokeWidth={2}
                        />
                        <Radar
                          dataKey="not_covered"
                          fill="var(--color-not_covered)"
                          fillOpacity={0}
                          stroke="var(--color-not_covered)"
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ChartContainer>
                  </CardContent>
                  <CardFooter className="flex-col gap-2 text-sm pt-4">
                    <div className="flex items-center gap-2 leading-none font-medium">
                      {subjectData[0] && subjectData[0].not_covered > 0 && (
                        <>
                          Legtöbb lefedetlen: {subjectData[0].subject} <TrendingUp className="h-4 w-4 text-red-600" />
                        </>
                      )}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2 leading-none">
                      Top {subjectData.length} tantárgy
                    </div>
                  </CardFooter>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileSpreadsheet className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Még nincsenek feltöltött mulasztások</h3>
            <p className="text-muted-foreground mb-4">
              Töltsd fel az első eKréta XLSX fájlodat az elemzés megkezdéséhez
            </p>
          </CardContent>
        </Card>
      )}

      {/* Drawer for showing igazolások */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl overflow-y-auto">
          {drawerMulasztas && (
            <>
              <SheetHeader className="border-b pb-4 mb-6">
                <SheetTitle className="text-2xl font-bold">
                  {drawerMulasztas.datum} - Lefedő igazolások
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">
                  {drawerMulasztas.ora}. óra • {drawerMulasztas.tantargy}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto">
                <ScrollArea className="h-full">
                  {drawerLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Spinner />
                    </div>
                  ) : selectedIgazolas ? (
                    // Show detailed igazolás view
                    <div className="p-6 space-y-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedIgazolas(null)}
                        className="mb-4"
                      >
                        ← Vissza a listához
                      </Button>

                      {(() => {
                        const row = mapIgazolasToTableRow(selectedIgazolas);
                        return (
                          <>
                            {/* Student Data Section */}
                            <Card className="border-2">
                              <CardHeader className="bg-muted/50 pb-4">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-lg bg-primary/10">
                                    <User className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg">Beküldött adatok</CardTitle>
                                    <CardDescription className="text-xs">Az általad megadott információk</CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              
                              <CardContent className="pt-6 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                                    <UILabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Neved</UILabel>
                                    <p className="font-semibold text-lg">{row.studentName}</p>
                                  </div>
                                  <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                                    <UILabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Osztályod</UILabel>
                                    <p className="font-semibold text-lg">{row.studentClass}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                                    <UILabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hiányzás típusa</UILabel>
                                    {(() => {
                                      const typeInfo = getIgazolasType(row.type);
                                      return (
                                        <Badge 
                                          variant="outline" 
                                          className={`${typeInfo.color} inline-flex items-center gap-1.5 font-medium`}
                                        >
                                          <span className="text-sm">{typeInfo.emoji}</span>
                                          {typeInfo.name}
                                        </Badge>
                                      );
                                    })()}
                                  </div>
                                  <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                                    <UILabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Dátum
                                    </UILabel>
                                    {isMultiDayAbsence(row.startDate, row.endDate) ? (
                                      <div className="space-y-1">
                                        <p className="text-sm font-semibold">{new Date(row.startDate).toLocaleDateString('hu-HU')}</p>
                                        <p className="text-xs text-muted-foreground">→</p>
                                        <p className="text-sm font-semibold">{new Date(row.endDate).toLocaleDateString('hu-HU')}</p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                          {Math.ceil((new Date(row.endDate).getTime() - new Date(row.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} nap
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="font-semibold text-base">{row.date}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                                  <UILabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    {isMultiDayAbsence(row.startDate, row.endDate) ? 'Érintett napok' : 'Érintett órák'}
                                  </UILabel>
                                  {isMultiDayAbsence(row.startDate, row.endDate) ? (
                                    <div className="flex flex-col gap-1 w-fit">
                                      {/* Day headers */}
                                      <div className="grid grid-cols-7 gap-1">
                                        {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => (
                                          <div
                                            key={dayIndex}
                                            className="flex items-center justify-center text-[10px] font-semibold text-muted-foreground uppercase h-5 w-9"
                                          >
                                            {getDayOfWeekShort(dayIndex)}
                                          </div>
                                        ))}
                                      </div>
                                      
                                      {/* Calendar weeks */}
                                      {buildCalendarGrid(row.startDate, row.endDate).map((week, weekIndex) => (
                                        <div key={weekIndex} className="grid grid-cols-7 gap-1">
                                          {week.map((day, dayIndex) => {
                                            let bgColor = "period-inactive";
                                            let glowColor = "";
                                            let tooltipText = `${day.date.toLocaleDateString('hu-HU', { weekday: 'long' })}\n${day.date.toLocaleDateString('hu-HU')}`;
                                            
                                            if (day.isInRange) {
                                              if (row.allapot === 'Függőben') {
                                                bgColor = "period-pending";
                                                glowColor = "period-glow-blue";
                                                tooltipText += "\nEllenőrzésre vár";
                                              } else if (row.allapot === 'Elfogadva') {
                                                bgColor = "period-approved";
                                                glowColor = "period-glow-green";
                                                tooltipText += "\nJóváhagyva";
                                              } else if (row.allapot === 'Elutasítva') {
                                                bgColor = "period-rejected";
                                                glowColor = "period-glow-red";
                                                tooltipText += "\nElutasítva";
                                              }
                                            } else {
                                              tooltipText = `${day.date.toLocaleDateString('hu-HU', { weekday: 'long' })}\n${day.date.toLocaleDateString('hu-HU')}\nNem érintett`;
                                            }
                                            
                                            return (
                                              <TooltipProvider key={dayIndex}>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <span
                                                      className={`inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full cursor-help transition-all duration-300 ease-in-out transform ${bgColor} ${day.isInRange ? glowColor : ''} hover:scale-110`}
                                                    >
                                                      {day.dayOfMonth}
                                                    </span>
                                                  </TooltipTrigger>
                                                  <TooltipContent className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-600 dark:border-slate-400 font-medium text-xs whitespace-pre-line max-w-xs shadow-lg">
                                                    {tooltipText}
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            );
                                          })}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    getHoursDisplay(row)
                                  )}
                                </div>

                                {row.fromFTV && (
                                  <Card className="border-2 border-blue-300 dark:border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
                                    <CardHeader className="pb-4 bg-blue-100/50 dark:bg-blue-900/30">
                                      <div className="flex items-start gap-3">
                                        <div className="p-3 rounded-xl bg-blue-600 dark:bg-blue-500 shadow-lg">
                                          <Clapperboard className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                          <CardTitle className="text-xl text-blue-900 dark:text-blue-200 flex items-center gap-2">
                                            FTV Sync
                                            <Badge variant="outline" className="bg-blue-200 text-blue-900 border-blue-400 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-600 text-xs">
                                              Médiatanár által igazolva
                                            </Badge>
                                          </CardTitle>
                                          <CardDescription className="text-blue-700 dark:text-blue-400 mt-1">
                                            Forgatásszervezői Platform - Automatikus szinkronizálás
                                          </CardDescription>
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-4">
                                      {/* Main FTV Info */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-blue-200 dark:border-blue-700">
                                          <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 animate-pulse"></div>
                                            <UILabel className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase">Státusz</UILabel>
                                          </div>
                                          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Médiatanár által visszaigazolva</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-blue-200 dark:border-blue-700">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Clapperboard className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                            <UILabel className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase">Forrás</UILabel>
                                          </div>
                                          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">FTV Forgatásszervező Platform</p>
                                        </div>
                                      </div>

                                      {/* Important Note */}
                                      <Alert className="border-cyan-300 dark:border-cyan-600 bg-cyan-50/50 dark:bg-cyan-900/20">
                                        <AlertCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                        <AlertTitle className="text-cyan-900 dark:text-cyan-300 font-semibold">Fontos információ</AlertTitle>
                                        <AlertDescription className="text-cyan-800 dark:text-cyan-400 text-sm">
                                          Ez az igazolás közvetlenül a Forgatásszervezői Platformról került importálásra. 
                                          A médiatanár már visszaigazolta a jelenléted a forgatáson.
                                        </AlertDescription>
                                      </Alert>

                                      {/* Multi-day forgatás notice */}
                                      {row.ftvTobbnapos && (
                                        <Alert className="border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20">
                                          <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                          <AlertTitle className="text-indigo-900 dark:text-indigo-300 font-semibold">Többnapos forgatás</AlertTitle>
                                          <AlertDescription className="text-indigo-800 dark:text-indigo-400 text-sm">
                                            Ez a forgatás több napon átnyúló, ez a hiányzás csak az itt jelzett napra vonatkozik.
                                            {row.ftvForgatasVegDatum && (
                                              <> A teljes forgatás: {new Date(row.startDate).toLocaleDateString('hu-HU')} – {new Date(row.ftvForgatasVegDatum).toLocaleDateString('hu-HU')}.</>
                                            )}
                                          </AlertDescription>
                                        </Alert>
                                      )}

                                      {/* Student Correction Section - Only show if there are extra minutes */}
                                      {((row.minutesBefore ?? 0) > 0 || (row.minutesAfter ?? 0) > 0) && (
                                        <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-2 border-yellow-300 dark:border-yellow-600">
                                          <div className="flex items-center gap-2 mb-3">
                                            <div className="p-2 rounded-lg bg-yellow-600 dark:bg-yellow-500">
                                              <User className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                              <p className="font-bold text-yellow-900 dark:text-yellow-200">Általad megadott extra időszak</p>
                                              <p className="text-xs text-yellow-700 dark:text-yellow-400">Osztályfőnöki jóváhagyásra vár</p>
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            {(row.minutesBefore ?? 0) > 0 && (
                                              <div className="flex items-center gap-3 p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-700">
                                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-yellow-600 dark:bg-yellow-500 text-white font-bold text-lg">
                                                  {row.minutesBefore}
                                                </div>
                                                <div>
                                                  <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">Forgatás előtt</p>
                                                  <p className="text-xs text-yellow-700 dark:text-yellow-400">Utazási idő, előkészület</p>
                                                </div>
                                              </div>
                                            )}
                                            {(row.minutesAfter ?? 0) > 0 && (
                                              <div className="flex items-center gap-3 p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-700">
                                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-yellow-600 dark:bg-yellow-500 text-white font-bold text-lg">
                                                  {row.minutesAfter}
                                                </div>
                                                <div>
                                                  <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">Forgatás után</p>
                                                  <p className="text-xs text-yellow-700 dark:text-yellow-400">Hazautazás, lezárás</p>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          <div className="mt-3 p-2 rounded bg-yellow-200/50 dark:bg-yellow-800/30">
                                            <p className="text-xs text-yellow-800 dark:text-yellow-300">
                                              <strong>Összesen:</strong> {(row.minutesBefore ?? 0) + (row.minutesAfter ?? 0)} perc extra időszak
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Indoklás / Korrekció section - only show if there's content */}
                                {((row.correctedHours && row.correctedHours.length > 0) || (!row.fromFTV && row.status)) && (
                                  <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                                    {row.correctedHours && row.correctedHours.length > 0 ? (
                                      <>
                                        <UILabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Korrekció indoklása</UILabel>
                                        <p className="text-sm leading-relaxed">{row.status || <span className="italic text-muted-foreground">Nincs megjegyzés</span>}</p>
                                      </>
                                    ) : (
                                      <>
                                        <UILabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Indoklás</UILabel>
                                        <p className="text-sm leading-relaxed">{row.status || <span className="italic text-muted-foreground">Nincs megjegyzés</span>}</p>
                                      </>
                                    )}
                                  </div>
                                )}

                                {(row.imageUrl || row.imgDriveURL) && (
                                  <div className="space-y-2">
                                    <UILabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                      <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3">
                                        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                                        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                                        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                                        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                                        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                                        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                                      </svg>
                                      Mellékelt kép (Google Drive)
                                    </UILabel>
                                    <Button 
                                      variant="outline" 
                                      size="lg" 
                                      className="w-full h-auto py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-emerald-300"
                                      onClick={() => {
                                        const imageUrl = row.imageUrl || row.imgDriveURL;
                                        if (imageUrl) {
                                          window.open(imageUrl, '_blank', 'noopener,noreferrer');
                                        }
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                          <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                                            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                                            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                                            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                                            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                                            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                                            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                                          </svg>
                                        </div>
                                        <div className="text-left">
                                          <p className="font-medium">Kép megtekintése Google Drive-on</p>
                                          <p className="text-xs text-muted-foreground">Kattints a megnyitáshoz</p>
                                        </div>
                                        <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                                      </div>
                                    </Button>
                                  </div>
                                )}

                                <div className="space-y-2 p-3 rounded-lg bg-muted/30 border">
                                  <UILabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                    {row.fromFTV ? (
                                      <>
                                        <RotateCcw className="h-3 w-3" />
                                        Utoljára szinkronizálva
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="h-3 w-3" />
                                        Rögzítés dátuma
                                      </>
                                    )}
                                  </UILabel>
                                  <p className="text-sm font-medium">
                                    {new Date(row.submittedAt).toLocaleString('hu-HU', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>

                            {/* BKK Verification Section */}
                            {row.bkk_verification && (
                              <BKKAlertVerificationCard bkkVerificationJson={row.bkk_verification} />
                            )}

                            {/* Teacher Note Section - if exists */}
                            {row.teacherNote && (
                              <Card className="border-2 border-primary/20">
                                <CardHeader className="bg-primary/5 pb-4">
                                  <CardTitle className="text-lg">Osztályfőnök megjegyzése</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                  <p className="text-sm leading-relaxed">{row.teacherNote}</p>
                                </CardContent>
                              </Card>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    // Show list of igazolások
                    <div className="p-6 space-y-4">
                      {drawerIgazolasok.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Nincsenek igazolások</h3>
                          <p className="text-muted-foreground">
                            Erre a napra még nincsenek beküldött igazolások.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold">
                              {drawerIgazolasok.length} igazolás található erre a napra
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Kattints egy igazolásra a részletek megtekintéséhez
                            </p>
                          </div>

                          <div className="space-y-3">
                            {drawerIgazolasok.map((igazolas) => {
                              const typeInfo = getIgazolasType(igazolas.tipus.nev);
                              const getStatusBadge = (allapot: string) => {
                                if (allapot === 'Függőben') {
                                  return <Badge variant="pending">Függőben</Badge>;
                                } else if (allapot === 'Elfogadva') {
                                  return <Badge variant="approved">Elfogadva</Badge>;
                                } else if (allapot === 'Elutasítva') {
                                  return <Badge variant="rejected">Elutasítva</Badge>;
                                }
                                return <Badge variant="secondary">Ismeretlen</Badge>;
                              };

                              return (
                                <Card
                                  key={igazolas.id}
                                  className="cursor-pointer hover:bg-muted/50 transition-colors border-2"
                                  onClick={() => setSelectedIgazolas(igazolas)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge 
                                            variant="outline" 
                                            className={`${typeInfo.color} inline-flex items-center gap-1.5`}
                                          >
                                            <span>{typeInfo.emoji}</span>
                                            {typeInfo.name}
                                          </Badge>
                                          {getStatusBadge(igazolas.allapot)}
                                          {igazolas.ftv && (
                                            <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                              <Clapperboard className="w-3 h-3 mr-1" />
                                              FTV
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <Calendar className="w-4 h-4" />
                                          {new Date(igazolas.eleje).toLocaleDateString('hu-HU')}
                                          {isMultiDayAbsence(igazolas.eleje, igazolas.vege) && (
                                            <>
                                              {' → '}
                                              {new Date(igazolas.vege).toLocaleDateString('hu-HU')}
                                            </>
                                          )}
                                        </div>
                                        {(igazolas.megjegyzes_diak || igazolas.megjegyzes) && (
                                          <p className="text-sm text-muted-foreground line-clamp-2">
                                            {igazolas.megjegyzes_diak || igazolas.megjegyzes}
                                          </p>
                                        )}
                                      </div>
                                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      <OnboardingTour
        tourId={TOUR_IDS.MULASZTASOK}
        steps={mulasztasokTourSteps}
        ready={!loading}
      />
    </div>
  );
}

// Helper function to map Igazolas to IgazolasTableRow format for display
function mapIgazolasToTableRow(igazolas: Igazolas): IgazolasTableRow {
  const startDate = new Date(igazolas.eleje);
  
  return {
    id: String(igazolas.id),
    studentId: String(igazolas.profile.user.id),
    date: startDate.toLocaleDateString('hu-HU'),
    startDate: igazolas.eleje,
    endDate: igazolas.vege,
    hours: [],
    type: igazolas.tipus.nev,
    status: igazolas.megjegyzes_diak || igazolas.megjegyzes || '',
    allapot: igazolas.allapot,
    studentName: `${igazolas.profile.user.last_name} ${igazolas.profile.user.first_name}`,
    studentClass: igazolas.profile.osztalyom?.nev || 'N/A',
    teacherNote: igazolas.megjegyzes_tanar,
    submittedAt: igazolas.rogzites_datuma,
    imageUrl: igazolas.image_url || igazolas.imgDriveURL,
    imgDriveURL: igazolas.imgDriveURL,
    image_url: igazolas.image_url ?? null,
    fromFTV: igazolas.ftv,
    correctedHours: igazolas.korrigalt ? [1] : [],
    minutesBefore: igazolas.diak_extra_ido_elotte,
    minutesAfter: igazolas.diak_extra_ido_utana,
    bkk_verification: igazolas.bkk_verification,
    ftvTobbnapos: igazolas.ftv_tobbnapos,
    ftvForgatasVegDatum: igazolas.ftv_forgatas_veg_datum,
  };
}

// --- New helpers for the redesigned Mulasztások view -----------------------

interface EmptyFilteredStateProps {
  filterMode: FilterMode;
  breakdown: { total: number; igazolt: number; covered: number; uncovered: number };
  onShowAll: () => void;
}

function renderEmptyFilteredState({ filterMode, breakdown, onShowAll }: EmptyFilteredStateProps) {
  // No records at all in dataset
  if (breakdown.total === 0) {
    return (
      <div className="text-center py-10 px-4">
        <FileSpreadsheet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Nincsenek feltöltött mulasztások.</p>
      </div>
    );
  }

  // Filter hides everything — explain why
  if (filterMode === 'uncovered') {
    return (
      <div className="text-center py-8 px-4 space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-semibold">Minden mulasztás rendezve!</h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Az összes feltöltött mulasztásod vagy már igazolt eKrétában, vagy lefedi egy
            beküldött igazolásod.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          {breakdown.igazolt > 0 && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {breakdown.igazolt} eKrétában igazolt
            </Badge>
          )}
          {breakdown.covered > 0 && (
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {breakdown.covered} igazolással lefedve
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onShowAll}>
          Összes megjelenítése
        </Button>
      </div>
    );
  }

  if (filterMode === 'resolved') {
    return (
      <div className="text-center py-8 px-4 space-y-3">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
        <div>
          <h3 className="text-base font-semibold">Még semmi nincs rendezve</h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Nincs egyetlen olyan mulasztás sem, amely eKrétában igazolva van vagy igazolásod
            által lefedve lenne. {breakdown.uncovered > 0 && `${breakdown.uncovered} mulasztás vár lefedésre.`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onShowAll}>
          Összes megjelenítése
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-10 px-4">
      <p className="text-sm text-muted-foreground">Nincs megjeleníthető mulasztás.</p>
    </div>
  );
}

interface MulasztasCardProps {
  mulasztas: MulasztasDetailed;
  index: number;
  selectedMulasztasok: Set<number>;
  lastSelectedIndex: number | null;
  setSelectedMulasztasok: React.Dispatch<React.SetStateAction<Set<number>>>;
  setLastSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  list: MulasztasDetailed[];
  getCoverageBadge: (m: MulasztasDetailed) => React.ReactNode;
  getTipusBadge: (tipus: string) => React.ReactNode;
  getTipusIcon: (tipus: string) => React.ReactNode;
  formatDate: (d: string) => string;
  handleCoverageBadgeClick: (m: MulasztasDetailed) => void;
  handleQuickCreateIgazolas: () => void;
}

function renderMulasztasCard(props: MulasztasCardProps) {
  const {
    mulasztas, index, selectedMulasztasok, lastSelectedIndex,
    setSelectedMulasztasok, setLastSelectedIndex, list,
    getCoverageBadge, getTipusBadge, getTipusIcon, formatDate,
    handleCoverageBadgeClick, handleQuickCreateIgazolas,
  } = props;

  const isUncovered = !mulasztas.igazolt && !mulasztas.is_covered;
  const isSelected = selectedMulasztasok.has(mulasztas.id);
  const isClickable = isUncovered || mulasztas.is_covered;

  const onCardClick = (e: React.MouseEvent) => {
    if (isUncovered) {
      if (e.shiftKey && lastSelectedIndex !== null) {
        e.preventDefault();
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const newSelected = new Set(selectedMulasztasok);
        for (let i = start; i <= end; i++) {
          const m = list[i];
          if (m && !m.igazolt && !m.is_covered) newSelected.add(m.id);
        }
        setSelectedMulasztasok(newSelected);
      } else {
        const newSelected = new Set(selectedMulasztasok);
        if (newSelected.has(mulasztas.id)) newSelected.delete(mulasztas.id);
        else newSelected.add(mulasztas.id);
        setSelectedMulasztasok(newSelected);
        setLastSelectedIndex(index);
      }
    } else if (mulasztas.is_covered) {
      handleCoverageBadgeClick(mulasztas);
    }
  };

  // Extract any extra eKréta-side info the user might need to see
  const ekretaInfo: { label: string; value: string }[] = [];
  if (mulasztas.igazolt && mulasztas.igazolas_tipusa) {
    ekretaInfo.push({ label: 'Igazolás típusa (eKréta)', value: mulasztas.igazolas_tipusa });
  }
  if (mulasztas.mulasztas_ok) {
    ekretaInfo.push({ label: 'Ok', value: mulasztas.mulasztas_ok });
  }
  if (mulasztas.mulasztas_statusz) {
    ekretaInfo.push({ label: 'Státusz (eKréta)', value: mulasztas.mulasztas_statusz });
  }

  return (
    <div
      key={mulasztas.id}
      onClick={onCardClick}
      style={{ userSelect: 'none' }}
      className={`rounded-lg border p-3 transition-colors
        ${isSelected ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 ring-1 ring-blue-500' : 'bg-card'}
        ${isClickable && !isSelected ? 'active:bg-muted/60 cursor-pointer' : ''}
        ${!isClickable ? 'opacity-70' : ''}`}
    >
      {/* Top row: type icon + date + lesson number + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isSelected ? (
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
          ) : (
            <span className="flex-shrink-0">{getTipusIcon(mulasztas.tipus)}</span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="truncate">{formatDate(mulasztas.datum)}</span>
              <span className="text-muted-foreground text-xs whitespace-nowrap">
                • {mulasztas.ora}. óra
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
              <BookOpen className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{mulasztas.tantargy}</span>
            </div>
          </div>
        </div>
        {isUncovered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMulasztasok(new Set([mulasztas.id]));
              handleQuickCreateIgazolas();
            }}
            aria-label="Igazolás létrehozása ehhez a mulasztáshoz"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Tema */}
      {mulasztas.tema && (
        <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
          {mulasztas.tema}
        </div>
      )}

      {/* Badges row */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {getTipusBadge(mulasztas.tipus)}
        {getCoverageBadge(mulasztas)}
      </div>

      {/* eKréta extra info — answers "is it justified already?" */}
      {ekretaInfo.length > 0 && (
        <div className="mt-2 pt-2 border-t border-dashed space-y-1">
          {ekretaInfo.map((info) => (
            <div key={info.label} className="flex items-baseline gap-1.5 text-[11px]">
              <span className="text-muted-foreground flex-shrink-0">{info.label}:</span>
              <span className="font-medium break-words">{info.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to get hours display
function getHoursDisplay(row: IgazolasTableRow) {
  const startDate = new Date(row.startDate);
  const endDate = new Date(row.endDate);
  const dateForSchedule = startDate.getTime();
  const schedule = getPeriodSchedule(dateForSchedule);
  
  if (!schedule || typeof schedule === 'string') {
    const startHours = startDate.getHours();
    const startMins = startDate.getMinutes();
    const endHours = endDate.getHours();
    const endMins = endDate.getMinutes();
    
    return (
      <div className="flex items-center gap-1">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-semibold">
          {String(startHours).padStart(2, '0')}:{String(startMins).padStart(2, '0')} - {String(endHours).padStart(2, '0')}:{String(endMins).padStart(2, '0')}
        </span>
      </div>
    );
  }

  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
  
  const affectedPeriods: number[] = [];
  Object.entries(schedule).forEach(([key, period]) => {
    if (key === 'date' || key === 'overrides' || key === 'tanitasi_szunetek') return;
    
    const periodNum = parseInt(key);
    if (isNaN(periodNum) || !period || typeof period === 'string') return;
    
    const periodData = period as { start: string; end: string };
    const [startHour, startMin] = periodData.start.split(':').map(Number);
    const [endHour, endMin] = periodData.end.split(':').map(Number);
    const periodStart = startHour * 60 + startMin;
    const periodEnd = endHour * 60 + endMin;
    
    if (startMinutes < periodEnd && endMinutes > periodStart) {
      affectedPeriods.push(periodNum);
    }
  });

  let bgColor = "period-inactive";
  let glowColor = "";
  if (row.allapot === 'Függőben') {
    bgColor = "period-pending";
    glowColor = "period-glow-blue";
  } else if (row.allapot === 'Elfogadva') {
    bgColor = "period-approved";
    glowColor = "period-glow-green";
  } else if (row.allapot === 'Elutasítva') {
    bgColor = "period-rejected";
    glowColor = "period-glow-red";
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {affectedPeriods.map((period) => {
        const periodData = schedule[period] as { start: string; end: string };
        if (!periodData) return null;
        
        const tooltipText = `${period}. óra\n${periodData.start} - ${periodData.end}`;
        
        return (
          <TooltipProvider key={period}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={`inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-full cursor-help transition-all duration-300 ease-in-out transform ${bgColor} ${glowColor} hover:scale-110`}
                >
                  {period}
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-600 dark:border-slate-400 font-medium text-xs whitespace-pre-line">
                {tooltipText}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}


