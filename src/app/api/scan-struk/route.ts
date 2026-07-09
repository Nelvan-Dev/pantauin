import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mime = file.type || 'image/jpeg';

    // Try Gemini (cepat, gratis tier)
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: `Extract receipt info as JSON only:
{
  "item": "item description",
  "total": number (digits only, no dots/commas),
  "kategori": "Makan|Transport|Belanja|Tagihan|Hiburan|Kesehatan|Pendidikan|Lainnya"
}
If unreadable: {"error": "unreadable"}` },
                  { inlineData: { mimeType: mime, data: base64 } }
                ]
              }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 200 }
            }),
          }
        );

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (!parsed.error) return NextResponse.json(parsed);
        }
      } catch {}
    }

    // Fallback: isi manual
    return NextResponse.json({ fallback: true });
  } catch {
    return NextResponse.json({ error: 'Gagal' }, { status: 500 });
  }
}
