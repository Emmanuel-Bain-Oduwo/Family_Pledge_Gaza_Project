'use client';
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, Clock3, XCircle, Receipt } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import DataTable, { Column } from '../../components/DataTable';
import { AdminPayment, AdminPaymentSummary, getPaymentPage, getPaymentSummary } from '../../lib/paymentsApi';
import { formatDate, formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

const EMPTY_SUMMARY:AdminPaymentSummary={total:0,this_month:0,succeeded:0,pending:0,failed:0,cancelled:0,expired:0,settled_kes:0};

function PaymentStatus({status}:{status:AdminPayment['status']}){
  const classes=status==='succeeded'?'bg-green-100 text-green-700':status==='pending'||status==='created'||status==='initiating'?'bg-blue-100 text-blue-700':status==='cancelled'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700';
  const label=status==='succeeded'?'Paid':status==='created'||status==='initiating'||status==='pending'?'Processing':status.replace(/_/g,' ');
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${classes}`}>{label}</span>;
}

export default function ContributionsPage() {
  const [payments,setPayments]=useState<AdminPayment[]>([]);
  const [summary,setSummary]=useState<AdminPaymentSummary>(EMPTY_SUMMARY);
  const [loading,setLoading]=useState(true);
  const [filterStatus,setFilterStatus]=useState('');
  const [page,setPage]=useState(1);
  const [size,setSize]=useState(50);
  const [pages,setPages]=useState(1);
  const [total,setTotal]=useState(0);

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const [result,counts]=await Promise.all([
        getPaymentPage({page,size,status:filterStatus||undefined}),
        getPaymentSummary(),
      ]);
      setPayments(result.items||[]);
      setTotal(result.total);
      setPages(result.pages);
      setSummary(counts);
      if(page>result.pages)setPage(result.pages);
    }catch(error){toast.error(error instanceof Error?error.message:'Could not load payments.');}
    finally{setLoading(false);}
  },[filterStatus,page,size]);

  useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),20_000);return()=>window.clearInterval(timer);},[load]);
  const setStatus=(value:string)=>{setFilterStatus(value);setPage(1);};

  const columns:Column<AdminPayment>[]=[
    {key:'donor_name',header:'Donor',render:(p)=><div><div className="font-semibold text-gray-900">{p.donor_name}</div><div className="text-xs text-gray-400">{p.donor_phone||p.payer_phone}</div></div>},
    {key:'requested_amount',header:'Pledge',render:(p)=><span className="font-bold">{formatCurrency(p.requested_amount,p.requested_currency)}</span>},
    {key:'settlement_amount',header:'M-PESA Paid',render:(p)=>p.settlement_amount!=null?<span className="font-semibold">{p.settlement_currency} {Number(p.settlement_amount).toLocaleString()}</span>:<span className="text-gray-400">—</span>},
    {key:'mpesa_receipt_number',header:'Receipt',render:(p)=><span className="font-mono text-xs">{p.mpesa_receipt_number||'—'}</span>},
    {key:'status',header:'Status',render:(p)=><PaymentStatus status={p.status}/>},
    {key:'contribution_month',header:'Month',render:(p)=><span className="text-sm">{p.contribution_month}</span>},
    {key:'paid_at',header:'Paid At',render:(p)=><span className="text-xs text-gray-600">{p.paid_at?formatDate(p.paid_at):'—'}</span>},
    {key:'provider_result_description',header:'Provider Detail',render:(p)=><span className="text-xs text-gray-500 line-clamp-2" title={p.provider_result_description||''}>{p.provider_result_description||'—'}</span>},
  ];

  const filters=[
    {value:'',label:`All (${summary.total})`},
    {value:'succeeded',label:`Paid (${summary.succeeded})`},
    {value:'pending',label:`Processing (${summary.pending})`},
    {value:'failed',label:`Failed (${summary.failed})`},
    {value:'cancelled',label:`Cancelled (${summary.cancelled})`},
    {value:'expired',label:`Expired (${summary.expired})`},
  ];

  return <AdminLayout title="Payments & Contributions" subtitle="Automatic M-PESA payment ledger — provider-confirmed payments require no screenshot review.">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-5">
      <Mini icon={CheckCircle2} label="Paid" value={summary.succeeded.toLocaleString()} />
      <Mini icon={Clock3} label="Processing" value={summary.pending.toLocaleString()} />
      <Mini icon={XCircle} label="Failed / Cancelled" value={(summary.failed+summary.cancelled+summary.expired).toLocaleString()} />
      <Mini icon={Receipt} label="M-PESA Settled" value={`KES ${Number(summary.settled_kes||0).toLocaleString()}`} />
    </div>
    <div className="flex flex-wrap gap-2 items-center mb-5">
      {filters.map((filter)=><button key={filter.value} onClick={()=>setStatus(filter.value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus===filter.value?'bg-primary text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{filter.label}</button>)}
      <button onClick={()=>void load()} disabled={loading} className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"><RefreshCw size={15} className={loading?'animate-spin':''}/>Refresh</button>
      <span className="w-full text-right text-xs text-gray-400">Provider-backed ledger · auto-refresh every 20 seconds</span>
    </div>
    <div className="card overflow-hidden">
      <DataTable columns={columns} data={payments} loading={loading}/>
      <div className="border-t bg-gray-50 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-gray-500">Showing {payments.length} of {total.toLocaleString()} matching payments · <select className="rounded border bg-white px-2 py-1" value={size} onChange={e=>{setSize(Number(e.target.value));setPage(1);}}><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select> rows</div>
        <div className="flex items-center gap-2"><button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="btn-secondary inline-flex items-center gap-1"><ChevronLeft size={14}/>Previous</button><span className="text-xs text-gray-500">{page}/{pages}</span><button disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))} className="btn-secondary inline-flex items-center gap-1">Next<ChevronRight size={14}/></button></div>
      </div>
    </div>
  </AdminLayout>;
}

function Mini({icon:Icon,label,value}:{icon:any;label:string;value:string}){return <div className="card p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-xl font-black text-gray-900">{value}</div><div className="mt-1 text-xs font-semibold text-gray-500">{label}</div></div><Icon size={18} className="text-primary"/></div></div>;}
