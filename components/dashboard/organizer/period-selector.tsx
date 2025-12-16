'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  type Period,
  PERIOD_LABELS,
} from '@/lib/types/dashboard/organizer'

interface PeriodSelectorProps {
  value: Period
  onChange: (period: Period) => void
}

/**
 * Selector de periodo temporal para el dashboard
 * 
 * Periodos disponibles (RN-03):
 * - Mensual
 * - Trimestral
 * - Semestral
 * 
 * NO se permite análisis diario.
 */
export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as Period)}
      className="w-fit"
    >
      <TabsList>
        <TabsTrigger value="monthly">{PERIOD_LABELS.monthly}</TabsTrigger>
        <TabsTrigger value="quarterly">{PERIOD_LABELS.quarterly}</TabsTrigger>
        <TabsTrigger value="biannual">{PERIOD_LABELS.biannual}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

