# Oilaviy kundalik imkoniyatlar

## Qayerdan foydalaniladi

- **Bugun / Pul:** «Bozor 180 ming» kabi tez xarajat kiritish va keyingi daromadgacha pul hisobi. Avval taxmin qilingan toifa, summa, sana va hamyon tekshiriladi, so‘ng saqlanadi.
- **Xaridlar:** umumiy mahsulot, miqdor, mas’ul a’zo va olindi belgisi. «Summani qayd etish» haqiqiy xarajat yaratadi; shu mahsulot qayta xarajat qilinmaydi. Ro‘yxatni o‘chirish avvalgi pul amaliyotini o‘chirmaydi.
- **Yana → Nasiya:** jami narx, boshlang‘ich to‘lov, oylik to‘lovlar soni va birinchi muddat. Boshlang‘ich to‘lov saqlashda, keyingi to‘lovlar tasdiqlanganda xarajatga o‘tadi. Oxirgi to‘lov butun so‘mga bo‘lish qoldig‘ini qoplaydi. 31-sanada boshlangan jadval fevralda qisqaradi, keyingi oy yana 31-sanani ishlatadi.
- **Yana → Xorijdan kelgan pul:** asl valyuta, miqdor, komissiya va amalda olingan so‘m. Asl miqdor va komissiya 1/100 birliklarda saqlanadi. Hamyonga faqat haqiqiy so‘m kirimi yoziladi. Kurs avtomatik bank yoki bozor kotirovkasi emas.
- **Yana → Kommunal sarf daftari:** avval kommunal abonent qo‘shing. Sana, ko‘rsatkich va o‘zingiz tanlagan tarif bilan sarfni taqqoslang. Surat qurilmada kichraytiriladi va zaxira nusxaga kiradi. Pog‘onali tarif va operator qarzdorligi hisoblanmaydi. Hisoblagich almashtirilsa yangi abonent yozuvi oching.
- **Yana → Mavsumiy budjet:** maktab, qish, ta’mir, to‘y, bayram va favqulodda zaxira uchun tahrirlanadigan jamg‘arma shablonlari. Tayyor narxlar to‘qib berilmaydi.
- **Yana → Shaxsiy hamyon:** alohida `/api/personal` hisob. Oila snapshoti va umumiy zaxira nusxaga shaxsiy yozuvlar kirmaydi. Bir vaqtdagi tahrirlarda revision to‘qnashuvi eski nusxani rad etadi; yangilab qayta kiriting.
- **Oila:** egasi a’zoni «Bola ruxsati»ga o‘tkazishi mumkin. Bola faqat o‘z vazifalari, xaridlar va shaxsiy hisobini ko‘radi. Cheklov serverda tekshiriladi. Egasi cho‘ntak pulini qayd etsa, oilada xarajat va bolada shaxsiy kirim atomik yoziladi. Haqiqiy bank o‘tkazmasi bajarilmaydi.
- **Sozlamalar:** o‘zbek lotin/kirill va rus tilidagi asosiy interfeys, mamlakat, telefon kodi, valyuta va vaqt zonasi ma’lumotlari. Moliyaviy daftar hozir UZSda; mamlakatni almashtirish mavjud pullarni boshqa valyuta sifatida qayta belgilamaydi. Barcha uzun izohlar va xatoliklarning to‘liq tarjimasi hali tugallanmagan. Shahar xizmatlari tanlangan shaharning mavjud sozlamalarini ishlatadi.

## Telefon va tarmoq

520pxgacha telefonda beshta menyu: Bugun, Pul, Xaridlar, Oila, Yana. Barcha boshqa bo‘limlar «Yana» orqali ochiladi.

HTTPS/localhost va bir marta muvaffaqiyatli kirishdan so‘ng service worker dastur fayllarini saqlaydi. API javoblari Cache Storagega yozilmaydi. Oxirgi oilaviy snapshot va yuborilmagan o‘zgarishlar avvalgi mahalliy saqlash tartibida qurilmada qoladi. Internet uzilganda shu nusxa ochiladi, banner serverga yetib bormaganini bildiradi. Internet qaytganda versiya tekshiruvi bilan yuboriladi; to‘qnashuv bo‘lsa foydalanuvchi nusxani tanlaydi. Chiqishda offline snapshot o‘chiriladi. Shaxsiy hamyon va auth operatsiyalari internet talab qiladi. Qurilma xotirasi o‘chirilsa mahalliy nusxa ham o‘chadi.

## SMS va email adapteri

Public kirish sahifasida telefon orqali kirish va parolni tiklash bor. Haqiqiy xizmat uchun administrator boshqaradigan CommonJS modulini sozlang:

```
BARAKA_ACCESS_ADAPTER=/absolute/path/to/access-adapter.cjs
```

Oddiy `npm start` `.env` faylini avtomatik o‘qimaydi: o‘zgaruvchilarni runtime orqali bering. Compose ishlatilsa adapter yo‘li konteyner ichidagi yo‘l bo‘lishi va modul image ichiga qo‘shilishi kerak. `npm run services:check` sozlamalar mavjudligini tekshiradi; bu haqiqiy yetkazishni tasdiqlamaydi.

Modul ixtiyoriy ikkita async metod beradi:

```js
module.exports = {
  async sendCode({ phone, code, expiresIn }) {
    // Shartnoma tuzilgan SMS operatoriga serverdan yuboring.
    // Muvaffaqiyatsizlikda xato tashlang; kodni logga yozmang.
  },
  async sendRecovery({ email, token, expiresIn }) {
    // Email xizmatiga serverdan yuboring. Xatda bir martalik kodni
    // va Baraka sahifasidagi parol tiklash oynasiga qaytish yo‘lini bering.
  }
};
```

Adapter yo‘q bo‘lsa 503 va tushunarli xabar qaytadi; soxta yuborildi holati ko‘rsatilmaydi. SMS kodi 5 daqiqa va 5 urinish, qayta ishlamaydi. OTP holati xotirada: server qayta boshlansa kod qayta olinadi. Telefon tasdiqlansa mavjud telefon hisobiga kiriladi yoki yangi hisob yaratiladi. Hozir bu mavjud email hisobiga telefonni bog‘lash emas; telefon bilan yangi mustaqil hisob ochiladi. Email kodi 30 daqiqa, bazada faqat xeshi saqlanadi. Tiklash barcha oldingi sessiyalarni bekor qiladi. Alohida IP/telefon/email cheklovlari bor.

## Telegram

```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_BOT_NAME=your_bot_name
```

Sozlamalar → Telegram → Botni ulash. Foydalanuvchi 10 daqiqalik shaxsiy havolani ochib botda Start bosadi va saytda tasdiqlaydi. Server Telegramdan xususiy chatda aynan shu kod kelganini tekshiradi; ixtiyoriy chat IDga obuna qilib bo‘lmaydi. Botni ushbu dasturga ajrating: u `getUpdates` ishlatadi, webhook rejimi yoki boshqa bot iste’molchisi bilan birga ishlatilmaydi. So‘nggi 100 update ichida kod topilmasa yangi havola yarating.

Faqat foydalanuvchi yoqqanidan keyin, server ishlab turganda, muddati kelgan reja/to‘lov/qarz uchun kuniga bitta umumiy xabar yuboriladi. Summalar va reja matni Telegramga berilmaydi. Xabar yuborish natijasi noma’lum bo‘lsa shu kuni qayta yuborilmaydi. Sozlamalardan o‘chiriladi. Testlar haqiqiy Telegram yoki SMS yubormaydi.

## Tekshiruv va qolgan tashqi ishlar

`npm run check` va `npm test`: tez summa, takror xarid, nasiya sanalari va qoldiq, pul kelishi, ko‘rsatkichlar, shaxsiy ruxsatlar, bolalar cheklovi, cho‘ntak puli, SMS bir martaligi, parol tiklash, Telegram ulash va xabarning mazmuni.

Haqiqiy qurilmada offline/PWA, rasm olish va vizual ko‘rinish hali alohida sinovdan o‘tkazilishi kerak. SMS/email operatori, real bot, kommunal/bank va transport operatorlari, HTTPS hosting ulanishlari tashqi sozlamalar talab qiladi. 15–20 oila bilan to‘rt haftalik pilot hali o‘tkazilmagan. Talabni baholash mezonlari: xarajat kiritish vaqti, ikkinchi a’zo qo‘shilishi, haftalik qaytish va to‘rtinchi haftadagi foydalanish. Bu ishlar koddagi testlar o‘rnini bosmaydi.
