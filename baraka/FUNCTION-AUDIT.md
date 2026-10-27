# Baraka — funksiyalar tekshiruvi

Tekshiruv sanasi: 2026-10-20. Jami 80 ta avtomatlashtirilgan test o‘tdi; `npm run check` ham muvaffaqiyatli bajarildi. Testlar vaqtinchalik bazalarda va Node VM ichida ishlatildi. Foydalanuvchining haqiqiy bazasi o‘zgartirilmadi.

## Tekshirilgan qismlar

| Qism | Tekshiruv |
|---|---|
| Barcha 15 bo‘lim | Namuna va bo‘sh hisobda sahifani chiqarish; asosiy qo‘shish tugmalari |
| Kirish / hisob yaratish | Foydalanuvchi tanlagan parol, noto‘g‘ri parol, sessiya cookie’si, parol almashishi, chiqish |
| Amaliyotlar | Forma orqali qo‘shish/tahrirlash/o‘chirish/qaytarish; qidirish va filtrlar |
| Jamg‘armalar | Maqsad yaratish, pul qo‘shish/olish, chegaralar va kalkulyator |
| Qarzlar | Yaratish, qisman/to‘liq qaytarish, qolgan summa himoyasi |
| To‘lovlar | Bir martalik va oylik qayd; xarajat yaratish va oy oxiridagi sanani ko‘chirish |
| Hamyonlar | Yaratish, boshlang‘ich qoldiq, ichki o‘tkazma, umumiy mablag‘ saqlanishi |
| Oila | Bir martalik taklif kodi, a’zolik, oilalar orasidagi ruxsatlar, sinxronlash to‘qnashuvi |
| Rejalar | Vazifa/uchrashuv yaratish, bajarildi, filtr, o‘chirish va taqvimga chiqarish |
| Taqvim | Sanalar, oylik takroriy to‘lovlar, oylar orasida o‘tish va bugunga qaytish |
| Hisobot / eksport | Davr hisobi, CSV formula himoyasi, JSON zaxira chiqarish va import orqali tiklash |
| Sozlamalar | Rang rejimi, summalarni yashirish va harakat sozlamalarini saqlash |
| Namoz vaqtlari | API kontrakti; shahar/sana almashtirilganda yangi so‘rov; kechikkan eski javob/xatoni e’tiborsiz qoldirish |
| Transport | API kontrakti; shahar/GPS almashtirish; qidiruvni saqlash; 390/768/1280/1920 px xarita qoplamasi |
| Kommunal abonent | Abonentni qo‘shish, tahrirlash va o‘chirish; operator yo‘q bo‘lsa haqiqiy to‘lovni bloklash |
| Push / qo‘ng‘iroq | Soxta operator javoblari bilan rozilik, imzo, sessiya, navbat va takror yuborish himoyasi |

## Tuzatilgan xatolar

1. Namoz va transport so‘rovi ketayotgan paytda yangi shahar/sana/GPS so‘rovi to‘silib qolardi. So‘rovlar endi versiya orqali ajratiladi; eski javob yangi tanlovga ta’sir qilmaydi.
2. Transport natijasi yangilanganda qidiruv yo‘qolardi. Yangilashdan keyin qidiruv saqlanadi va filtr qayta ishlaydi.
3. Kalkulyator va boshqa faqat ko‘rish oynalarida Enter yashirin saqlash amalini chaqirib oynani yopishi mumkin edi. Bunday oynalarda yuborish bloklandi.
4. Sessiya brauzerda eskirgan deb belgilangan holatda chiqish serverdagi cookie sessiyasini bekor qilmasdi. Endi chiqish serverda ham bajariladi; allaqachon tugagan sessiyaning 401 javobi chiqishni to‘xtatmaydi.
5. Transport xaritasi doim 3×3 rasm olardi; kenglik va markazga qarab chetlari bo‘sh qolardi. Endi faqat ko‘rinadigan hududga kerakli rasmlar hisoblanadi; oyna o‘lchami o‘zgarganda xarita yangilanadi.

## Jonli tekshiruv cheklovlari

- AlAdhan va OSM/Overpass’ga jonli so‘rov sinab ko‘rildi. Bu muhitda DNS `EAI_AGAIN` xatosi bo‘lgani uchun ulanish tasdiqlanmadi. Bu foydalanuvchi kompyuterida ham manba ishlamaydi degani emas.
- Kommunal to‘lov va jonli avtobus GPS adapteri sozlanmagan. Telefon qo‘ng‘irog‘i uchun operator, tasdiqlangan raqam va rozilik; push uchun server sozlamasi, HTTPS va brauzer ruxsati talab qilinadi.
- Haqiqiy brauzerda barcha tugmalarni bosib chiqish, qurilma GPS/ovoz/push va vizual ko‘rinish ushbu muhitda tekshirilmadi. Xarita o‘lchamlari testi rasmlar hududni qoplashini tekshiradi, brauzer skrinshot testi emas.
- Testlarda pul o‘tkazilmagan, haqiqiy qo‘ng‘iroq va push yuborilmagan. Tashqi operatorli funksiyalar to‘liq jonli ishlaydi deb da’vo qilinmaydi.

Tekshiruv: loyiha ildizida `npm run check` va `npm test`.
