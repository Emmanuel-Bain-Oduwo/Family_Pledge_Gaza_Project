'use client';
import Link from 'next/link';
import { Bot, FileText, MessageSquare, CalendarClock } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';

const cards = [
  { href: '/ai/content', title: 'Content Studio', body: 'Draft reminder posts and donor messages. AI suggestion — requires admin approval.', icon: FileText },
  { href: '/ai/follow-ups', title: 'Follow-ups', body: 'Review donor/contribution follow-up suggestions. Not sent yet.', icon: MessageSquare },
  { href: '/ai/tasks', title: 'Scheduled AI Tasks', body: 'Create safe task plans for admin-approved recurring drafts.', icon: CalendarClock },
];

export default function AiDashboardPage() {
  return <AdminLayout title="AI Assistant" subtitle="Suggest-only operations assistant — admin approval required">
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <strong>Safety mode:</strong> AI can draft and suggest only. It does not auto-send messages or directly modify contribution, donor, or campaign records.
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map(({ href, title, body, icon: Icon }) => <Link key={href} href={href} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
        <Icon className="mb-4 text-primary" size={28} />
        <h2 className="font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{body}</p>
      </Link>)}
    </div>
    <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 font-bold text-gray-900"><Bot size={18} /> Phase 1 guardrails</div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
        <li>Admin reviews every draft before use.</li><li>Notifications, WhatsApp, SMS, and push messages are not auto-sent.</li><li>Audit logs record admin AI actions.</li>
      </ul>
    </div>
  </AdminLayout>;
}
