'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity, BellRing, Bot, CheckCircle2, Clock3, CreditCard, Mail, MessageCircle,
  RefreshCw, Send, Sparkles, Users, AlertTriangle, CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import {
  CommandCenter, CommunicationChannel, CommunicationPreview, DonorSegment, FollowupCase,
  OutboundCampaign, getCommandCenter, getFollowups, listCommunications, previewCommunication,
  queueCommunication, runCommunication, syncFollowups, updateFollowup,
} from '../../lib/operationsApi';

const SEGMENTS: Array<{key:DonorSegment;label:string;hint:string}> = [
  { key:'all_donors', label:'All donors', hint:'Every active donor account' },
  { key:'active_pledges', label:'Active pledges', hint:'Currently active pledge members' },
  { key:'missing_this_month', label:'Missing this month', hint:'Active pledge, no confirmed or pending contribution' },
  { key:'pending_review', label:'Pending review', hint:'Submitted or follow-up contribution this month' },
  { key:'confirmed_this_month', label:'Confirmed this month', hint:'At least one confirmed contribution this month' },
  { key:'inactive_30_days', label:'Inactive 30+ days', hint:'No recent contribution activity' },
  { key:'new_this_month', label:'New this month', hint:'Recently joined donors' },
  { key:'collectors', label:'Collectors', hint:'Donors who also coordinate groups' },
];

export default function OperationsPage() {
  const [stats,setStats]=useState<CommandCenter|null>(null);
  const [followups,setFollowups]=useState<FollowupCase[]>([]);
  const [campaigns,setCampaigns]=useState<OutboundCampaign[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState<string|null>(null);
  const [form,setForm]=useState({title:'',body:'',segment:'missing_this_month' as DonorSegment,channels:['app'] as CommunicationChannel[],content_category:'pledge',scheduled_for:''});
  const [preview,setPreview]=useState<CommunicationPreview|null>(null);

  const load=async()=>{setLoading(true);try{const [s,f,c]=await Promise.all([getCommandCenter(),getFollowups(),listCommunications()]);setStats(s);setFollowups(f);setCampaigns(c);}catch(e){toast.error(e instanceof Error?e.message:'Could not load operations');}finally{setLoading(false);}};
  useEffect(()=>{void load();},[]);
  useEffect(()=>{previewCommunication(form.segment,form.content_category).then(setPreview).catch(()=>setPreview(null));},[form.segment,form.content_category]);

  const toggleChannel=(channel:CommunicationChannel)=>setForm((v)=>({...v,channels:v.channels.includes(channel)?v.channels.filter((c)=>c!==channel):[...v.channels,channel]}));
  const submit=async()=>{if(!form.title.trim()||!form.body.trim()||!form.channels.length){toast.error('Add a title, message and at least one channel.');return;}setBusy('send');try{const queued=await queueCommunication({title:form.title.trim(),body:form.body.trim(),segment:form.segment,channels:form.channels,content_category:form.content_category,scheduled_for:form.scheduled_for?new Date(form.scheduled_for).toISOString():null});setCampaigns((v)=>[queued,...v]);toast.success(queued.scheduled_for?'Communication scheduled.':'Communication queued for delivery.');setForm((v)=>({...v,title:'',body:'',scheduled_for:''}));await load();}catch(e){toast.error(e instanceof Error?e.message:'Could not queue communication');}finally{setBusy(null);}};
  const sync=async()=>{setBusy('sync');try{const r=await syncFollowups();toast.success(`${r.created} new follow-up case${r.created===1?'':'s'} added.`);await load();}catch(e){toast.error(e instanceof Error?e.message:'Could not sync follow-ups');}finally{setBusy(null);}};
  const followupAction=async(id:string,action:'mark_contacted'|'resolve'|'dismiss')=>{setBusy(id);try{await updateFollowup(id,{action,channel:action==='mark_contacted'?'app':undefined});await load();}catch(e){toast.error(e instanceof Error?e.message:'Could not update follow-up');}finally{setBusy(null);}};
  const runNow=async(c:OutboundCampaign)=>{setBusy(c.id);try{const updated=await runCommunication(c.id);setCampaigns((v)=>v.map((x)=>x.id===updated.id?updated:x));toast.success('Delivery batch processed.');await load();}catch(e){toast.error(e instanceof Error?e.message:'Could not process communication');}finally{setBusy(null);}};

  const attention=useMemo(()=>stats?[stats.pending_review,stats.needs_follow_up,stats.missing_this_month,stats.due_followups_today].reduce((a,b)=>a+b,0):0,[stats]);
  const cards=stats?[
    {label:'Donors',value:stats.total_donors,icon:Users,href:'/donors?segment=all_donors'},
    {label:'Need attention',value:attention,icon:AlertTriangle,href:'/donors?segment=missing_this_month'},
    {label:'Pending contribution review',value:stats.pending_review,icon:CreditCard,href:'/contributions?status=submitted'},
    {label:'Missing this month',value:stats.missing_this_month,icon:Clock3,href:'/donors?segment=missing_this_month'},
    {label:'Confirmed this month',value:stats.confirmed_this_month,icon:CheckCircle2,href:'/donors?segment=confirmed_this_month'},
    {label:'Inactive 30+ days',value:stats.inactive_30_days,icon:Activity,href:'/donors?segment=inactive_30_days'},
    {label:'Open follow-ups',value:stats.open_followup_cases,icon:BellRing,href:'#followups'},
    {label:'AI outputs waiting',value:stats.ai_outputs_waiting,icon:Bot,href:'/ai/tasks'},
  ]:[];

  return <AdminLayout title="Operations Command Center" subtitle="Manage donors, follow-ups, communications and today’s Family Pledge workload from one place.">
    {loading&&!stats?<div className="card p-10 text-center text-gray-400">Loading live operations…</div>:<>
      <div className="mb-6 rounded-2xl bg-[#101827] p-5 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><div className="text-xs font-bold uppercase tracking-[.2em] text-white/50">Today</div><h2 className="mt-1 text-2xl font-black">{attention.toLocaleString()} items may need admin attention</h2><p className="mt-1 text-sm text-white/65">Prioritize submitted contributions, follow-ups and active pledges missing this month’s contribution.</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/ai/chat" className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-gray-900 inline-flex items-center gap-2"><Sparkles size={16}/>Ask AI for today’s briefing</Link><button onClick={()=>void load()} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white inline-flex items-center gap-2"><RefreshCw size={15}/>Refresh</button></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">{cards.map(({label,value,icon:Icon,href})=><Link key={label} href={href} className="card p-4 hover:border-primary transition-colors"><div className="flex items-start justify-between"><div><div className="text-2xl font-black text-gray-900">{value.toLocaleString()}</div><div className="mt-1 text-xs font-semibold text-gray-500">{label}</div></div><div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Icon size={18}/></div></div></Link>)}</div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="font-black text-gray-900">Donor segments</h2><p className="text-sm text-gray-500">Open a focused list instead of searching through 2,000+ accounts manually.</p></div><Link href="/donors" className="btn-secondary">Open donor manager</Link></div>
          <div className="grid sm:grid-cols-2 gap-2">{SEGMENTS.map(s=><Link href={`/donors?segment=${s.key}`} key={s.key} className="rounded-xl border border-gray-200 p-3 hover:bg-gray-50"><div className="flex items-center justify-between gap-3"><div><div className="font-semibold text-sm text-gray-900">{s.label}</div><div className="text-xs text-gray-400 mt-0.5">{s.hint}</div></div><div className="text-lg font-black text-primary">{stats?.segment_counts?.[s.key]?.toLocaleString()??'—'}</div></div></Link>)}</div>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between mb-4"><div><h2 className="font-black text-gray-900">AI workbench</h2><p className="text-sm text-gray-500">AI can read approved aggregate operations context and prepare work for human review.</p></div><Bot className="text-primary"/></div>
          <div className="space-y-2"><Link href="/ai/chat" className="block rounded-xl border p-3 text-sm font-semibold hover:bg-gray-50">Ask what needs attention today</Link><Link href="/ai-assistant" className="block rounded-xl border p-3 text-sm font-semibold hover:bg-gray-50">Draft Quran / Hadith / Dua / campaign / impact content</Link><Link href="/ai/tasks" className="block rounded-xl border p-3 text-sm font-semibold hover:bg-gray-50">Schedule recurring admin preparation</Link></div>
        </section>
      </div>

      <section className="card p-5 mt-6" id="followups">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4"><div><h2 className="font-black text-gray-900">Follow-up queue</h2><p className="text-sm text-gray-500">Persistent cases created from pledge and contribution signals. Nothing is sent automatically.</p></div><button onClick={()=>void sync()} disabled={busy==='sync'} className="btn-secondary inline-flex items-center gap-2"><RefreshCw size={15} className={busy==='sync'?'animate-spin':''}/>Refresh follow-up cases</button></div>
        <div className="space-y-2 max-h-[480px] overflow-y-auto">{followups.slice(0,60).map(f=><div key={f.id} className="rounded-xl border border-gray-200 p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase ${f.priority==='urgent'?'bg-red-100 text-red-700':f.priority==='high'?'bg-amber-100 text-amber-700':'bg-gray-100 text-gray-600'}`}>{f.priority}</span><span className="font-semibold text-gray-900">{f.donor_name||'Operational case'}</span><span className="text-xs text-gray-400">{f.type.replace(/_/g,' ')}</span></div><p className="mt-2 text-sm text-gray-600">{f.reason}</p><p className="mt-2 rounded-lg bg-gray-50 p-2 text-xs text-gray-500">Suggested: {f.suggested_message}</p></div><div className="flex flex-wrap gap-1.5 flex-shrink-0"><button disabled={busy===f.id} onClick={()=>void followupAction(f.id,'mark_contacted')} className="btn-secondary text-xs">Mark contacted</button><button disabled={busy===f.id} onClick={()=>void followupAction(f.id,'resolve')} className="btn-primary text-xs">Resolve</button><button disabled={busy===f.id} onClick={()=>void followupAction(f.id,'dismiss')} className="btn-ghost text-xs">Dismiss</button></div></div></div>)}{!followups.length&&<div className="py-10 text-center text-gray-400">No open follow-up cases.</div>}</div>
      </section>

      <section className="card p-5 mt-6">
        <div className="mb-5"><h2 className="font-black text-gray-900">Consent-aware reminder campaign</h2><p className="text-sm text-gray-500">Draft once, choose a donor segment and approved channels. Email and WhatsApp are only queued for users who opted in.</p></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3"><div><label className="label">Audience</label><select className="input" value={form.segment} onChange={e=>setForm({...form,segment:e.target.value as DonorSegment})}>{SEGMENTS.map(s=><option value={s.key} key={s.key}>{s.label}</option>)}</select></div><div><label className="label">Category</label><select className="input" value={form.content_category} onChange={e=>setForm({...form,content_category:e.target.value})}><option value="pledge">Pledge reminder</option><option value="campaign">Campaign update</option><option value="impact">Impact update</option><option value="humanitarian">Humanitarian assistance</option><option value="quran">Quran reminder</option><option value="hadith">Hadith reminder</option><option value="dua">Du&apos;a reminder</option><option value="motivation">Motivation</option><option value="emergency">Emergency appeal</option></select></div><div className="grid grid-cols-3 gap-2">{(['app','email','whatsapp'] as CommunicationChannel[]).map(channel=><button type="button" onClick={()=>toggleChannel(channel)} key={channel} className={`rounded-xl border px-3 py-3 text-sm font-bold capitalize ${form.channels.includes(channel)?'border-primary bg-primary/10 text-primary-dark':'border-gray-200 text-gray-500'}`}>{channel==='app'?<BellRing size={16} className="mx-auto mb-1"/>:channel==='email'?<Mail size={16} className="mx-auto mb-1"/>:<MessageCircle size={16} className="mx-auto mb-1"/>}{channel}</button>)}</div><div><label className="label">Send later (optional)</label><input type="datetime-local" className="input" value={form.scheduled_for} onChange={e=>setForm({...form,scheduled_for:e.target.value})}/></div></div>
          <div className="space-y-3"><div><label className="label">Title</label><input className="input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Gentle monthly Family Pledge reminder"/></div><div><label className="label">Message</label><textarea rows={6} className="input" value={form.body} onChange={e=>setForm({...form,body:e.target.value})} placeholder="Write or paste the admin-approved message here…"/></div>{preview&&<div className="grid grid-cols-4 gap-2 rounded-xl bg-gray-50 p-3 text-center"><Mini label="Segment" value={preview.total_users}/><Mini label="App" value={preview.app_eligible}/><Mini label="Email" value={preview.email_eligible}/><Mini label="WhatsApp" value={preview.whatsapp_eligible}/></div>}<div className="flex gap-2"><button onClick={()=>void submit()} disabled={busy==='send'} className="btn-primary flex-1 inline-flex justify-center items-center gap-2"><Send size={15}/>{form.scheduled_for?'Schedule':'Queue reminder'}</button><Link href="/ai/chat" className="btn-secondary inline-flex items-center gap-2"><Sparkles size={15}/>Draft with AI</Link></div></div>
        </div>
      </section>

      <section className="card p-5 mt-6"><div className="flex items-center gap-2 mb-4"><CalendarDays size={18} className="text-primary"/><h2 className="font-black text-gray-900">Communication history</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-left text-xs uppercase text-gray-400"><th className="py-2">Message</th><th>Segment</th><th>Channels</th><th>Status</th><th>Delivery</th><th></th></tr></thead><tbody>{campaigns.slice(0,30).map(c=><tr key={c.id} className="border-b"><td className="py-3"><div className="font-semibold">{c.title}</div><div className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</div></td><td>{c.segment.replace(/_/g,' ')}</td><td>{c.channels.join(', ')}</td><td className="capitalize">{c.status}</td><td>{c.sent_count}/{c.recipient_count}{c.failed_count?` · ${c.failed_count} failed`:''}</td><td><button onClick={()=>void runNow(c)} disabled={busy===c.id||c.status==='completed'} className="btn-ghost text-xs">Process batch</button></td></tr>)}</tbody></table>{!campaigns.length&&<div className="py-8 text-center text-gray-400">No communication campaigns yet.</div>}</div></section>
    </>}
  </AdminLayout>;
}

function Mini({label,value}:{label:string;value:number}){return <div><div className="text-lg font-black text-gray-900">{value.toLocaleString()}</div><div className="text-[10px] font-semibold uppercase text-gray-400">{label}</div></div>}
