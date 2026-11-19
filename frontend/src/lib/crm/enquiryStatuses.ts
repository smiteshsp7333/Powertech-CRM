export interface EnquiryStatusMeta {
  key: string;
  label: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
}

export const ENQUIRY_STATUSES: EnquiryStatusMeta[] = [
  {
    key: 'NEW_ENQUIRY',
    label: 'New Enquiry',
    badgeBg: 'bg-blue-500/15',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-500/30',
  },
  {
    key: 'CONTACTED',
    label: 'Contacted',
    badgeBg: 'bg-cyan-500/15',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-500/30',
  },
  {
    key: 'FOLLOW_UP_REQUIRED',
    label: 'Follow-up Required',
    badgeBg: 'bg-amber-500/15',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-500/30',
  },
  {
    key: 'SITE_VISIT_SAMPLE',
    label: 'Site Visit / Sample Discussion',
    badgeBg: 'bg-indigo-500/15',
    textColor: 'text-indigo-300',
    borderColor: 'border-indigo-500/30',
  },
  {
    key: 'QUOTATION_PREPARED',
    label: 'Quotation Prepared',
    badgeBg: 'bg-purple-500/15',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-500/30',
  },
  {
    key: 'QUOTATION_SENT',
    label: 'Quotation Sent',
    badgeBg: 'bg-violet-500/15',
    textColor: 'text-violet-300',
    borderColor: 'border-violet-500/30',
  },
  {
    key: 'NEGOTIATION',
    label: 'Negotiation',
    badgeBg: 'bg-orange-500/15',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-500/30',
  },
  {
    key: 'ORDER_CONFIRMED',
    label: 'Order Confirmed',
    badgeBg: 'bg-emerald-500/15',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/30',
  },
  {
    key: 'LOST',
    label: 'Lost',
    badgeBg: 'bg-rose-500/15',
    textColor: 'text-rose-300',
    borderColor: 'border-rose-500/30',
  },
  {
    key: 'ON_HOLD',
    label: 'On Hold',
    badgeBg: 'bg-slate-700/40',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-600/40',
  },
];

export function getStatusMeta(status: string): EnquiryStatusMeta {
  const normalized =
    status === 'OPEN'
      ? 'NEW_ENQUIRY'
      : status === 'ORDER_PLACED'
      ? 'ORDER_CONFIRMED'
      : status === 'CLOSED_LOST' || status === 'CANCELLED'
      ? 'LOST'
      : status;

  return ENQUIRY_STATUSES.find((s) => s.key === normalized) || {
    key: status,
    label: status.replace(/_/g, ' '),
    badgeBg: 'bg-slate-800',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-700',
  };
}
