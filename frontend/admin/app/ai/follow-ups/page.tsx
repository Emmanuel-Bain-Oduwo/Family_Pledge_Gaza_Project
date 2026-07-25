'use client';
import AdminLayout from '../../../components/AdminLayout';
export default function AiFollowupsPage(){return <AdminLayout title="AI Follow-ups" subtitle="Admin-reviewed donor follow-up suggestions"><div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-gray-600">Follow-up suggestions are available from <code>/api/v1/admin/ai/follow-ups</code> and include approve/dismiss workflow.</p><p className="mt-2 font-semibold text-amber-700">AI suggestion — requires admin approval. Not sent yet.</p></div></AdminLayout>}
