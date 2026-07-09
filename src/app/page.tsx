'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Trash2, Download, Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';

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
  const [filterTipe, setFilterTipe] = useState<Tipe | 'semua'>('semua');
  const [filterBulan, setFilterBulan] = useState(() => new Date().toISOString().slice(0, 7));

  const [formTipe, setFormTipe] = useState<Tipe>('pengeluaran');
  const [formJumlah, setFormJumlah] = useState('');
  const [formKategori, setFormKategori] = useState('Makan');
  const [formCatatan, setFormCatatan] = useState('');
  const [formTanggal, setFormTanggal] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const saved = localStorage.getItem('pantauin-data');
    if (saved) setTransaksi(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('pantauin-data', JSON.stringify(transaksi));
  }, [transaksi]);

  const filtered = transaksi.filter((t) => {
    if (filterTipe !== 'semua' && t.tipe !== filterTipe) return false;
    return t.tanggal.slice(0, 7) === filterBulan;
  });

  const totalPemasukan = filtered.filter((t) => t.tipe === 'pemasukan').reduce((s, t) => s + t.jumlah, 0);
  const totalPengeluaran = filtered.filter((t) => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0);
  const saldo = totalPemasukan - totalPengeluaran;

  const chartData = Object.entries(
    filtered.filter((t) => t.tipe === 'pengeluaran')
      .reduce((acc, t) => { acc[t.kategori] = (acc[t.kategori] || 0) + t.jumlah; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const dailyData = Object.entries(
    filtered.filter((t) => t.tipe === 'pengeluaran')
      .reduce((acc, t) => { acc[t.tanggal] = (acc[t.tanggal] || 0) + t.jumlah; return acc; }, {} as Record<string, number>)
  ).map(([tanggal, pengeluaran]) => ({ tanggal, pengeluaran })).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const handleTambah = useCallback(() => {
    const jumlah = parseInt(formJumlah.replace(/\D/g, ''));
    if (!jumlah || jumlah <= 0) return;
    const baru: Transaksi = { id: Date.now().toString(), tanggal: formTanggal, jumlah, kategori: formKategori, catatan: formCatatan, tipe: formTipe };
    setTransaksi((prev) => [...prev, baru].sort((a, b) => b.tanggal.localeCompare(a.tanggal)));
    setFormJumlah(''); setFormCatatan(''); setBukaTambah(false);
  }, [formJumlah, formTanggal, formKategori, formCatatan, formTipe]);

  const handleExport = () => {
    const header = 'Tanggal,Tipe,Kategori,Jumlah,Catatan\n';
    const rows = filtered.map((t) => `${t.tanggal},${t.tipe},${t.kategori},${t.jumlah},"${t.catatan}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pantauin-${filterBulan}.csv`; a.click();
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-warm-white border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sage flex items-center justify-center text-white font-bold">P</div>
          <div>
            <h1 className="font-bold text-lg text-charcoal">Pantauin</h1>
            <p className="text-xs text-muted font-mono">Tracker Pengeluaran</p>
          </div>
        </div>
        <button onClick={handleExport} className="flex items-center gap-1.5 text-xs text-sage hover:text-sage-light font-medium px-3 py-1.5 border border-sage-pale rounded-lg">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{ label: 'SALDO', value: saldo, icon: Wallet, color: saldo >= 0 ? 'text-income' : 'text-expense' },
            { label: 'PEMASUKAN', value: totalPemasukan, icon: TrendingUp, color: 'text-income' },
            { label: 'PENGELUARAN', value: totalPengeluaran, icon: TrendingDown, color: 'text-expense' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-2 text-muted text-xs font-mono mb-2">
                <item.icon className={`w-4 h-4 ${item.color}`} /> {item.label}
              </div>
              <p className={`text-2xl font-bold ${item.color}`}>{formatRupiah(item.value)}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        {dailyData.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="text-xs font-mono font-bold text-muted uppercase mb-3">Pengeluaran Harian</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyData}>
                <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} tickFormatter={(v: any) => v.slice(8)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: any) => (v / 1000).toFixed(0) + 'k'} />
                <Tooltip formatter={(v: any) => formatRupiah(Number(v))} />
                <Bar dataKey="pengeluaran" fill="#5a5a40" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="text-xs font-mono font-bold text-muted uppercase mb-3">Per Kategori</h3>
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

        {/* Filter + Add */}
        <div className="flex flex-wrap items-center gap-3">
          <input type="month" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="text-sm border border-border rounded-xl px-3 py-2 bg-white" />
          <select value={filterTipe} onChange={(e) => setFilterTipe(e.target.value as any)} className="text-sm border border-border rounded-xl px-3 py-2 bg-white">
            <option value="semua">Semua</option>
            <option value="pemasukan">Pemasukan</option>
            <option value="pengeluaran">Pengeluaran</option>
          </select>
          <button onClick={() => setBukaTambah(true)} className="flex items-center gap-1.5 text-sm bg-sage text-white px-4 py-2 rounded-xl hover:bg-sage-light transition-colors ml-auto">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-muted">
              <PiggyBank className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-medium">Belum ada transaksi</p>
              <p className="text-xs mt-1">Klik Tambah untuk mencatat pemasukan atau pengeluaran</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-cream/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold ${t.tipe === 'pemasukan' ? 'bg-income' : 'bg-expense'}`}>
                      {t.tipe === 'pemasukan' ? 'M' : 'K'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-charcoal">{t.kategori}</p>
                      <p className="text-xs text-muted">{t.catatan || t.tanggal}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-sm font-bold ${t.tipe === 'pemasukan' ? 'text-income' : 'text-expense'}`}>
                      {t.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(t.jumlah)}
                    </p>
                    <button onClick={() => setTransaksi((prev) => prev.filter((x) => x.id !== t.id))} className="opacity-0 group-hover:opacity-100 text-muted hover:text-expense transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Add Transaction */}
      {bukaTambah && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setBukaTambah(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-lg text-charcoal mb-5">Tambah Transaksi</h2>
            <div className="flex gap-2 mb-4">
              <button onClick={() => { setFormTipe('pengeluaran'); setFormKategori('Makan'); }} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${formTipe === 'pengeluaran' ? 'bg-expense text-white' : 'bg-sage-pale text-charcoal'}`}>
                🏷️ Pengeluaran
              </button>
              <button onClick={() => { setFormTipe('pemasukan'); setFormKategori('Gaji'); }} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${formTipe === 'pemasukan' ? 'bg-income text-white' : 'bg-sage-pale text-charcoal'}`}>
                💰 Pemasukan
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-muted mb-1 block">Jumlah (Rp)</label>
                <input type="text" inputMode="numeric" value={formJumlah} onChange={(e) => setFormJumlah(e.target.value.replace(/\D/g, ''))} placeholder="0" className="w-full border border-border rounded-xl px-4 py-2.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-sage/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted mb-1 block">Tanggal</label>
                  <input type="date" value={formTanggal} onChange={(e) => setFormTanggal(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/30" />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted mb-1 block">Kategori</label>
                  <select value={formKategori} onChange={(e) => setFormKategori(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/30">
                    {KATEGORI[formTipe].map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-muted mb-1 block">Catatan (opsional)</label>
                <input type="text" value={formCatatan} onChange={(e) => setFormCatatan(e.target.value)} placeholder="Misal: Makan siang" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/30" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setBukaTambah(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm text-charcoal hover:bg-cream">Batal</button>
              <button onClick={handleTambah} className="flex-1 py-2.5 bg-sage text-white rounded-xl text-sm font-medium hover:bg-sage-light">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
