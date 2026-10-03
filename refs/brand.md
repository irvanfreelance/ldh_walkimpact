# Brand & Styling Guide — Walk Impact 2026

---

## 1. Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Impact Green | `#6DC230` | CTA button, highlight, badge, accent |
| Deep Green | `#3A7D0A` | Header bg, footer bg, dark section |
| Leaf Green | `#8ED63F` | Hover state, gradient midpoint |

### Gradient

```css
/* Hero & section background utama */
background: linear-gradient(135deg, #6DC230 0%, #3A7D0A 100%);

/* Overlay ringan di atas foto/ilustrasi */
background: linear-gradient(180deg, rgba(61,125,10,0.75) 0%, rgba(109,194,48,0.4) 100%);
```

### Secondary / Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| White | `#FFFFFF` | Background section, teks di atas hijau |
| Off White | `#F5F7F2` | Section alternating bg, card bg |
| Light Gray | `#E8EDE3` | Divider, border, subtle bg |
| Dark Text | `#1A2714` | Body text di background terang |
| Muted Text | `#5A6B4E` | Subtext, caption, label kecil |

### Accent / State Colors

| Name | Hex | Usage |
|------|-----|-------|
| Warning Amber | `#F5A623` | Badge "Terbatas", countdown urgency |
| Success Green | `#2ECC71` | Konfirmasi sukses pendaftaran |
| Dot Pattern | `#C8E6A0` | Dekoratif dot grid (dari desain asli) |

---

## 2. Typography

### Font Stack

```css
/* Heading — Bold, impactful */
font-family: 'Plus Jakarta Sans', 'Poppins', sans-serif;

/* Body — Readable, friendly */
font-family: 'Inter', 'DM Sans', sans-serif;
```

> Alternatif Google Fonts yang bisa dipakai langsung:
> - Heading: **Poppins** (weight 700, 800)
> - Body: **Inter** (weight 400, 500)

---

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display` | 56–72px | 800 | 1.1 | Hero headline |
| `h1` | 40–48px | 700 | 1.2 | Section title utama |
| `h2` | 28–32px | 700 | 1.3 | Sub-section title |
| `h3` | 20–24px | 600 | 1.4 | Card title, FAQ item |
| `body-lg` | 18px | 400 | 1.7 | Paragraf utama |
| `body` | 16px | 400 | 1.6 | Body default |
| `small` | 13–14px | 400 | 1.5 | Caption, label, footer |
| `label` | 12px | 600 | 1 | Badge, tag, uppercase label |

### Aturan Teks di Atas Background Hijau
- Selalu pakai **putih (#FFFFFF)** — jangan pakai hijau muda di atas hijau gelap
- Judul: weight 700–800
- Subtext: opacity 85% dari putih → `rgba(255,255,255,0.85)`

---

## 3. Spacing System

Berbasis skala 8px:

4px → xs — gap antar ikon dan label
8px → sm — padding badge, jarak elemen kecil
16px → md — padding card, gap antar item list
24px → lg — gap antar kolom, inner padding card
32px → xl — gap antar komponen dalam section
48px → 2xl — margin atas/bawah section di mobile
64px → 3xl — padding section di desktop
96px → 4xl — section gap besar (hero padding atas)


---

## 4. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 6px | Badge, tag kecil |
| `rounded-md` | 12px | Button, input field |
| `rounded-lg` | 16px | Card |
| `rounded-xl` | 24px | Section highlight, info box |
| `rounded-full` | 9999px | Pill badge, avatar, icon circle |

---

## 5. Buttons

### Primary CTA
```css
background: #6DC230;
color: #FFFFFF;
font-weight: 700;
font-size: 16px;
padding: 14px 32px;
border-radius: 12px;
border: none;
transition: background 0.2s ease;

/* Hover */
background: #5aad20;

/* Active */
background: #3A7D0A;
transform: scale(0.98);
```

### Secondary / Ghost Button
```css
background: transparent;
color: #6DC230;
border: 2px solid #6DC230;
font-weight: 600;
padding: 12px 28px;
border-radius: 12px;

/* Hover */
background: rgba(109,194,48,0.1);
```

### Button di atas background gelap/hijau
```css
background: #FFFFFF;
color: #3A7D0A;
font-weight: 700;
border-radius: 12px;
```

---

## 6. Cards

```css
.card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(61, 125, 10, 0.08);
  border: 1px solid #E8EDE3;
}

/* Card hover state */
.card:hover {
  box-shadow: 0 6px 24px rgba(61, 125, 10, 0.14);
  transform: translateY(-2px);
  transition: all 0.2s ease;
}
```

---

## 7. Decorative Elements (dari identitas visual asli)

### Dot Grid Pattern
Pola titik-titik yang muncul di background proposal asli. Digunakan sebagai dekorasi sudut atau divider.

```css
/* Gunakan sebagai background-image atau SVG overlay */
/* Warna: #C8E6A0 (hijau sangat muda) di atas white */
/* Warna: rgba(255,255,255,0.15) di atas background hijau gelap */

.dot-pattern {
  background-image: radial-gradient(circle, #C8E6A0 1.5px, transparent 1.5px);
  background-size: 18px 18px;
  opacity: 0.6;
}
```

### Green Accent Bar
Garis vertikal hijau tebal di sisi kiri heading — signature visual dari desain asli.

```css
.section-title {
  border-left: 5px solid #6DC230;
  padding-left: 16px;
}
```

---

## 8. Iconography

- Gunakan icon set yang **rounded dan friendly** — bukan sharp/geometric
- Rekomendasi: **Lucide Icons**, **Phosphor Icons**, atau **Heroicons (rounded)**
- Ukuran default: 24px (inline), 40px (feature icon di card), 56px (hero icon)
- Warna ikon di background putih: `#6DC230` atau `#3A7D0A`
- Warna ikon di background hijau: `#FFFFFF`

---

## 9. Illustration Style

- Ilustrasi manusia berjalan — gaya **flat vector, warna solid**, tidak foto realistis
- Palet ilustrasi mengikuti color palette utama: hijau, putih, aksen kuning muda
- Karakter tidak detail wajah (lebih ke siluet aktif) — seperti visual di proposal asli
- Elemen daun/tumbuhan sebagai aksen lingkungan

---

## 10. Image Treatment (untuk foto)

Jika menggunakan foto nyata (peserta, suasana event):

```css
/* Overlay warna di atas foto */
.photo-overlay {
  background: linear-gradient(
    180deg,
    rgba(61,125,10,0.3) 0%,
    rgba(61,125,10,0.7) 100%
  );
}

/* Atau: duotone ringan */
filter: saturate(1.1) brightness(0.95);
```

- Hindari foto yang terlalu formal atau corporate
- Prioritaskan foto: orang berjalan bersama, senyum, interaksi langsung dengan warga

---

## 11. Section Layout Rhythm

Hero → Full-height, bg hijau gelap/gradien, teks putih
Impact Numbers → Bg white, teks hitam, angka besar hijau
Konsep Acara → Bg off-white (
#F5F7F2), card putih
Timeline → Bg hijau gelap, teks putih, aksen garis hijau muda
Siapa Bisa Ikut → Bg white
Pendaftaran (CTA) → Bg Impact Green (
#6DC230), teks putih — paling mencolok
Tentang LAZ → Bg off-white
FAQ → Bg white
Footer → Bg Deep Green (
#3A7D0A), teks putih


> Pola alternating putih ↔ off-white mencegah halaman terasa flat.
> Section hijau digunakan hanya untuk Hero, CTA utama, dan Footer — agar tetap impactful.

---

## 12. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| Mobile | < 640px | Single column, font scale turun 15–20% |
| Tablet | 640–1024px | 2 kolom untuk cards dan grid |
| Desktop | > 1024px | 3–4 kolom, section padding penuh |

### Mobile-specific rules:
- CTA button: full-width (`width: 100%`)
- Hero headline: max 40px
- Section padding: 48px vertikal
- Card grid: 1 kolom, scroll vertikal
- Countdown timer: tetap prominent di atas fold