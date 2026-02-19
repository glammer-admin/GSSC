"use client"

const IVA_PERCENT = 19

interface CostSummarySectionProps {
  basePrice: number
  attributesSurcharge: number
  commissionPercent: number
}

export function CostSummarySection({
  basePrice,
  attributesSurcharge,
  commissionPercent,
}: CostSummarySectionProps) {
  const priceWithAttributes = basePrice + attributesSurcharge
  const commissionAmount = Math.round((priceWithAttributes * commissionPercent) / 100)
  const subtotal = priceWithAttributes + commissionAmount
  const ivaAmount = Math.round((subtotal * IVA_PERCENT) / 100)
  const total = subtotal + ivaAmount

  const fmt = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Precio base del producto</dt>
        <dd className="font-medium tabular-nums">{fmt(basePrice)}</dd>
      </div>
      {attributesSurcharge > 0 && (
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Recargo por atributos</dt>
          <dd className="font-medium tabular-nums">+{fmt(attributesSurcharge)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted-foreground">
          Comisión del proyecto ({commissionPercent}%)
        </dt>
        <dd className="font-medium tabular-nums">{fmt(commissionAmount)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">
          IVA ({IVA_PERCENT}%)
        </dt>
        <dd className="font-medium tabular-nums">{fmt(ivaAmount)}</dd>
      </div>
      <div className="flex justify-between border-t pt-2 mt-2">
        <dt className="font-semibold text-foreground">Total tentativo</dt>
        <dd className="font-bold tabular-nums text-foreground">{fmt(total)}</dd>
      </div>
      <p className="text-xs text-muted-foreground pt-1">
        Valores aproximados e informativos. El precio final puede variar según atributos seleccionados.
      </p>
    </dl>
  )
}
