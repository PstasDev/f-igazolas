'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import type { MulasztasAnalysis, MulasztasDetailed } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
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
  FlaskConical,
  Plus,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
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
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
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

// Helper to group mulasztások by date
interface DayGroup {
  date: string;
  mulasztasok: MulasztasDetailed[];
  allSelected: boolean;
}

export function MulasztasokView() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<MulasztasAnalysis | null>(null);
  const [includeIgazolt, setIncludeIgazolt] = useState(false);
  
  // Quick create igazolás state
  const [selectedMulasztasok, setSelectedMulasztasok] = useState<Set<number>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Fetch existing mulasztások on mount
  useEffect(() => {
    fetchMulasztasok();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeIgazolt]);

  const fetchMulasztasok = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getMyMulasztasok(includeIgazolt);
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
      return <Badge variant="outline">Késés ({minutes} Perc)</Badge>;
    }
    return <Badge variant="outline">Késés</Badge>;
  };

  const getCoverageBadge = (mulasztas: MulasztasDetailed) => {
    if (mulasztas.igazolt) {
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          eKrétában igazolt
        </Badge>
      );
    }
    if (mulasztas.is_covered) {
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
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

  // Group uncovered mulasztások by date
  const groupByDate = (): DayGroup[] => {
    if (!analysis) return [];
    
    const uncovered = analysis.mulasztasok.filter(m => !m.igazolt && !m.is_covered);
    const grouped = new Map<string, MulasztasDetailed[]>();
    
    uncovered.forEach(m => {
      if (!grouped.has(m.datum)) {
        grouped.set(m.datum, []);
      }
      grouped.get(m.datum)!.push(m);
    });
    
    return Array.from(grouped.entries())
      .map(([date, mulasztasok]) => ({
        date,
        mulasztasok: mulasztasok.sort((a, b) => a.ora - b.ora),
        allSelected: mulasztasok.every(m => selectedMulasztasok.has(m.id)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const toggleDaySelection = (dayGroup: DayGroup) => {
    const newSelected = new Set(selectedMulasztasok);
    if (dayGroup.allSelected) {
      // Deselect all from this day
      dayGroup.mulasztasok.forEach(m => newSelected.delete(m.id));
    } else {
      // Select all from this day
      dayGroup.mulasztasok.forEach(m => newSelected.add(m.id));
    }
    setSelectedMulasztasok(newSelected);
  };

  const toggleMulasztasSelection = (id: number) => {
    const newSelected = new Set(selectedMulasztasok);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMulasztasok(newSelected);
  };

  const toggleDayExpanded = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  const handleQuickCreateIgazolas = () => {
    if (selectedMulasztasok.size === 0) {
      toast.error('Válassz ki legalább egy mulasztást!');
      return;
    }

    // Get selected mulasztások and calculate time range
    const selected = analysis!.mulasztasok.filter(m => selectedMulasztasok.has(m.id));
    
    // Calculate lesson start and end times
    const getTimeForLesson = (date: string, ora: number) => {
      const startMinutes = 8 * 60 + (ora - 1) * 45;
      const endMinutes = startMinutes + 45;
      
      const startHour = Math.floor(startMinutes / 60);
      const startMin = startMinutes % 60;
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      
      const startTime = `${date}T${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}:00`;
      const endTime = `${date}T${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;
      
      return { start: startTime, end: endTime };
    };

    // Find earliest start and latest end
    let earliestStart = '';
    let latestEnd = '';
    
    selected.forEach(m => {
      const times = getTimeForLesson(m.datum, m.ora);
      if (!earliestStart || times.start < earliestStart) {
        earliestStart = times.start;
      }
      if (!latestEnd || times.end > latestEnd) {
        latestEnd = times.end;
      }
    });

    // Prepare covered mulasztasok info
    const coveredInfo = selected.map(m => ({
      id: m.id,
      datum: m.datum,
      ora: m.ora,
      tantargy: m.tantargy
    }));

    // Store in sessionStorage for the form to pick up
    sessionStorage.setItem('prefill_igazolas', JSON.stringify({
      eleje: earliestStart,
      vege: latestEnd,
      megjegyzes_diak: `Mulasztások lefedése (${selected.length} óra):\n${selected.map(m => `📅 ${m.datum} • ${m.ora}. óra • ${m.tantargy}`).join('\n')}`,
      from_mulasztasok: true,
      covered_mulasztasok: coveredInfo,
    }));

    toast.success(`${selected.length} mulasztás adatai átadva az űrlapnak`, { duration: 3000 });

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
  
  // Pie chart data
  const pieData = useMemo(() => analysis ? [
    { category: "igazolt", value: analysis.igazolt_count, fill: "var(--color-igazolt)" },
    { category: "covered", value: analysis.covered_by_igazolas, fill: "var(--color-covered)" },
    { category: "not_covered", value: analysis.not_covered, fill: "var(--color-not_covered)" },
  ] : [], [analysis]);

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

  // Radar chart for subjects
  const subjectData = useMemo(() => {
    if (!analysis) return [];
    const subjectMap = new Map<string, number>();
    analysis.mulasztasok.forEach(m => {
      if (!m.igazolt && !m.is_covered) {
        subjectMap.set(m.tantargy, (subjectMap.get(m.tantargy) || 0) + 1);
      }
    });
    return Array.from(subjectMap.entries())
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 subjects
  }, [analysis]);

  const subjectChartConfig = {
    count: {
      label: "Mulasztások",
      color: "hsl(221, 83%, 53%)",
    },
  } satisfies ChartConfig;

  const dayGroups = groupByDate();

  return (
    <div className="space-y-6">
      {/* Header with experimental badge */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="https://75a37cbe8a.clvaw-cdnwnd.com/8058bbc8c881bdb6799fafe8ef3094b7/200002106-716d2716d4/kr%C3%A9ta4.jpg?ph=75a37cbe8a" 
              alt="eKréta" 
              className="w-8 h-8 rounded object-cover"
            />
            Mulasztások eKrétából
          </h2>
          <p className="text-muted-foreground mt-1">
            Töltsd fel az eKrétából exportált mulasztásaidat és elemezd az igazolásokkal való lefedettséget.
          </p>
          <Badge className="mt-2 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
            <FlaskConical className="w-3 h-3 mr-1" />
            Kísérleti funkció
          </Badge>
        </div>
      </div>

      {/* Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Használati útmutató</AlertTitle>
        <AlertDescription className="space-y-2">
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Jelentkezz be az eKréta ellenőrzőbe</li>
            <li>Navigálj a Mulasztások menüponthoz</li>
            <li>Exportáld ki a mulasztásokat XLSX formátumban</li>
            <li>Töltsd fel az exportált fájlt ide</li>
            <li>Elemezd az eredményeket és hasonlítsd össze a benyújtott igazolásokkal</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Upload section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Fájl feltöltése
          </CardTitle>
          <CardDescription>
            Válaszd ki az eKrétából exportált .xlsx fájlt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {file ? 'Másik fájl választása' : 'Fájl kiválasztása'}
            </Button>
            {file && (
              <span className="text-sm text-muted-foreground">
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
          {/* Statistics Overview with Interactive Charts */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Interactive Pie Chart - Coverage */}
            <Card data-chart={pieChartId} className="flex flex-col lg:col-span-4">
              <ChartStyle id={pieChartId} config={pieChartConfig} />
              <CardHeader className="flex-row items-start space-y-0 pb-0">
                <div className="grid gap-1 flex-1">
                  <CardTitle>Lefedettség</CardTitle>
                  <CardDescription>
                    Összes mulasztás: {analysis.total_mulasztasok}
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
                                  className="fill-muted-foreground text-sm"
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
                  {analysis.covered_by_igazolas + analysis.igazolt_count} mulasztás rendezve {analysis.total_mulasztasok}-ból
                </div>
              </CardFooter>
            </Card>

            {/* Radar Chart - Subject Statistics */}
            {subjectData.length > 0 && (
              <Card className="lg:col-span-3">
                <CardHeader className="items-center pb-4">
                  <CardTitle>Tantárgyak szerint</CardTitle>
                  <CardDescription>Lefedetlen mulasztások megoszlása</CardDescription>
                </CardHeader>
                <CardContent className="pb-0">
                  <ChartContainer
                    config={subjectChartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                  >
                    <RadarChart data={subjectData}>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <PolarGrid gridType="circle" />
                      <PolarAngleAxis dataKey="subject" />
                      <Radar
                        dataKey="count"
                        fill="var(--color-count)"
                        fillOpacity={0.6}
                        dot={{ r: 4, fillOpacity: 1 }}
                      />
                    </RadarChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm pt-4">
                  <div className="text-muted-foreground text-center leading-none">
                    Top {subjectData.length} tantárgy lefedetlen mulasztásokkal
                  </div>
                </CardFooter>
              </Card>
            )}
          </div>

          {/* Késés Warning - Radial Chart */}
          {uncoveredKesesMinutes > 0 && (
            <Card className={`flex flex-col ${isKesesDanger ? 'border-red-500 dark:border-red-700' : 'border-yellow-500 dark:border-yellow-700'}`}>
              <CardHeader className="items-center pb-0">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className={`w-5 h-5 ${isKesesDanger ? 'text-red-600' : 'text-yellow-600'}`} />
                  <span className={isKesesDanger ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}>
                    Késési percek figyelmeztetés
                  </span>
                </CardTitle>
                <CardDescription className="text-center mt-2">
                  {isKesesDanger 
                    ? 'VESZÉLY! 45 perc felett igazolatlan óra kerül az eKrétába!'
                    : 'Figyelem! Közeledik a 45 perces határ'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-0">
                <ChartContainer
                  config={kesesChartConfig}
                  className="mx-auto aspect-square max-h-[250px]"
                >
                  <RadialBarChart
                    data={kesesChartData}
                    startAngle={0}
                    endAngle={(uncoveredKesesMinutes / 45) * 360}
                    innerRadius={80}
                    outerRadius={110}
                  >
                    <PolarGrid
                      gridType="circle"
                      radialLines={false}
                      stroke="none"
                      className="first:fill-muted last:fill-background"
                      polarRadius={[86, 74]}
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
                                  className="fill-muted-foreground text-sm"
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
              <CardFooter className="flex-col gap-2 text-sm">
                <div className={`flex items-center gap-2 leading-none font-medium ${
                  isKesesDanger ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {isKesesDanger ? (
                    <>
                      Sürgősen fedezd le igazolással! <AlertCircle className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Még {45 - uncoveredKesesMinutes} perc marad a határig <Clock className="h-4 w-4" />
                    </>
                  )}
                </div>
                <div className="text-muted-foreground leading-none text-center">
                  {Math.round((uncoveredKesesMinutes / 45) * 100)}% kitöltöttség
                </div>
              </CardFooter>
            </Card>
          )}

          {/* Quick Create Igazolás Section */}
          {dayGroups.length > 0 && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Gyors igazolás létrehozása
                </CardTitle>
                <CardDescription>
                  Válassz ki mulasztásokat nap vagy óránkénti bontásban, majd nyisd meg az igazolás űrlapot a mezők automatikus kitöltésével
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Day-by-day selection */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Válassz mulasztásokat ({selectedMulasztasok.size} kiválasztva)</p>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-md p-3">
                    {dayGroups.map((dayGroup) => (
                      <Collapsible
                        key={dayGroup.date}
                        open={expandedDays.has(dayGroup.date)}
                        onOpenChange={() => toggleDayExpanded(dayGroup.date)}
                      >
                        <div className="space-y-2">
                          <div 
                            className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
                            onClick={() => toggleDayExpanded(dayGroup.date)}
                          >
                            <div className="flex items-center gap-3 flex-1" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={dayGroup.allSelected}
                                onCheckedChange={() => toggleDaySelection(dayGroup)}
                                aria-label={`Nap összes kiválasztása: ${formatDate(dayGroup.date)}`}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{formatDate(dayGroup.date)}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {dayGroup.mulasztasok.length} óra
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {expandedDays.has(dayGroup.date) ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          
                          <CollapsibleContent className="pl-9 space-y-1">
                            {dayGroup.mulasztasok.map((mulasztas) => (
                              <div
                                key={mulasztas.id}
                                className="flex items-center gap-3 p-2 hover:bg-accent rounded-md text-sm"
                              >
                                <Checkbox
                                  checked={selectedMulasztasok.has(mulasztas.id)}
                                  onCheckedChange={() => toggleMulasztasSelection(mulasztas.id)}
                                  aria-label={`${mulasztas.ora}. óra - ${mulasztas.tantargy}`}
                                />
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{mulasztas.ora}. óra</span>
                                <span className="text-muted-foreground">-</span>
                                <span>{mulasztas.tantargy}</span>
                                {getTipusBadge(mulasztas.tipus)}
                              </div>
                            ))}
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                </div>

                {/* Quick create button */}
                {selectedMulasztasok.size > 0 && (
                  <div className="pt-3 border-t space-y-3">
                    {/* Preview of covered mulasztások */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-blue-900 dark:text-blue-100">
                            Lefedésre kerülő mulasztások
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {selectedMulasztasok.size} mulasztás lesz lefedve az új igazolással
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {Array.from(selectedMulasztasok).map(id => {
                          const mulasztas = analysis!.mulasztasok.find(m => m.id === id);
                          if (!mulasztas) return null;
                          return (
                            <div 
                              key={id}
                              className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded text-sm border border-blue-100 dark:border-blue-900"
                            >
                              <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <span className="font-medium text-blue-900 dark:text-blue-100">
                                {mulasztas.datum}
                              </span>
                              <span className="text-gray-400">•</span>
                              <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <span className="text-blue-800 dark:text-blue-200">
                                {mulasztas.ora}. óra
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-700 dark:text-gray-300 truncate">
                                {mulasztas.tantargy}
                              </span>
                              {getTipusBadge(mulasztas.tipus)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleQuickCreateIgazolas}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Igazolás űrlap megnyitása ({selectedMulasztasok.size} kiválasztott mulasztással)
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Az űrlap automatikusan ki lesz töltve a kiválasztott időpontokkal és a lefedett mulasztások listájával
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Mulasztások Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mulasztások részletei</CardTitle>
                  <CardDescription>
                    {analysis.mulasztasok.length} mulasztás megjelenítve
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIncludeIgazolt(!includeIgazolt)}
                  >
                    {includeIgazolt ? 'Csak nem igazoltak' : 'Összes mutatása'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Összes törlése
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dátum</TableHead>
                      <TableHead>Óra</TableHead>
                      <TableHead>Tantárgy</TableHead>
                      <TableHead>Típus</TableHead>
                      <TableHead>Téma</TableHead>
                      <TableHead>Státusz</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.mulasztasok.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nincsenek mulasztások
                        </TableCell>
                      </TableRow>
                    ) : (
                      analysis.mulasztasok.map((mulasztas) => (
                        <TableRow key={mulasztas.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {formatDate(mulasztas.datum)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              {mulasztas.ora}. óra
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-muted-foreground" />
                              {mulasztas.tantargy}
                            </div>
                          </TableCell>
                          <TableCell>{getTipusBadge(mulasztas.tipus)}</TableCell>
                          <TableCell className="max-w-xs truncate" title={mulasztas.tema}>
                            {mulasztas.tema}
                          </TableCell>
                          <TableCell>{getCoverageBadge(mulasztas)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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
    </div>
  );
}
