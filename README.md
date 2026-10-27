# Baraka 4.0 — kundalik hayot va oilaviy moliya

Vercel + Neon uchun moslashtirish va joylashtirish tartibi: [Vercel qo‘llanmasi](baraka/docs/VERCEL.md). Vercel loyihasining ildizi `baraka/` bo‘lsin.

## Server bilan ochish (hisob / oila / sinxronlash)

PowerShell’da:

```powershell
cd C:\Users\projects\family_app
npm start
```

http://localhost:3000 ni oching. Eski server ishlab turgan bo‘lsa, avval Ctrl+C bosing. Sahifani Ctrl+F5 bilan yangilang. Paket o‘rnatish talab qilinmaydi.

**Hisob yaratish:** yuqoridagi Kirish tugmasi. **Oila:** Oila budjeti → Taklif kodi / Oilaga qo‘shilish. **Hamyonlar, Taqvim, Kommunal xizmatlar:** chap menyuda; telefonda pastki menyuni suring.

`start-server.bat` ham serverni ishga tushiradi. `start.bat` / `index.html` serversiz mahalliy rejimni ochadi; unda server hisoblari mavjud emas.

## Yangi kundalik bo‘limlar

**Bugun**: vazifa, uchrashuv, to‘lov va eslatmalar bir joyda. **Rejalar**, **Namoz vaqtlari** va **Transport** menyuga qo‘shilgan. Shahar tanlanadi, boshlang‘ich tanlov Toshkent. Namoz API va OSM xarita manbalari internet talab qiladi. Jonli avtobus GPS, haqiqiy qo‘ng‘iroq va kommunal to‘lov uchun tegishli operator sozlanishi kerak.

[Funksiyalar holati va ulash yo‘riqnomasi](baraka/DAY-SERVICES.md).

## Holat

Hisob, oilaviy server saqlashi, hamyonlar va taqvim implementatsiya qilingan. Telefon push uchun PUSH_CONTACT, HTTPS va qurilma ruxsati kerak. Bulut hosting hali joylashtirilmagan. Kommunal xizmatlar operatori ulanmagan; UI buni ochiq ko‘rsatadi va real to‘lovni bloklaydi.

- [Ishlash va imkoniyatlar](baraka/README.md)
- [Hosting, push va kommunal operator ulanishi](baraka/INTEGRATIONS.md)
- [Xavfsizlik tekshiruvi va cheklovlar](baraka/SECURITY.md)

**Tekshiruv:** `npm run check` va `npm test`.

## Animatsiyali kirish sahifasi

Asosiy manzil hashamatli uyga yaqinlashib, telefon tutgan oilaga o‘tuvchi Baraka tanishtiruv va kirish sahifasini ochadi. Bu variant ikkita mahalliy fotosahna orqali scrollga bog‘langan yaqinlashish va o‘tish effektidan foydalanadi. “Kirish” yoki “Hisob yaratish” tugmasi formaga olib boradi. Email va parol bilan kirilgach `/app.html#today` manzilidagi Baraka ochiladi. Faol sessiya mavjud bo‘lsa kirish sahifasi avtomatik ilovaga o‘tkazadi; hisobdan chiqilganda kirish sahifasi qaytadi. Foydalanuvchi parolini o‘zi tanlaydi: bo‘sh bo‘lmagan, 128 belgigacha bo‘lgan raqam, harf yoki belgilar qabul qilinadi. Hisoblar mavjud Node serverida saqlanadi; HTML faylni bevosita ochish orqali hisobga kirib bo‘lmaydi.

Agar Windows 3000-portni ochishga ruxsat bermasa, PowerShell’da:

```powershell
cd C:\Users\projects\family_app
$env:HOST = "127.0.0.1"
$env:PORT = "8080"
$env:APP_ORIGIN = "http://127.0.0.1:8080"
node .\baraka\server.cjs
```

`Baraka tayyor` yozuvidan keyin http://127.0.0.1:8080 ni oching. Server oynasini ochiq qoldiring.

### Uy va oila dizaynini ko‘rish

Hisob allaqachon ochiq bo‘lsa ham yangi sahnani ko‘rish: `http://127.0.0.1:8080/?preview=home`. Scroll davomida moliya, oilaviy maqsadlar va kundalik rejalar haqida uch matn navbat bilan chiqadi. Kamaytirilgan harakat rejimida matnlar oddiy ketma-ketlikda ko‘rsatiladi.

Uy varianti oldidan qaytish nusxasi `backups/baraka-before-house-20261020-094813.tar.gz` ichida saqlangan. Nusxa faqat kirish sahifasi, server, tegishli testlar va README’ni o‘z ichiga oladi; foydalanuvchi ma’lumotlarini o‘zgartirmaydi.

## Funksiyalar tekshiruvi

Tekshirilgan bo‘limlar, tuzatilgan xatolar va jonli ulanish cheklovlari: [FUNCTION-AUDIT.md](baraka/FUNCTION-AUDIT.md).

## Haqiqiy xizmatlar ulanishini tekshirish

PowerShell’da `npm run services:check` sozlamalar borligini, `npm run services:check -- --live` esa namoz va bekat manbalariga haqiqiy tarmoq so‘rovini tekshiradi. Buyruq SMS, push, qo‘ng‘iroq yoki to‘lov yubormaydi; maxfiy kalitlarni chiqarmaydi. `SOZLANGAN` faqat konfiguratsiya borligini bildiradi, haqiqiy operator ishlashini tasdiqlamaydi. Avtobus GPS’i uchun ruxsatli operator API manbasi kerak.

## Oilaviy kundalik imkoniyatlar

Tez xarajat, umumiy xarid ro‘yxati, daromadgacha pul hisobi, nasiya, xorijdan pul kelishi, kommunal sarf, mavsumiy rejalar, shaxsiy hisob va bolalar ruxsati qo‘shildi. Telefon menyusi beshta bo‘limdan iborat; qo‘shimcha vositalar **Yana** ichida.

[Qo‘llanma, SMS/email va Telegram sozlamalari, sinov holati](baraka/FAMILY-LIFE.md).
