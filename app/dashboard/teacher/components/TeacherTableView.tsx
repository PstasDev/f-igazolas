'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { DataTable } from '../data-table';
import { createColumns } from '../columns';
import { apiClient } from '@/lib/api';
import { Igazolas, TanevRendje } from '@/lib/types';
import { toast } from 'sonner';
import { FTVLoadingState } from '@/components/ui/ftv-loading-state';
import { FTVSyncStatus } from '@/components/ui/ftv-sync-status';
import { mapApiResponseToPeriods, getImpactedPeriods } from '@/lib/periods';
import { useFTVSync } from '@/hooks/use-ftv-sync';
import { isAttendanceRequired } from '@/lib/attendance-utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { TOUR_IDS, igazolasokTeacherTourSteps } from '@/lib/onboarding-tours';
import { HianyPotlasDialog } from './HianyPotlasDialog';

interface TeacherTableViewProps {
  filter: 'all' | 'pending' | 'approved' | 'rejected';
}

// Helper function to map Igazolas to the format expected by columns
function mapIgazolasToTableData(igazolas: Igazolas) {
  // Use the new period calculation logic
  const { originalPeriods, correctedPeriods } = mapApiResponseToPeriods(
    igazolas.eleje,
    igazolas.vege,
    igazolas.diak_extra_ido_elotte,
    igazolas.diak_extra_ido_utana,
    igazolas.reszletes_idopontok
  );
  
  // Map allapot to the new status structure
  const allapot = igazolas.allapot;
  
  return {
    id: igazolas.id.toString(),
    studentId: igazolas.profile.user.id.toString(),
    studentName: `${igazolas.profile.user.last_name} ${igazolas.profile.user.first_name}`,
    studentClass: igazolas.profile.osztalyom?.nev || 'N/A',
    type: igazolas.tipus.nev,
    date: new Date(igazolas.eleje).toLocaleDateString('hu-HU'),
    startDate: igazolas.eleje,
    endDate: igazolas.vege,
    hours: originalPeriods,
    correctedHours: correctedPeriods,
    status: igazolas.megjegyzes_diak || igazolas.megjegyzes || 'Nincs megjegyzés',
    imageUrl: igazolas.image_url || igazolas.imgDriveURL || '',
    imgDriveURL: igazolas.imgDriveURL || undefined,
    image_url: igazolas.image_url ?? null,
    bkk_verification: igazolas.bkk_verification || undefined,
    teacherNote: igazolas.megjegyzes_tanar || '',
    submittedAt: igazolas.rogzites_datuma,
    allapot: allapot,
    fromFTV: igazolas.ftv || false,
    minutesBefore: igazolas.diak_extra_ido_elotte || 0,
    minutesAfter: igazolas.diak_extra_ido_utana || 0,
    undoed: igazolas.undoed || false,
  };
}

export function TeacherTableView({ filter }: TeacherTableViewProps) {
  const [schedule, setSchedule] = useState<TanevRendje | null>(null);
  
  // Load schedule on mount
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const startYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;
        const fromDate = `${startYear}-09-01`;
        const toDate = `${startYear + 1}-08-31`;
        
        const scheduleData = await apiClient.getTanevRendje(fromDate, toDate);
        setSchedule(scheduleData);
      } catch (error) {
        console.error('Failed to load schedule:', error);
      }
    };
    
    loadSchedule();
  }, []);
  
  // Use the FTV sync hook for optimized data loading
  const {
    data: allIgazolasok,
    isLoading,
    isSyncing,
    metadata,
    syncNow,
  } = useFTVSync({
    fetchFunction: (mode) => apiClient.listIgazolas(mode),
    autoSync: true,
    syncType: 'class', // Teachers use class-level sync
  });

  // Filter based on status and attendance requirements
  const igazolasok = useMemo(() => {
    // Teachers must never see withdrawn (undoed) records, in any list or table.
    let filtered = allIgazolasok.filter(i => !i.undoed);
    
    // Filter out igazolások that fall entirely on non-attendance days
    if (schedule) {
      filtered = filtered.filter(i => {
        const start = new Date(i.eleje);
        const end = new Date(i.vege);
        const studentClass = i.profile.osztalyom;
        
        // Check if at least one day requires attendance
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = format(d, 'yyyy-MM-dd');
          if (isAttendanceRequired(dateStr, studentClass, schedule)) {
            return true; // Has at least one attendance-required day
          }
        }
        
        return false; // All days are non-attendance days, filter it out
      });
    }

    // Also filter out igazolások that don't overlap with any school period (0–8)
    filtered = filtered.filter(i => {
      const periods = i.reszletes_idopontok && i.reszletes_idopontok.length > 0
        ? i.reszletes_idopontok.flatMap(({ eleje, vege }) =>
            getImpactedPeriods(new Date(eleje), new Date(vege))
          )
        : getImpactedPeriods(new Date(i.eleje), new Date(i.vege));
      return periods.length > 0;
    });
    
    // Apply status filter
    if (filter === 'pending') {
      filtered = filtered.filter(i => i.allapot === 'Függőben');
    } else if (filter === 'approved') {
      filtered = filtered.filter(i => i.allapot === 'Elfogadva');
    } else if (filter === 'rejected') {
      filtered = filtered.filter(i => i.allapot === 'Elutasítva');
    }
    
    return filtered;
  }, [allIgazolasok, filter, schedule]);

  // Local state for optimistic updates
  const [localIgazolasok, setLocalIgazolasok] = useState<Igazolas[]>([]);
  
  // State for confirmation dialog
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);

  // State for confirming approve/reject on an igazolás currently awaiting the
  // student's hiánypótlás response - the teacher might be acting too early.
  const [confirmHianyPotlasActionOpen, setConfirmHianyPotlasActionOpen] = useState(false);
  const [pendingHianyPotlasAction, setPendingHianyPotlasAction] = useState<{ id: string; action: 'Elfogadva' | 'Elutasítva' } | null>(null);

  // State for the hiánypótlás request dialog (orange button)
  const [hianyPotlasOpen, setHianyPotlasOpen] = useState(false);
  const [hianyPotlasId, setHianyPotlasId] = useState<string | null>(null);
  const [hianyPotlasSubmitting, setHianyPotlasSubmitting] = useState(false);

  // Sync local state with filtered data
  useEffect(() => {
    setLocalIgazolasok(igazolasok);
  }, [igazolasok]);

  const handleApprove = async (id: string) => {
    const igazolas = localIgazolasok.find(i => i.id.toString() === id);
    if (igazolas && igazolas.allapot === 'Hiánypótlásra visszaküldve') {
      setPendingHianyPotlasAction({ id, action: 'Elfogadva' });
      setConfirmHianyPotlasActionOpen(true);
      return;
    }
    await performApprove(id);
  };

  const performApprove = async (id: string) => {
    try {
      // Optimistic update - update state immediately
      setLocalIgazolasok(prevIgazolasok => 
        prevIgazolasok.map(igazolas => 
          igazolas.id.toString() === id 
            ? { ...igazolas, allapot: 'Elfogadva' as const } 
            : igazolas
        )
      );

      await apiClient.quickActionIgazolas(parseInt(id), { action: 'Elfogadva' });
      toast.success('Igazolás jóváhagyva');
    } catch (error) {
      console.error('Failed to approve igazolás:', error);
      toast.error('Hiba történt az igazolás jóváhagyásakor');
      
      // Revert optimistic update on error
      setLocalIgazolasok(igazolasok);
    }
  };

  const handleReject = async (id: string) => {
    // Find the igazolás to check its current state
    const igazolas = localIgazolasok.find(i => i.id.toString() === id);

    if (igazolas && igazolas.allapot === 'Hiánypótlásra visszaküldve') {
      // Teacher might be acting before the student has replied to the hiánypótlás
      setPendingHianyPotlasAction({ id, action: 'Elutasítva' });
      setConfirmHianyPotlasActionOpen(true);
      return;
    }
    
    if (igazolas && igazolas.tipus.iskolaerdeku) {
      // Show confirmation dialog for iskolaérdekű igazolás
      setPendingRejectId(id);
      setConfirmRejectOpen(true);
      return;
    }
    
    // Proceed with rejection if not iskolaérdekű
    await performReject(id);
  };

  const performReject = async (id: string) => {
    try {
      // Optimistic update - update state immediately
      setLocalIgazolasok(prevIgazolasok => 
        prevIgazolasok.map(igazolas => 
          igazolas.id.toString() === id 
            ? { ...igazolas, allapot: 'Elutasítva' as const } 
            : igazolas
        )
      );

      await apiClient.quickActionIgazolas(parseInt(id), { action: 'Elutasítva' });
      toast.success('Igazolás elutasítva');
    } catch (error) {
      console.error('Failed to reject igazolás:', error);
      toast.error('Hiba történt az igazolás elutasításakor');
      
      // Revert optimistic update on error
      setLocalIgazolasok(igazolasok);
    }
  };
  
  const handleConfirmReject = async () => {
    if (pendingRejectId) {
      await performReject(pendingRejectId);
      setPendingRejectId(null);
      setConfirmRejectOpen(false);
    }
  };
  
  const handleCancelReject = () => {
    setPendingRejectId(null);
    setConfirmRejectOpen(false);
  };

  const handleConfirmHianyPotlasAction = async () => {
    if (pendingHianyPotlasAction) {
      if (pendingHianyPotlasAction.action === 'Elfogadva') {
        await performApprove(pendingHianyPotlasAction.id);
      } else {
        await performReject(pendingHianyPotlasAction.id);
      }
      setPendingHianyPotlasAction(null);
      setConfirmHianyPotlasActionOpen(false);
    }
  };

  const handleCancelHianyPotlasAction = () => {
    setPendingHianyPotlasAction(null);
    setConfirmHianyPotlasActionOpen(false);
  };

  const handleRequestRevision = (id: string) => {
    setHianyPotlasId(id);
    setHianyPotlasOpen(true);
  };

  const handleConfirmHianyPotlas = async (comment: string) => {
    if (!hianyPotlasId) return;
    const id = hianyPotlasId;
    try {
      setHianyPotlasSubmitting(true);
      setLocalIgazolasok(prevIgazolasok =>
        prevIgazolasok.map(igazolas =>
          igazolas.id.toString() === id
            ? { ...igazolas, allapot: 'Hiánypótlásra visszaküldve' as const, megjegyzes_tanar: comment }
            : igazolas
        )
      );

      await apiClient.quickActionIgazolas(parseInt(id), {
        action: 'Hiánypótlásra visszaküldve',
        megjegyzes_tanar: comment || undefined,
      });
      toast.success('Igazolás hiánypótlásra visszaküldve, a diák email értesítést kapott');
      setHianyPotlasOpen(false);
      setHianyPotlasId(null);
    } catch (error) {
      console.error('Failed to request hiánypótlás:', error);
      toast.error('Hiba történt a hiánypótlás küldésekor');
      setLocalIgazolasok(igazolasok);
    } finally {
      setHianyPotlasSubmitting(false);
    }
  };

  const handleSetPending = async (id: string) => {
    try {
      // Optimistic update - update state immediately
      setLocalIgazolasok(prevIgazolasok => 
        prevIgazolasok.map(igazolas => 
          igazolas.id.toString() === id 
            ? { ...igazolas, allapot: 'Függőben' as const } 
            : igazolas
        )
      );

      await apiClient.quickActionIgazolas(parseInt(id), { action: 'Függőben' });
      toast.success('Igazolás státusza visszaállítva függőben állapotra');
    } catch (error) {
      console.error('Failed to set pending:', error);
      toast.error('Hiba történt a státusz módosításakor');
      
      // Revert optimistic update on error
      setLocalIgazolasok(igazolasok);
    }
  };

  // Handle optimistic updates for the data table
  const handleOptimisticUpdate = useCallback((id: string, newAllapot: string) => {
    setLocalIgazolasok(prevIgazolasok => 
      prevIgazolasok.map(igazolas => 
        igazolas.id.toString() === id 
          ? { ...igazolas, allapot: newAllapot as Igazolas['allapot'] } 
          : igazolas
      )
    );
  }, []);

  // Create columns with action handlers
  const columns = createColumns({
    onApprove: handleApprove,
    onReject: handleReject,
    onSetPending: handleSetPending,
    onRequestRevision: handleRequestRevision,
  });

  const getTitle = () => {
    switch (filter) {
      case 'pending': return 'Ellenőrzésre váró igazolások';
      case 'approved': return 'Jóváhagyott igazolások';
      case 'rejected': return 'Elutasított igazolások';
      default: return 'Összes igazolás';
    }
  };

  const getDescription = () => {
    switch (filter) {
      case 'pending': return 'Jóváhagyásra váró igazolások listája';
      case 'approved': return 'Elfogadott igazolások listája';
      case 'rejected': return 'Elutasított igazolások listája';
      default: return 'Az összes beküldött igazolás';
    }
  };

  const showScheduleBadge = !!schedule;

  // Map data to table format
  const tableData = localIgazolasok.map(mapIgazolasToTableData);

  return (
    <>
      <AlertDialog open={confirmRejectOpen} onOpenChange={setConfirmRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iskolaérdekű igazolás elutasítása</AlertDialogTitle>
            <AlertDialogDescription>
              Ez az igazolás típusa azt jelzi, hogy a tanuló hivatalos iskolaérdekű okból volt távol. 
              Biztosan el szeretnéd utasítani ezt az igazolást?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelReject}>
              Mégse
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReject}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Elutasítás
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmHianyPotlasActionOpen} onOpenChange={setConfirmHianyPotlasActionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ez az igazolás hiánypótlásra vár</AlertDialogTitle>
            <AlertDialogDescription>
              Ez az igazolás jelenleg <strong>Hiánypótlásra visszaküldve</strong> státuszban van - lehet, hogy még
              a diák válaszára kell várni. Kérjük, ellenőrizd, hogy az adatok időközben helyessé váltak-e, mielőtt
              folytatod. Biztosan {pendingHianyPotlasAction?.action === 'Elfogadva' ? 'jóváhagyod' : 'elutasítod'} ezt az igazolást?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelHianyPotlasAction}>
              Mégse
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmHianyPotlasAction}
              className={pendingHianyPotlasAction?.action === 'Elfogadva'
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-600'
                : 'bg-red-600 hover:bg-red-700 focus:ring-red-600'}
            >
              {pendingHianyPotlasAction?.action === 'Elfogadva' ? 'Jóváhagyás' : 'Elutasítás'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <HianyPotlasDialog
        open={hianyPotlasOpen}
        onOpenChange={setHianyPotlasOpen}
        onConfirm={handleConfirmHianyPotlas}
        submitting={hianyPotlasSubmitting}
      />

      <div className="min-w-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-4 border-b" data-tour="igazolasok-teacher-header">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{getTitle()}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <p className="text-sm text-muted-foreground">{getDescription()}</p>
            {showScheduleBadge && (
              <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800">
                Szünnapokra vonatkozó igazolások elrejtve
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="min-w-0" data-tour="igazolasok-teacher-table">
        {isLoading ? (
          <div className="py-4">
            <FTVLoadingState 
              variant="sync"
              title="Igazolások betöltése"
              description="Gyors betöltés cache-elt adatokkal. Háttérben szinkronizálás folyik..."
            />
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={tableData} 
            onDataChange={syncNow} 
            onOptimisticUpdate={handleOptimisticUpdate}
            ftvSyncStatus={
              metadata ? (
                <FTVSyncStatus
                  metadata={metadata}
                  isSyncing={isSyncing}
                  onSyncNow={syncNow}
                  compact={false}
                />
              ) : null
            }
          />
        )}
      </div>
    </div>
    {filter === 'all' && (
      <OnboardingTour
        tourId={TOUR_IDS.IGAZOLASOK_TEACHER}
        steps={igazolasokTeacherTourSteps}
        ready={!isLoading}
      />
    )}
    </>
  );
}
