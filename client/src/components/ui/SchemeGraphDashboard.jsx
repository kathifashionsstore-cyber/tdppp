import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Download, HandHeart, MapPin, WalletCards } from 'lucide-react';
import { getStoredSchemeData, parseDistrictCsv, SCHEME_STORAGE_KEY, schemeDefinitions } from '@/utils/schemeData';

const colors = ['#e8821a', '#ec4899', '#38bdf8', '#22c55e', '#8b5cf6', '#f97316'];
const formatLakhs = (value) => `${Math.round((Number(value) || 0) / 100000)}L`;
const formatCrores = (value) => `₹${Math.round(Number(value) || 0)} Cr`;

const SchemeGraphDashboard = () => {
  const [data, setData] = useState(getStoredSchemeData);

  useEffect(() => {
    const load = () => setData(getStoredSchemeData());
    const interval = window.setInterval(load, 30000);
    const onStorage = (event) => {
      if (!event.key || event.key === SCHEME_STORAGE_KEY) load();
    };
    const onCustom = (event) => setData(event.detail || getStoredSchemeData());
    window.addEventListener('storage', onStorage);
    window.addEventListener('tdp-scheme-data-updated', onCustom);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('tdp-scheme-data-updated', onCustom);
    };
  }, []);

  const chartData = useMemo(() => {
    const s = data.schemes || {};
    return {
      budget: schemeDefinitions.slice(0, 6).map((def) => {
        const item = s[def.key] || {};
        const released = item.releasedCrores || item.budgetUsedCrores || item.monthlyDisbursementCrores || 0;
        return { name: def.shortTe, budget: Number(item.budgetCrores || released * 1.35 || 100), released: Number(released) };
      }),
      beneficiaries: [
        { name: 'రైతులు', value: s.annadata?.registeredFarmers || 0 },
        { name: 'మహిళలు', value: (s.aadabidda?.womenEnrolled || 0) + (s.freeBus?.womenBenefited || 0) },
        { name: 'విద్యార్థులు', value: s.thallikiVandanam?.beneficiaries || 0 },
        { name: 'యువత', value: s.nirudyoga?.youthRegistered || 0 },
        { name: 'పెన్షనర్లు', value: s.ntrPension?.totalPensioners || 0 },
        { name: 'క్యాంటీన్', value: (s.annaCanteen?.dailyMeals || 0) * 30 }
      ],
      districts: parseDistrictCsv(s.thallikiVandanam?.districtCsv).sort((a, b) => b.value - a.value).slice(0, 8),
      timeline: (data.monthlyTimeline?.labels || []).map((label, index) => ({
        month: label,
        thalliki: data.monthlyTimeline?.thalliki?.[index] || 0,
        annadata: data.monthlyTimeline?.annadata?.[index] || 0,
        nirudyoga: data.monthlyTimeline?.nirudyoga?.[index] || 0,
        aadabidda: data.monthlyTimeline?.aadabidda?.[index] || 0
      }))
    };
  }, [data]);

  const totals = useMemo(() => {
    const s = data.schemes || {};
    const beneficiaries = Object.values(s).reduce((sum, item) => sum + Number(item.beneficiaries || item.registeredFarmers || item.familiesBenefited || item.womenEnrolled || item.womenBenefited || item.youthRegistered || item.totalPensioners || item.dailyMeals || 0), 0);
    const released = Object.values(s).reduce((sum, item) => sum + Number(item.releasedCrores || item.budgetUsedCrores || item.monthlyDisbursementCrores || item.monthlyOutflowCrores || item.budgetPerMonthCrores || 0), 0);
    const active = Object.values(s).filter((item) => item.status === 'active').length;
    return { beneficiaries, released, active };
  }, [data]);

  const downloadCsv = () => {
    const rows = [['Month', 'Thalliki', 'Annadata', 'Nirudyoga', 'Aadabidda'], ...chartData.timeline.map((row) => [row.month, row.thalliki, row.annadata, row.nirudyoga, row.aadabidda])];
    const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'tdp-scheme-progress.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <section id="graphs" className="scroll-mt-24 bg-white py-14 md:py-20">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <span id="super6" className="block scroll-mt-24" />
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-yellow-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-tdp-red">
            <span>Super 6 Progress</span>
          </div>
          <h2 className="telugu text-3xl font-black text-tdp-navy md:text-4xl">సూపర్ 6 - మన హామీలు మన విజయాలు</h2>
          <p className="mt-2 text-base font-black text-slate-700">Super 6 - Our Promises, Our Achievements</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">Real-time scheme implementation data updated from the admin panel</p>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-tdp-yellow" />
          <p className="mt-3 text-xs text-slate-400">Last updated: {new Date(data.lastUpdated).toLocaleString()}</p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <ChartCard title="సూపర్ 6 - బడ్జెట్ vs విడుదల" subtitle="Budget and released amount">
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={chartData.budget} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid strokeDasharray="4 4" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `₹${value}`} />
                <YAxis dataKey="name" type="category" width={72} />
                <Tooltip formatter={(value) => formatCrores(value)} />
                <Legend />
                <Bar dataKey="budget" name="Budget" fill="#0d1457" radius={[0, 8, 8, 0]} />
                <Bar dataKey="released" name="Released" fill="#e8821a" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="లబ్ధిదారుల వర్గీకరణ" subtitle="Beneficiary categories">
            <ResponsiveContainer width="100%" height={310}>
              <PieChart>
                <Pie data={chartData.beneficiaries} dataKey="value" nameKey="name" innerRadius={70} outerRadius={112} paddingAngle={3}>
                  {chartData.beneficiaries.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatLakhs(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="జిల్లాల వారీ అమలు" subtitle="Top Thalliki Vandanam districts">
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={chartData.districts}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatLakhs} />
                <Tooltip formatter={(value) => formatLakhs(value)} />
                <Bar dataKey="value" fill="#0d1457" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="నెల వారీ పురోగతి"
            subtitle="Monthly progress in lakhs"
            action={<button onClick={downloadCsv} className="inline-flex items-center gap-1 rounded-full bg-tdp-yellow px-3 py-1 text-xs font-black text-tdp-navy"><Download size={14} /> CSV</button>}
          >
            <ResponsiveContainer width="100%" height={310}>
              <AreaChart data={chartData.timeline}>
                <CartesianGrid strokeDasharray="4 4" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="thalliki" name="తల్లికి" stroke="#e8821a" fill="#e8821a33" strokeWidth={3} />
                <Area type="monotone" dataKey="annadata" name="అన్నదాత" stroke="#0d1457" fill="#0d145733" strokeWidth={3} />
                <Area type="monotone" dataKey="nirudyoga" name="యువత" stroke="#22c55e" fill="#22c55e33" strokeWidth={3} />
                <Area type="monotone" dataKey="aadabidda" name="ఆడబిడ్డ" stroke="#ec4899" fill="#ec489933" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Stat icon={HandHeart} label="మొత్తం లబ్ధిదారులు" value={formatLakhs(totals.beneficiaries)} />
          <Stat icon={WalletCards} label="బడ్జెట్ విడుదల" value={formatCrores(totals.released)} />
          <Stat icon={MapPin} label="జిల్లాలు కవర్" value="26/26" />
          <Stat icon={HandHeart} label="అమలులో పథకాలు" value={`${totals.active}/8`} />
        </div>
      </div>
    </section>
  );
};

const ChartCard = ({ title, subtitle, children, action }) => (
  <article className="rounded-lg border border-slate-100 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.10)]">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="telugu text-lg font-black text-tdp-navy">{title}</h3>
        <p className="text-xs font-semibold text-slate-500">{subtitle}</p>
      </div>
      {action}
    </div>
    {children}
  </article>
);

const Stat = ({ icon: Icon, label, value }) => (
  <div className="rounded-lg bg-tdp-navy p-5 text-center text-white shadow-lg">
    <Icon className="mx-auto text-tdp-yellow" size={24} />
    <p className="mt-2 text-2xl font-black text-tdp-yellow">{value}</p>
    <p className="telugu text-sm font-bold text-white/80">{label}</p>
  </div>
);

export default SchemeGraphDashboard;
