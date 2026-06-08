import { Edit, Trash2 } from 'lucide-react';
import { getLangField } from '@/utils/helpers';
import { formatDate } from '@/utils/dateUtils';

const ContentTable = ({ items = [], onEdit, onDelete, language = 'te' }) => (
  <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
    <table className="min-w-full text-left text-sm">
      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
        <tr><th className="p-3">Date</th><th className="p-3">Title</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-t">
            <td className="p-3 font-mono text-xs">{formatDate(item.date || item.publishedAt || item.createdAt)}</td>
            <td className="p-3 font-semibold">{getLangField(item, 'title', language) || getLangField(item, 'name', language)}</td>
            <td className="p-3">{item.category || item.type || '-'}</td>
            <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.isPublished || item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{item.isPublished || item.isActive ? 'Live' : 'Draft'}</span></td>
            <td className="p-3 text-right"><button onClick={() => onEdit(item)} className="mr-2 text-blue-600"><Edit size={17} /></button><button onClick={() => onDelete(item.id)} className="text-red-600"><Trash2 size={17} /></button></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ContentTable;
