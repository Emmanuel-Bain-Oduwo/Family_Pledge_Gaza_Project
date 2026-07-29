'use client';
import { useEffect, useState } from 'react';
import { Database, File, RefreshCw } from 'lucide-react';
import LoadingState from '../../components/LoadingState';
import { getStorageUsage, type StorageUsage } from '../../lib/api';

function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function StoragePage() {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true); setError('');
    try { setUsage(await getStorageUsage()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load storage usage.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  if (loading && !usage) return <LoadingState />;

  return <div className="space-y-6">
    <div className="flex items-start justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-gray-900">Storage Usage</h1><p className="mt-1 text-sm text-gray-500">Cloudflare R2 upload metadata tracked by the application.</p></div>
      <button className="btn-secondary flex items-center gap-2" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Refresh</button>
    </div>
    {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {usage && <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card flex items-center gap-4"><Database className="text-primary" /><div><p className="text-sm text-gray-500">Total storage</p><p className="text-2xl font-bold">{formatBytes(usage.total_bytes)}</p></div></div>
        <div className="card flex items-center gap-4"><File className="text-primary" /><div><p className="text-sm text-gray-500">Uploaded files</p><p className="text-2xl font-bold">{usage.total_files.toLocaleString()}</p></div></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card"><h2 className="font-bold">Usage by folder</h2><div className="mt-4 divide-y">{Object.entries(usage.files_by_folder).map(([folder, count]) => <div key={folder} className="flex justify-between py-3 text-sm"><span className="capitalize">{folder.replaceAll('_', ' ')}</span><span className="text-gray-500">{count} files · {formatBytes(usage.bytes_by_folder[folder] || 0)}</span></div>)}</div></section>
        <section className="card"><h2 className="font-bold">Usage by file type</h2><div className="mt-4 max-h-72 divide-y overflow-auto">{Object.entries(usage.files_by_content_type).map(([type, count]) => <div key={type} className="flex justify-between gap-3 py-3 text-sm"><span className="truncate">{type}</span><span className="whitespace-nowrap text-gray-500">{count} · {formatBytes(usage.bytes_by_content_type[type] || 0)}</span></div>)}</div></section>
      </div>
      <section className="card overflow-hidden"><h2 className="font-bold">Latest uploads</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-gray-500"><tr><th className="pb-3">File</th><th>Folder</th><th>Size</th><th>Uploaded</th></tr></thead><tbody className="divide-y">{usage.latest_uploads.map((asset) => <tr key={asset.id}><td className="py-3 pr-4">{asset.public_url ? <a className="text-primary hover:underline" href={asset.public_url} target="_blank" rel="noreferrer">{asset.original_filename || asset.object_key}</a> : asset.original_filename || asset.object_key}</td><td>{asset.folder}</td><td>{formatBytes(asset.size_bytes)}</td><td>{asset.uploaded_at ? new Date(asset.uploaded_at).toLocaleString() : '—'}</td></tr>)}</tbody></table></div></section>
      <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">Application totals are for operational monitoring. The Cloudflare dashboard remains the final source of truth for billable storage, requests, and bandwidth.</p>
    </>}
  </div>;
}
