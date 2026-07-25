'use client';
import AdminLayout from '../../../components/AdminLayout';
export default function AiContentPage(){return <AdminLayout title="AI Content Studio" subtitle="AI suggestion — requires admin approval"><div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-gray-600">Use the existing AI Assistant draft tools for content generation. New backend endpoint: <code>/api/v1/admin/ai/content/draft</code>.</p><p className="mt-2 font-semibold text-amber-700">Not sent yet — admins must review and approve drafts.</p></div></AdminLayout>}
