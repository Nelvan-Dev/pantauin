'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Trash2, Download, Wallet, TrendingUp, TrendingDown, PiggyBank, Edit2, Search, Sun, Moon, Target } from 'lucide-react';

type Tipe = 'pemasukan' | 'pengeluaran';

interface Transaksi {
  id: string;
  tanggal: string;
  jumlah: number;
  kategori: string;
  catatan: string;
  tipe: Tipe;
}

const KATEGORI: Record<Tipe, string[]> = {
  pemasukan: ['Gaji', 'Freelance', 'Investasi', 'Hadiah', 'Lainnya'],
  pengeluaran: ['Makan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya'],
};

const WARNA_KATEGORI: Record<string, string> = {
  Makan: '#5a5a40', Transport: '#7a7a5a', Belanja: '#c4a882',
  Tagihan: '#2d2a26', Hiburan: '#8a8580', Kesehatan: '#a8a078',
  Pendidikan: '#6b6b4e', Lainnya: '#b8b2a8',
  Gaji: '#2e7d32', Freelance: '#1b5e20', Investasi: '#0d3b11', Hadiah: '#4caf50',
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

export default function Home() {
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [bukaTambah, setBukaTambah] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gelap, setGelap] = useState(false);
  const [budget, setBudget] = useState(0);
  const [bukaBudget, setBukaBudget] = useState(false);
  const [inputBudget, setInputBudget] = useState('');

  const [filterTipe, setFilterTipe] = useState<Tipe | 'semua'>('semua');
  const [filterBulan, setFilterBulan] = useState(() => new Date().toISOString().slice(0, 7));

  const [formTipe, setFormTipe] = useState<Tipe>('pengeluaran');
  const [formJumlah, setFormJumlah] = useState('');
  const [formKategori, setFormKategori] = useState('Makan');
  const [formCatatan, setFormCatatan] = useState('');
  const [formTanggal, setFormTanggal] = useState(() => new Date().toISOString().slice(0, 10));

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pantauin-data');
    if (saved) setTransaksi(JSON.parse(saved));
    const g = localStorage.getItem('pantauin-gelap');
    if (g === 'true') setGelap(true);
    const b = localStorage.getItem('pantauin-budget');
    if (b) { const v = parseInt(b); setBudget(v); setInputBudget(String(v)); }
  }, []);

  useEffect(() => { localStorage.setItem('pantauin-gelap', String(gelap)); }, [gelap]);
  useEffect(() => { localStorage.setItem('pantauin-data', JSON.stringify(transaksi)); }, [transaksi]);
  useEffect(() => { localStorage.setItem('pantauin-budget', String(budget)); }, [budget]);

  // Edit mode: populate form
  const bukaEdit = (t: Transaksi) => {
    setEditId(t.id);
    setFormTipe(t.tipe);
    setFormJumlah(String(t.jumlah));
    setFormKategori(t.kategori);
    setFormCatatan(t.catatan);
    setFormTanggal(t.tanggal);
    setBukaTambah(true);
  };

  // Filter + search
  const filtered = transaksi.filter((t) => {
    if (filterTipe !== 'semua' && t.tipe !== filterTipe) return false;
    if (t.tanggal.slice(0, 7) !== filterBulan) return false;
    if (searchQuery && !t.catatan.toLowerCase().includes(searchQuery.toLowerCase()) && !t.kategori.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPemasukan = filtered.filter((t) => t.tipe === 'pemasukan').reduce((s, t) => s + t.jumlah, 0);
  const totalPengeluaran = filtered.filter((t) => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0);
  const saldo = totalPemasukan - totalPengeluaran;

  // Budget progress
  const sisaBudget = budget - totalPengeluaran;
  const persenBudget = budget > 0 ? Math.min((totalPengeluaran / budget) * 100, 100) : 0;

  // Chart data per kategori
  const chartData = Object.entries(
    filtered.filter((t) => t.tipe === 'pengeluaran')
      .reduce((acc, t) => { acc[t.kategori] = (acc[t.kategori] || 0) + t.jumlah; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Daily chart
  const dailyData = Object.entries(
    filtered.filter((t) => t.tipe === 'pengeluaran')
      .reduce((acc, t) => { acc[t.tanggal] = (acc[t.tanggal] || 0) + t.jumlah; return acc; }, {} as Record<string, number>)
  ).map(([tanggal, pengeluaran]) => ({ tanggal, pengeluaran })).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  // Simpan (add or edit)
  const handleSimpan = useCallback(() => {
    const jumlah = parseInt(formJumlah.replace(/\D/g, ''));
    if (!jumlah || jumlah <= 0) return;

    if (editId) {
      setTransaksi((prev) => prev.map((t) => t.id === editId ? { ...t, tanggal: formTanggal, jumlah, kategori: formKategori, catatan: formCatatan, tipe: formTipe } : t));
    } else {
      const baru: Transaksi = { id: Date.now().toString(), tanggal: formTanggal, jumlah, kategori: formKategori, catatan: formCatatan, tipe: formTipe };
      setTransaksi((prev) => [...prev, baru]);
    }
    setTransaksi((prev) => [...prev].sort((a, b) => b.tanggal.localeCompare(a.tanggal)));
    setFormJumlah(''); setFormCatatan(''); setEditId(null); setBukaTambah(false);
  }, [formJumlah, formTanggal, formKategori, formCatatan, formTipe, editId]);

  const handleExport = () => {
    const header = 'Tanggal,Tipe,Kategori,Jumlah,Catatan\n';
    const rows = filtered.map((t) => `${t.tanggal},${t.tipe},${t.kategori},${t.jumlah},"${t.catatan}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pantauin-${filterBulan}.csv`; a.click();
  };

  const bg = gelap ? 'bg-gray-900 text-gray-100' : 'bg-cream text-charcoal';
  const card = gelap ? 'bg-gray-800 border-gray-700' : 'bg-white border-border';
  const muted = gelap ? 'text-gray-400' : 'text-muted';
  const inputBg = gelap ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-border text-charcoal';

  return (
    <div className={`min-h-screen ${bg} transition-colors`}>
      {/* Header */}
      <header className={`${gelap ? 'bg-gray-800 border-gray-700' : 'bg-warm-white border-border'} border-b px-6 py-4 flex items-center justify-between transition-colors`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sage flex items-center justify-center text-white font-bold">P</div>
          <div>
            <h1 className={`font-bold text-lg ${gelap ? 'text-white' : 'text-charcoal'}`}>Pantauin</h1>
            <p className={`text-xs ${muted} font-mono`}>Tracker Pengeluaran</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setGelap(!gelap)} className={`p-2 rounded-xl ${muted} hover:bg-sage-pale/30 transition-colors`}>
            {gelap ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={handleExport} className={`flex items-center gap-1.5 text-xs text-sage hover:text-sage-light font-medium px-3 py-1.5 border border-sage-pale rounded-lg`}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className={`${card} rounded-2xl p-4 shadow-sm border`}>
            <div className={`flex items-center gap-2 text-xs font-mono mb-1 ${muted}`}><Wallet className="w-3.5 h-3.5" /> SALDO</div>
            <p className={`text-xl font-bold ${saldo >= 0 ? 'text-income' : 'text-expense'}`}>{formatRupiah(saldo)}</p>
          </div>
          <div className={`${card} rounded-2xl p-4 shadow-sm border`}>
            <div className={`flex items-center gap-2 text-xs font-mono mb-1 ${muted}`}><TrendingUp className="w-3.5 h-3.5 text-income" /> PEMASUKAN</div>
            <p className="text-xl font-bold text-income">{formatRupiah(totalPemasukan)}</p>
          </div>
          <div className={`${card} rounded-2xl p-4 shadow-sm border`}>
            <div className={`flex items-center gap-2 text-xs font-mono mb-1 ${muted}`}><TrendingDown className="w-3.5 h-3.5 text-expense" /> PENGELUARAN</div>
            <p className="text-xl font-bold text-expense">{formatRupiah(totalPengeluaran)}</p>
          </div>
          {/* Budget */}
          <div className={`${card} rounded-2xl p-4 shadow-sm border cursor-pointer`} onClick={() => { setInputBudget(String(budget)); setBukaBudget(true); }}>
            <div className={`flex items-center gap-2 text-xs font-mono mb-1 ${muted}`}><Target className="w-3.5 h-3.5" /> BUDGET</div>
            {budget > 0 ? (
              <div>
                <p className={`text-lg font-bold ${sisaBudget >= 0 ? 'text-income' : 'text-expense'}`}>{formatRupiah(sisaBudget)}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div className={`h-1.5 rounded-full ${persenBudget > 80 ? 'bg-expense' : persenBudget > 50 ? 'bg-yellow-500' : 'bg-income'}`} style={{ width: `${persenBudget}%` }} />
                </div>
                <p className={`text-[10px] ${muted} mt-0.5`}>{persenBudget.toFixed(0)}% terpakai</p>
              </div>
            ) : (
              <p className={`text-sm ${muted}`}>Atur budget</p>
            )}
          </div>
        </div>

        {/* Charts */}
        {dailyData.length > 0 && (
          <div className={`${card} rounded-2xl p-5 border shadow-sm`}>
            <h3 className={`text-xs font-mono font-bold uppercase mb-3 ${muted}`}>Pengeluaran Harian</h3>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={dailyData}>
                <XAxis dataKey="tanggal" tick={{ fontSize: 10, fill: gelap ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: any) => v.slice(8)} />
                <YAxis tick={{ fontSize: 10, fill: gelap ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: any) => (v / 1000).toFixed(0) + 'k'} />
                <Tooltip formatter={(v: any) => formatRupiah(Number(v))} />
                <Bar dataKey="pengeluaran" fill="#5a5a40" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chartData.length > 0 && (
            <div className={`${card} rounded-2xl p-5 border shadow-sm`}>
              <h3 className={`text-xs font-mono font-bold uppercase mb-3 ${muted}`}>Per Kategori</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {chartData.map((e: any, i: number) => <Cell key={i} fill={WARNA_KATEGORI[e.name] || '#b8b2a8'} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatRupiah(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Total per kategori */}
          {chartData.length > 0 && (
            <div className={`${card} rounded-2xl p-5 border shadow-sm`}>
              <h3 className={`text-xs font-mono font-bold uppercase mb-3 ${muted}`}>Rincian Kategori</h3>
              <div className="space-y-2 max-h-[200px] overflow-auto">
                {chartData.sort((a, b) => b.value - a.value).map((e) => (
                  <div key={e.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: WARNA_KATEGORI[e.name] || '#b8b2a8' }} />
                      <span className="text-sm">{e.name}</span>
                    </div>
                    <span className="text-sm font-medium">{formatRupiah(e.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filter + Search + Add */}
        <div className="flex flex-wrap items-center gap-2">
          <input type="month" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className={`text-sm border rounded-xl px-3 py-2 ${inputBg}`} />
          <select value={filterTipe} onChange={(e) => setFilterTipe(e.target.value as any)} className={`text-sm border rounded-xl px-3 py-2 ${inputBg}`}>
            <option value="semua">Semua</option>
            <option value="pemasukan">Pemasukan</option>
            <option value="pengeluaran">Pengeluaran</option>
          </select>
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari transaksi..." className={`w-full text-sm border rounded-xl pl-9 pr-3 py-2 ${inputBg}`} />
          </div>
          <button onClick={() => { setEditId(null); setFormTipe('pengeluaran'); setFormKategori('Makan'); setFormJumlah(''); setFormCatatan(''); setFormTanggal(new Date().toISOString().slice(0, 10)); setBukaTambah(true); }} className="flex items-center gap-1.5 text-sm bg-sage text-white px-4 py-2 rounded-xl hover:bg-sage-light transition-colors">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>

        {/* Transactions */}
        <div className={`${card} rounded-2xl border shadow-sm overflow-hidden`}>
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <PiggyBank className={`w-10 h-10 mx-auto mb-2 ${muted}`} />
              <p className={`font-medium ${muted}`}>Belum ada transaksi</p>
              <p className={`text-xs ${muted} mt-1`}>Klik Tambah untuk mencatat pengeluaran</p>
            </div>
          ) : (
            <div className={`divide-y ${gelap ? 'divide-gray-700' : 'divide-border'}`}>
              {filtered.map((t) => (
                <div key={t.id} className={`flex items-center justify-between px-5 py-3.5 ${gelap ? 'hover:bg-gray-700/50' : 'hover:bg-cream/50'} transition-colors group`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold ${t.tipe === 'pemasukan' ? 'bg-income' : 'bg-expense'}`}>
                      {t.tipe === 'pemasukan' ? 'M' : 'K'}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${gelap ? 'text-gray-200' : 'text-charcoal'}`}>{t.kategori}</p>
                      <p className={`text-xs ${muted}`}>{t.catatan || t.tanggal}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold ${t.tipe === 'pemasukan' ? 'text-income' : 'text-expense'}`}>
                      {t.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(t.jumlah)}
                    </p>
                    <button onClick={() => bukaEdit(t)} className={`opacity-0 group-hover:opacity-100 ${muted} hover:text-sage transition-all`}><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setTransaksi((prev) => prev.filter((x) => x.id !== t.id))} className={`opacity-0 group-hover:opacity-100 ${muted} hover:text-expense transition-all`}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Add/Edit */}
      {bukaTambah && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => { setBukaTambah(false); setEditId(null); }}>
          <div className={`${gelap ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 w-full max-w-md shadow-xl`} onClick={(e) => e.stopPropagation()}>
            <h2 className={`font-bold text-lg ${gelap ? 'text-white' : 'text-charcoal'} mb-5`}>{editId ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
            <div className="flex gap-2 mb-4">
              <button onClick={() => { setFormTipe('pengeluaran'); setFormKategori('Makan'); }} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${formTipe === 'pengeluaran' ? 'bg-expense text-white' : 'bg-sage-pale text-charcoal'}`}>🏷️ Pengeluaran</button>
              <button onClick={() => { setFormTipe('pemasukan'); setFormKategori('Gaji'); }} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${formTipe === 'pemasukan' ? 'bg-income text-white' : 'bg-sage-pale text-charcoal'}`}>💰 Pemasukan</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-muted mb-1 block">Jumlah (Rp)</label>
                <input type="text" inputMode="numeric" value={formJumlah} onChange={(e) => setFormJumlah(e.target.value.replace(/\D/g, ''))} placeholder="0" className={`w-full border rounded-xl px-4 py-2.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-sage/30 ${inputBg}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted mb-1 block">Tanggal</label>
                  <input type="date" value={formTanggal} onChange={(e) => setFormTanggal(e.target.value)} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/30 ${inputBg}`} />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted mb-1 block">Kategori</label>
                  <select value={formKategori} onChange={(e) => setFormKategori(e.target.value)} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/30 ${inputBg}`}>
                    {KATEGORI[formTipe].map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-muted mb-1 block">Catatan</label>
                <input type="text" value={formCatatan} onChange={(e) => setFormCatatan(e.target.value)} placeholder="Misal: Makan siang" className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/30 ${inputBg}`} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setBukaTambah(false); setEditId(null); }} className={`flex-1 py-2.5 border rounded-xl text-sm ${gelap ? 'border-gray-600 text-gray-300' : 'border-border text-charcoal'} hover:bg-cream`}>Batal</button>
              <button onClick={handleSimpan} className="flex-1 py-2.5 bg-sage text-white rounded-xl text-sm font-medium hover:bg-sage-light">{editId ? 'Simpan' : 'Tambah'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Budget */}
      {bukaBudget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setBukaBudget(false)}>
          <div className={`${gelap ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 w-full max-w-sm shadow-xl`} onClick={(e) => e.stopPropagation()}>
            <h2 className={`font-bold text-lg ${gelap ? 'text-white' : 'text-charcoal'} mb-4`}>Atur Budget Bulanan</h2>
            <input type="text" inputMode="numeric" value={inputBudget} onChange={(e) => setInputBudget(e.target.value.replace(/\D/g, ''))} placeholder="Masukkan budget..." className={`w-full border rounded-xl px-4 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-sage/30 ${inputBg}`} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setBukaBudget(false)} className={`flex-1 py-2.5 border rounded-xl text-sm ${gelap ? 'border-gray-600 text-gray-300' : 'border-border text-charcoal'}`}>Batal</button>
              <button onClick={() => { setBudget(parseInt(inputBudget) || 0); setBukaBudget(false); }} className="flex-1 py-2.5 bg-sage text-white rounded-xl text-sm font-medium hover:bg-sage-light">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
