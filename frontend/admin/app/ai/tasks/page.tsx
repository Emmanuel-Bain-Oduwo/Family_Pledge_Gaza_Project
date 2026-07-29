'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { createFamilyPledgeAiTask, getFamilyPledgeAiTasks, runFamilyPledgeAiTask, type FamilyPledgeAiTask } from '../../../lib/api';

export default function TasksPage() {
  const [tasks,setTasks]=useState<FamilyPledgeAiTask[]>([]);
  const [form,setForm]=useState({title:'',instruction:'',schedule_type:'daily'});
  const load=()=>getFamilyPledgeAiTasks().then(setTasks);
  useEffect(()=>{void load();},[]);
  const create=async(e:React.FormEvent)=>{e.preventDefault(); await createFamilyPledgeAiTask({...form,task_type:'custom_admin_task',timezone:'UTC',requires_approval:true,status:'active'}); setForm({title:'',instruction:'',schedule_type:'daily'}); await load();};
  return <AdminLayout title="Family Pledge AI Scheduled Tasks" subtitle="Prepare recurring reviewable work automatically. Sending and publishing still require admin approval.">
    <form onSubmit={create} className="card p-5 grid md:grid-cols-3 gap-3 mb-5"><input required className="input" placeholder="Task title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><select className="input" value={form.schedule_type} onChange={e=>setForm({...form,schedule_type:e.target.value})}><option value="daily">Daily</option><option value="weekly">Weekly</option></select><input required className="input md:col-span-2" placeholder="What should Family Pledge AI prepare?" value={form.instruction} onChange={e=>setForm({...form,instruction:e.target.value})}/><button className="btn-primary">Schedule task</button></form>
    <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="p-3">Task</th><th>Schedule</th><th>Next run</th><th>Action</th></tr></thead><tbody>{tasks.map(t=><tr className="border-b" key={t.id}><td className="p-3"><b>{t.title}</b><div className="text-gray-500">{t.instruction}</div></td><td>{t.schedule_type||'Manual'}</td><td>{t.next_run_at?new Date(t.next_run_at).toLocaleString():'Not scheduled'}</td><td><button className="btn-secondary" onClick={async()=>{await runFamilyPledgeAiTask(t.id);await load();}}>Run now</button></td></tr>)}</tbody></table>{!tasks.length&&<p className="p-6 text-center text-gray-500">No scheduled tasks yet.</p>}</div>
  </AdminLayout>;
}
