import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Printer, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { orderApi } from "@/lib/api"

const formatINR = (v) => `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"

export default function InvoicePrintPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    orderApi.getOne(orderId)
      .then(({ data }) => setOrder(data.data.order))
      .catch(() => setError("Invoice not found"))
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  if (error || !order) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <p className="text-muted-foreground">{error || "Order not found"}</p>
      <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
    </div>
  )

  const invoice = order.invoice
  const invoiceNum = invoice?.invoiceNumber || `INV-${order.orderNumber}`

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Control bar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 border-b border-border bg-background px-6 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </button>
        <Button onClick={() => window.print()} size="sm" className="gap-2">
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      {/* Invoice Document */}
      <div className="max-w-2xl mx-auto my-8 print:my-0 bg-white shadow-lg print:shadow-none rounded-xl print:rounded-none overflow-hidden">
        <style>{`
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }
        `}</style>

        {/* Header */}
        <div className="bg-black text-white px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight">QuickBill</p>
              <p className="text-white/70 text-sm mt-0.5">Stationery & Electronics</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white/70 uppercase tracking-wider">Invoice</p>
              <p className="text-xl font-bold mt-0.5">{invoiceNum}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Bill To</p>
              <p className="font-semibold text-gray-900">{order.customer?.name || "Walk-in Customer"}</p>
              {order.customer?.email && <p className="text-sm text-gray-500">{order.customer.email}</p>}
              {order.customer?.phone && <p className="text-sm text-gray-500">{order.customer.phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Details</p>
              <p className="text-sm text-gray-600">Date: {fmtDate(order.confirmedAt || order.createdAt)}</p>
              <p className="text-sm text-gray-600">Order: {order.orderNumber}</p>
              <p className="text-sm text-gray-600">Staff: {order.createdBy?.name || order.createdBy?.username}</p>
              <p className="text-sm mt-1">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                  order.status === "confirmed" ? "bg-green-100 text-green-800" :
                  order.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                }`}>{order.status.toUpperCase()}</span>
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Items Table */}
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="pb-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="py-3">
                      <p className="font-medium text-gray-900">{item.nameSnapshot}</p>
                      {item.skuSnapshot && <p className="text-xs text-gray-400">SKU: {item.skuSnapshot}</p>}
                    </td>
                    <td className="py-3 text-right text-gray-600">{formatINR(item.price)}</td>
                    <td className="py-3 text-center text-gray-600">
                      {item.quantity} {item.unitSnapshot || ""}
                    </td>
                    <td className="py-3 text-right font-semibold text-gray-900">{formatINR(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-56 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatINR(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Discount</span>
                  <span>-{formatINR(order.discount)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax</span>
                  <span>{formatINR(order.tax)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900 text-base">
                <span>Grand Total</span>
                <span>{formatINR(order.grandTotal)}</span>
              </div>
              <p className="text-xs text-gray-400 text-right">{order.currency || "INR"}</p>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Cancellation notice */}
          {order.status === "cancelled" && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm font-semibold text-red-800">Order Cancelled</p>
              <p className="text-xs text-red-600 mt-0.5">Reason: {order.cancelReason}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-100 pt-6 text-center">
            <p className="text-sm font-semibold text-gray-800">Thank you for your purchase!</p>
            <p className="text-xs text-gray-400 mt-1">QuickBill · Stationery & Electronics · Generated on {new Date().toLocaleDateString("en-IN")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
