'use client';
import AdminLayout from '../../../components/AdminLayout';
export default function AiTasksPage(){return <AdminLayout title="Scheduled AI Tasks" subtitle="Safe task planning foundation"><div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-gray-600">Task foundation endpoints are available under <code>/api/v1/admin/ai/tasks</code>. Manual run-now creates a waiting-approval task run only.</p><p className="mt-2 font-semibold text-amber-700">No auto-send or direct critical DB mutation in Phase 1.</p></div></AdminLayout>}
