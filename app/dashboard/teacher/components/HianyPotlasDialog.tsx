'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Send } from 'lucide-react';

const QUICK_REASONS = [
  'Nem megfelelő indoklás',
  'Hibás dátum',
  'Hiányzó fényképes csatolmány',
  'Egyéb',
];

interface HianyPotlasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comment: string) => void | Promise<void>;
  submitting?: boolean;
}

export function HianyPotlasDialog({ open, onOpenChange, onConfirm, submitting }: HianyPotlasDialogProps) {
  const [comment, setComment] = useState('');

  // Reset the field whenever the dialog is (re)opened for a new igazolás
  useEffect(() => {
    if (open) setComment('');
  }, [open]);

  const handleReasonClick = (reason: string) => {
    setComment(reason === 'Egyéb' ? '' : reason);
  };

  const handleSubmit = () => {
    onConfirm(comment.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Hiánypótlás kérése
          </DialogTitle>
          <DialogDescription>
            A diák email értesítést kap, hogy javítania/ki kell egészítenie az igazolást. Add meg röviden, mi hiányzik.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_REASONS.map((reason) => (
              <Button
                key={reason}
                type="button"
                variant={comment === reason ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleReasonClick(reason)}
                className={comment === reason ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
              >
                {reason}
              </Button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hianypotlas-comment">Megjegyzés (opcionális)</Label>
            <Input
              id="hianypotlas-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Pl. Kérlek tölts fel fényképet az orvosi igazolásról"
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Mégse
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            Küldés hiánypótlásra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
