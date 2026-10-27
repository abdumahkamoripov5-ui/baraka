# Baraka 4.0

## Vercel + Neon

Vercel uchun Node Function va PostgreSQL’da doimiy saqlash qo‘shilgan. Bepul shaxsiy sinov uchun sozlash va cheklovlar: [qadam-baqadam Vercel qo‘llanmasi](docs/VERCEL.md). Mahalliy JSON baza bilan `npm start` alohida ishlashda davom etadi. Vercel’ga jonli deploy hisob egasi bilan sozlanishi kerak; avtomatik eslatma va operator integratsiyalari bu variantda ulanmagan.

O‘zbek tilidagi shaxsiy va oilaviy moliya vositasi. Tashqi frontend kutubxonalarisiz ishlaydi.

## Ishga tushirish

Loyiha ildizida `npm start`, keyin http://localhost:3000. Node.js 18 yoki yangisi kerak. Qo‘shimcha npm paket yo‘q. Eski serverni Ctrl+C bilan to‘xtatib qayta boshlang; Ctrl+F5 bilan sahifani yangilang.

Windows’da `start-server.bat` — server rejimi. `start.bat` / `index.html` — serversiz mehmon rejimi, unda login va sinxronlash yo‘q.

## Kundalik bo‘limlar

Bugun, vazifalar/uchrashuvlar, namoz vaqtlari, avtobus bekatlari/xaritasi va qo‘ng‘iroq eslatmalari qo‘shilgan. Ishlaydigan qismlar va talab qilinadigan haqiqiy operator ulanishlari [DAY-SERVICES.md](DAY-SERVICES.md) da ajratilgan.

## Imkoniyatlar

- **Umumiy sahifa:** balans, oylik kirim/xarajat, limit, diagrammalar, tezkor amallar va maqsadlar.
- **Amaliyotlar:** qo‘shish/tahrirlash/o‘chirish, qidirish, sana/tur/a’zo filtrlari, saralash va CSV.
- **Oila:** email/parol bilan hisoblar, serverdagi umumiy budjet, bir martalik taklif, a’zoning kirishini bekor qilish, oilalar orasida almashish. Mahalliy a’zo nomi qo‘shish alohida login huquqini bermaydi.
- **Hamyonlar:** naqd va karta hisoblari, boshlang‘ich qoldiq, ichki o‘tkazmalar. Bu bankka pul yubormaydi.
- **Taqvim:** kirim/xarajat, qarzlar, maqsad sanalari va kelgusi oylarga hisoblangan takroriy to‘lovlar.
- **Jamg‘arma:** maqsad va muddat, foiz, yig‘ish/olish, oylik reja va kalkulyator.
- **Qarz:** berilgan/olingan, muddat, qisman qaytarish va qoldiq.
- **To‘lovlar:** rejalashtirish, qo‘lda to‘langanini qayd etish, oylik keyingi sanani hisoblash.
- **Kommunal hisoblar:** elektr/gaz/suv/issiqlik/chiqindi abonentlari. Operator konfiguratsiyasisiz qarzdorlik ko‘rsatilmaydi, real to‘lov o‘chiq. [Operator ulanishi](INTEGRATIONS.md).
- **Telefon eslatmalari:** service worker, push obunasi, server scheduler va umumiy eslatma. Aktivlashtirish talablari [INTEGRATIONS.md](INTEGRATIONS.md) da. Haqiqiy telefonda yetkazish tekshirilmagan.
- **Hisobot:** hafta, shu oy, o‘tgan oy; CSV va chop etish.
- **Sozlamalar:** hisob/parol, shaxsiy nom, tungi rejim, summalarni yashirish, harakatni kamaytirish, JSON zaxira/tiklash.
- **Ko‘rinish:** telefonga mos, 3D CSS tanga va kursor bo‘yicha karta harakati, yengil animatsiyalar, klaviatura qo‘llovi.

Alt+N — amaliyot; Ctrl/⌘+K — qidirish.

## Hisoblash va saqlash

Balans: hamyonlarning boshlang‘ich qoldig‘i + bugungacha kirim − xarajat. O‘tkazmalar umumiy balansni o‘zgartirmaydi. Oylik limitlar faqat joriy oy uchun. Jamg‘arma va qarz alohida daftarda; ular avtomatik bank/pul harakati emas. Rejali to‘lovni qo‘lda tasdiqlash esa xarajat yaratadi. Kommunal operatorning haqiqiy to‘lovi alohida server callbacki bilan tasdiqlanadi.

Mehmon ma’lumoti brauzerda. Hisobga kirilganda server oilaviy nusxasi ishlaydi, eski mehmon ma’lumoti avtomatik yuklanmaydi. Qo‘lda ko‘chirish/tiklash uchun alohida tasdiq bor. Bir vaqtdagi tahrirlar versiya bilan himoyalangan; farq chiqsa tanlov ko‘rsatiladi. Eski 2.0 localStorage va JSON nusxalar moslashtiriladi.

Mahalliy server internetdagi bulut emas. Boshqa telefonlar uchun HTTPS hosting kerak. Hozirgi JSON bazasi bir server jarayoni uchun; katta auditoriya uchun PostgreSQL zarur.

## Tekshiruv va xavfsizlik

`npm run check` va `npm test`. Testlar: model/migratsiya, sahifalar, hamyonlar, taqvim, auth, oilaviy ruxsat, CSRF, parol/sessiya, versiya to‘qnashuvi, sinxronlash, webhook idempotentligi, push imzosi, scheduler va statik fayllar.

[SECURITY.md](SECURITY.md) da tekshiruv natijalari va qolgan xavflar bor. Haqiqiy brauzerda vizual test, Docker deployment, telefonga push yetkazish va real kommunal operator testi bu muhitda bajarilmagan.
