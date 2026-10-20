# Haqiqiy xizmatlarni ishga tushirish

## Hisob va oilaviy server

`npm start` Node serverini ishga tushiradi. Yangi server `baraka/data/` papkasini yaratadi. Unda foydalanuvchilar, scrypt parol xeshlari, sessiya tokenlarining xeshlari, oilaviy hisoblar va to‘lov holatlari saqlanadi. Bu papka HTTP orqali tarqatilmaydi va Git/Docker build kontekstiga kiritilmaydi.

Brauzerdan **Kirish → Hisob yaratish**. **Oila budjeti → Taklif kodi** orqali kod oling. Boshqa foydalanuvchi o‘z hisobidan **Oilaga qo‘shilish**ni tanlaydi. Kod bir martalik, 24 soat amal qiladi. Oldingi shaxsiy oila saqlanadi; **Sozlamalar → Faol oila** orqali almashiladi.

Bir xil serverga kirgan brauzerlar ma’lumotlarni 10 soniyagacha bo‘lgan oraliqda yangilaydi. Bir vaqtdagi tahrirlar versiya orqali tekshiriladi: farq chiqsa avtomatik ustidan yozilmaydi. Mahalliy yuborilmagan nusxa saqlanadi va foydalanuvchi nusxalarni tanlaydi.

Avvalgi localStorage hisobini serverga avtomatik ko‘chirmaymiz. **Sozlamalar → Qurilmadagi hisobni ko‘chirish** aniq tasdiqdan keyin faol oilaning nusxasini almashtiradi. Nusxa olishni avval bajaring.

## Internet / bulut

Mahalliy `http://localhost:3000` internetdagi bulut emas. Telefonlar turli tarmoqlardan birga ishlashi uchun doimiy Node hosting, saqlanadigan disk va HTTPS domeni kerak.

Repozitoriydagi `Dockerfile`, `compose.yaml`, `Caddyfile` bitta serverga joylashtirish uchun tayyorlangan. Docker mavjud hostingda:

1. `.env.example` ni `.env` ga nusxalang, o‘z domeningiz va aloqa emailingizni kiriting.
2. Domen DNS yozuvini serverga yo‘naltiring.
3. `docker compose up -d --build` ni bajaring.
4. `https://sizning-domeningiz` ni oching.

Bu konfiguratsiya shu muhitda Docker orqali ishga tushirib tekshirilmagan. Hosting resurslari hali yaratilmagan; domen va xizmat hisoblariga kirish taqdim etilmagan.

Node server o‘zi `.env` faylini yuklamaydi. Mahalliy ishlatishda o‘zgaruvchilarni PowerShell’da belgilang:

```powershell
$env:PUSH_CONTACT="mailto:sizning-emailingiz@example.com"
npm start
```

Boshqa manzilda tinglash uchun `HOST`, `PORT`, aniq tashqi manzil uchun `APP_ORIGIN`, ma’lumotlar diski uchun `BARAKA_DATA_DIR`. `APP_ORIGIN` oxirida `/` bo‘lmasin. Internet manzili HTTPS bo‘lishi shart. Tasodifiy `Origin` va foydalanuvchi yuborgan proxy headerlariga ishonilmaydi.

Ma’lumotlar bazasi hozir atomik yoziladigan JSON fayl. U bir Node jarayoni / kichik oilaviy o‘rnatish uchun. Ko‘p nusxali serverlarda ishlatmaslik kerak; parallel jarayonlar uchun lock mavjud. Katta auditoriya uchun tranzaksiyali PostgreSQL bazasi va migratsiya talab etiladi.

Server to‘xtatilgan paytda `baraka/data/` papkasining tashqi zaxira nusxasini oling. Disk va zaxiralarni shifrlash hosting darajasida sozlanadi.

## Telefon push eslatmalari

Tashqi paket o‘rnatish talab qilinmaydi. Node `crypto` bilan RFC 8292 VAPID imzosi yaratiladi; RFC 8030 bo‘yicha moliyaviy mazmunsiz push yuboriladi. Xususiy kalit bir marta `baraka/data/push-key.json` ga yoziladi va HTTP’da ochilmaydi.

Talablar:

- Ishlab turgan server va haqiqiy `PUSH_CONTACT` (`mailto:` aloqa manzili).
- HTTPS domeni; ishlab chiqishda `localhost` ham qo‘llanadi.
- Push API qo‘llaydigan brauzer va foydalanuvchining ruxsati. Ayrim telefonlarda saytni bosh ekranga o‘rnatish zarur bo‘lishi mumkin.

**Sozlamalar → Telefon eslatmalari → Yoqish**, so‘ng **Sinov bildirishnomasi**. Yaqin 3 kunlik yoki o‘tib ketgan to‘lov/qarz bo‘lsa, server bir daqiqada tekshiradi va har bir obunaga kuniga bir marta umumiy eslatma yuboradi (Asia/Tashkent kuni bo‘yicha). Xabar pul summasi va odam ismini oshkor qilmaydi. Eslatma sayt yopiq bo‘lsa ham kelishi mumkin, lekin server ishlab turishi va sessiya amal qilishi kerak. Chiqish/parolni almashtirish tegishli obunalarni bekor qiladi.

Protokol, imzo va scheduler sun’iy HTTP qabul qiluvchi bilan tekshirilgan. Haqiqiy push operatoriga yetkazish va telefondagi namoyish bu muhitda tekshirilmagan.

## Kommunal xizmatlarning real API ulanishi

**Hozir operator ulanmagan.** Elektr, gaz, suv, issiqlik va chiqindi abonent hisoblarini saqlash ishlaydi. UI qarzdorlik o‘rniga “Ma’lumot ulanmagan” deydi; to‘lash tugmasi operator ulanmaguncha o‘chiq.

Merchant orqali to‘lov qabul qilish bilan kommunal tashkilotlar abonent qarzdorligini olish / ular hisobiga pul o‘tkazish bir xil xizmat emas. Tanlangan operator yoki agregator bilan shartnoma, aniq xizmat identifikatorlari, balans API’si, checkout va callback hujjatlari kerak. Payme/Click merchant kalitining o‘zi kommunal bazaga kirish huquqini bermaydi.

Serverdagi operator moduli quyidagi tekshiriladigan kontraktga ulanadi. `BARAKA_UTILITY_ADAPTER` — maxfiy kalitlari brauzerga chiqmaydigan real modulning mutlaq yo‘li. Bu modul repo ichida soxta operator bilan to‘ldirilmagan.

```js
module.exports = {
  name: 'Shartnoma tuzilgan operator nomi',
  async lookup(account) {
    // Operatorning hujjatlashtirilgan API’siga real autentifikatsiyali so‘rov.
    // account: { id, name, service, accountNumber, region }
    // Butun UZS qiymatiga konvertatsiya qiling; operator qoldiq ma’nosini tekshiring.
    return { balance: /* operator qaytargan butun so‘m */ };
  },
  async createPayment(order) {
    // order: { paymentId, account, amount, currency:'UZS',
    //          idempotencyKey, callbackUrl, returnUrl }
    // Tiyin talab qilinsa shu modulda aniq konvertatsiya qilinadi.
    return { checkoutUrl: /* operator yaratgan HTTPS checkout */ };
  },
  async verifyWebhook(headers, rawBody) {
    // Avval operator belgilagan imzo/auth, vaqt va mazmunni tekshiring.
    // Baraka paymentId ni operatorning tasdiqlangan order mappingidan oling.
    // Tasdiqsiz inputni shunchaki verified:true qilib qaytarmang.
    return { verified: true, eventId, paymentId, amount, status: 'paid' /* yoki failed */ };
  }
};
```

`BARAKA_PAYMENT_ALLOWED_HOSTS` ni operatorning rasmiy checkout domenlari bilan vergul orqali to‘ldiring. Adapter moduli va maxfiy kalitlar server admini tomonidan o‘rnatiladi; foydalanuvchi so‘rovi modul yo‘lini boshqara olmaydi.

Ketma-ketlik: foydalanuvchi hisob/hamyon/summani tanlaydi → server pending order yaratadi → real operator checkout yaratadi → foydalanuvchi operator sahifasida tasdiqlaydi → operator imzolangan callback yuboradi → server summa va orderni tekshiradi → faqat shundan so‘ng xarajat va “To‘langan” holati yaratiladi.

Muhim xususiyatlar:

- Karta raqami, CVV yoki karta paroli Baraka API’sida olinmaydi.
- Return URLga qaytish to‘lov tasdig‘i hisoblanmaydi.
- Takror callback ikkinchi xarajat yaratmaydi.
- So‘rovni takrorlash uchun idempotency key mavjud. Bir xil kalitni boshqa hisob/summa uchun ishlatish rad etiladi.
- Noma’lum operator javobi “muvaffaqiyat” deyilmaydi; holat `unknown`, tekshirish talab qilinadi.
- Hozir qaytarish/refund va chargeback hisoblash implementatsiyasi yo‘q; operator hujjatlariga ko‘ra alohida ishlanadi. Shular va real sandbox tekshiruvi bo‘lmaguncha pul bilan jonli ishga chiqarilmaydi.

API kontrakti testlarda faqat test adapteri bilan tekshirilgan; bu real operator integratsiyasi tugaganini anglatmaydi.
