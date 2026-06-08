export const SCHEME_STORAGE_KEY = 'tdp_scheme_data';
export const BANNER_STORAGE_KEY = 'tdp_festival_banners';

export const schemeDefinitions = [
  {
    key: 'thallikiVandanam',
    nameTe: 'తల్లికి వందనం',
    nameEn: 'Thalliki Vandanam',
    shortTe: 'తల్లికి',
    icon: 'GraduationCap',
    fields: [
      ['beneficiaries', 'Total Beneficiaries', 'number'],
      ['budgetCrores', 'Budget Allocated ₹ Crores', 'number'],
      ['releasedCrores', 'Amount Distributed ₹ Crores', 'number'],
      ['districtCsv', 'District-wise breakdown', 'textarea']
    ]
  },
  {
    key: 'annadata',
    nameTe: 'అన్నదాత సుఖీభవ',
    nameEn: 'Annadata Sukhibhava',
    shortTe: 'అన్నదాత',
    icon: 'Sprout',
    fields: [
      ['registeredFarmers', 'Registered Farmers Count', 'number'],
      ['releasedCrores', 'Amount Released ₹ Crores', 'number'],
      ['pendingCrores', 'Pending Amount ₹ Crores', 'number'],
      ['districtsCovered', 'Districts Covered', 'number']
    ]
  },
  {
    key: 'deepam2',
    nameTe: 'దీపం-2',
    nameEn: 'Deepam-2',
    shortTe: 'దీపం',
    icon: 'Flame',
    fields: [
      ['cylindersDistributed', 'Cylinders Distributed', 'number'],
      ['familiesBenefited', 'Families Benefited', 'number'],
      ['budgetUsedCrores', 'Budget Used ₹ Crores', 'number'],
      ['districtsCompleted', 'Districts Completed', 'number']
    ]
  },
  {
    key: 'aadabidda',
    nameTe: 'ఆడబిడ్డ నిధి',
    nameEn: 'Aadabidda Nidhi',
    shortTe: 'ఆడబిడ్డ',
    icon: 'HandCoins',
    fields: [
      ['womenEnrolled', 'Women Enrolled', 'number'],
      ['monthlyDisbursementCrores', 'Monthly Disbursement ₹ Crores', 'number'],
      ['releasedCrores', 'Total Released So Far ₹ Crores', 'number']
    ]
  },
  {
    key: 'freeBus',
    nameTe: 'స్త్రీ శక్తి',
    nameEn: 'Free Bus Travel',
    shortTe: 'బస్సు',
    icon: 'Bus',
    fields: [
      ['totalTrips', 'Total Trips Availed', 'number'],
      ['womenBenefited', 'Women Benefited', 'number'],
      ['dailyRidership', 'Daily Average Ridership', 'number'],
      ['routesCovered', 'Routes Covered', 'number']
    ]
  },
  {
    key: 'nirudyoga',
    nameTe: 'నిరుద్యోగ భృతి',
    nameEn: 'Nirudyoga Bruthi',
    shortTe: 'యువత',
    icon: 'UsersRound',
    fields: [
      ['youthRegistered', 'Youth Registered', 'number'],
      ['releasedCrores', 'Amount Released ₹ Crores', 'number'],
      ['applicationsPending', 'Applications Pending', 'number'],
      ['monthlyBeneficiaries', 'Monthly Beneficiaries', 'number']
    ]
  },
  {
    key: 'ntrPension',
    nameTe: 'NTR భరోసా పెన్షన్',
    nameEn: 'NTR Bharosa Pension',
    shortTe: 'పెన్షన్',
    icon: 'BadgeIndianRupee',
    fields: [
      ['totalPensioners', 'Total Pensioners', 'number'],
      ['monthlyOutflowCrores', 'Monthly Outflow ₹ Crores', 'number'],
      ['seniorCitizens', 'Senior Citizens', 'number'],
      ['widows', 'Widows', 'number'],
      ['disabledPersons', 'Disabled Persons', 'number']
    ]
  },
  {
    key: 'annaCanteen',
    nameTe: 'అన్న క్యాంటీన్స్',
    nameEn: 'Anna Canteens',
    shortTe: 'క్యాంటీన్',
    icon: 'Utensils',
    fields: [
      ['activeCanteens', 'Active Canteens', 'number'],
      ['dailyMeals', 'Daily Meals Served', 'number'],
      ['districtsCovered', 'Districts Covered', 'number'],
      ['budgetPerMonthCrores', 'Budget per Month ₹ Crores', 'number']
    ]
  }
];

export const defaultSchemeData = {
  lastUpdated: new Date('2026-06-01T10:30:00+05:30').toISOString(),
  schemes: {
    thallikiVandanam: { beneficiaries: 8500000, budgetCrores: 2800, releasedCrores: 2100, districtCsv: 'Krishna:450000, Guntur:380000, Visakhapatnam:360000, Kurnool:320000, Anantapur:310000, Kadapa:275000, Nellore:260000, West Godavari:250000', status: 'active' },
    annadata: { registeredFarmers: 6200000, budgetCrores: 3200, releasedCrores: 1840, pendingCrores: 720, districtsCovered: 26, status: 'active' },
    deepam2: { cylindersDistributed: 4100000, familiesBenefited: 1800000, budgetCrores: 900, budgetUsedCrores: 540, districtsCompleted: 18, status: 'active' },
    aadabidda: { womenEnrolled: 7400000, budgetCrores: 3600, monthlyDisbursementCrores: 830, releasedCrores: 2490, status: 'active' },
    freeBus: { totalTrips: 126000000, womenBenefited: 5100000, budgetCrores: 1400, releasedCrores: 780, dailyRidership: 420000, routesCovered: 1180, status: 'active' },
    nirudyoga: { youthRegistered: 1800000, budgetCrores: 650, releasedCrores: 330, applicationsPending: 125000, monthlyBeneficiaries: 980000, status: 'active' },
    ntrPension: { totalPensioners: 6400000, monthlyOutflowCrores: 2750, seniorCitizens: 3400000, widows: 1320000, disabledPersons: 610000, weavers: 180000, fishermen: 95000, status: 'active' },
    annaCanteen: { activeCanteens: 203, dailyMeals: 180000, districtsCovered: 26, budgetPerMonthCrores: 42, status: 'active' }
  },
  monthlyTimeline: {
    labels: ['జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్', 'జులై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'],
    thalliki: [0, 5, 12, 21, 34, 48, 60, 71, 85, 88, 91, 94],
    annadata: [0, 4, 9, 16, 23, 31, 39, 46, 54, 59, 62, 66],
    nirudyoga: [0, 1.5, 3.2, 4.5, 6.1, 7.8, 9.1, 10.4, 11.2, 12.1, 13.5, 15],
    aadabidda: [0, 6, 15, 22, 31, 43, 54, 63, 70, 74, 78, 82]
  }
};

export const festivalDefaults = [
  ['Republic Day', 'గణతంత్ర దినోత్సవం', '26 Jan', 'from-blue-950 to-yellow-500'],
  ['Ugadi', 'ఉగాది', 'Telugu New Year', 'from-green-600 to-yellow-300'],
  ['Independence Day', 'స్వాతంత్ర్య దినోత్సవం', '15 Aug', 'from-orange-500 via-white to-green-600'],
  ['Vinayaka Chavithi', 'వినాయక చవితి', 'Festival', 'from-orange-500 to-yellow-300'],
  ['Dasara', 'దసరా', 'Festival', 'from-red-700 to-yellow-400'],
  ['Diwali', 'దీపావళి', 'Festival', 'from-purple-800 to-yellow-400'],
  ['Christmas', 'క్రిస్మస్', '25 Dec', 'from-green-700 to-red-600'],
  ['New Year', 'నూతన సంవత్సరం', '1 Jan', 'from-slate-950 to-yellow-400'],
  ['NTR Birthday', 'NTR జన్మదినం', '28 May', 'from-blue-950 to-orange-500'],
  ['CBN Birthday', 'CBN జన్మదినం', '20 Apr', 'from-blue-950 to-yellow-500']
].map(([nameEn, nameTe, date, gradient], order) => ({ id: nameEn.toLowerCase().replace(/\s+/g, '-'), nameEn, nameTe, date, gradient, active: true, order }));

export const parseDistrictCsv = (csv = '') => csv.split(',').map((part) => {
  const [name, value] = part.split(':').map((item) => item?.trim());
  return name ? { name, value: Number(value) || 0 } : null;
}).filter(Boolean);

export const getStoredSchemeData = () => {
  if (typeof window === 'undefined') return defaultSchemeData;
  try {
    return JSON.parse(localStorage.getItem(SCHEME_STORAGE_KEY)) || defaultSchemeData;
  } catch {
    return defaultSchemeData;
  }
};

export const saveStoredSchemeData = (data) => {
  localStorage.setItem(SCHEME_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('tdp-scheme-data-updated', { detail: data }));
};
