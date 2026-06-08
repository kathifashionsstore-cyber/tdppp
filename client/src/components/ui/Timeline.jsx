import { formatDate } from '@/utils/dateUtils';

const Timeline = ({ items = [] }) => (
  <div className="space-y-5">
    {items.map((item, index) => (
      <div key={item.id || index} className="relative border-l-4 border-tdp-yellow pl-5">
        <span className="absolute -left-2 top-1 h-3 w-3 rounded-full bg-tdp-red" />
        <p className="text-xs font-bold uppercase text-tdp-red">{item.date ? formatDate(item.date) : item.year}</p>
        <h3 className="text-lg font-bold text-gray-950">{item.title}</h3>
        <p className="text-sm text-gray-600">{item.description}</p>
      </div>
    ))}
  </div>
);

export default Timeline;
