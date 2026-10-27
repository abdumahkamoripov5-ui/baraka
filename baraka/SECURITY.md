# Xavfsizlik tekshiruvi — Baraka 4.0

Kod va avtomatlashtirilgan testlar darajasida tekshirildi. Bu mustaqil pentest yoki xavfsizlik sertifikati emas. Serverga joylashtirish, brauzer va haqiqiy to‘lov operatori hali alohida tekshirilishi kerak.

## Tuzatilgan va tekshirilgan holatlar

1. **Oilalar orasida ma’lumot ajratilishi.** Barcha moliyaviy API so‘rovlari server sessiyasi va oilaga a’zolik orqali tekshiriladi. Client yuborgan userId ishonchli hisoblanmaydi. Faol oilaning IDsi mos kelmasa yozish rad etiladi. A’zo chiqarilganda eski oilaga yozolmaydi.
2. **Sessiya va parol.** 32 bayt tasodifiy session token; bazada faqat SHA-256 xeshi. Cookie HttpOnly, SameSite=Strict, HTTPS’da Secure. Parol alohida 16 bayt salt bilan scrypt N=65536, r=8, p=2 orqali xeshlanadi. Foydalanuvchi tanlagan bo‘sh bo‘lmagan parol, 128 belgigacha; alohida raqam/harf tarkibi yoki minimal uzunlik talabi yo‘q. Bir paytda eng ko‘pi 2 parol xeshlash, IP va emailga limit. Hozirgi parol bilan yangilash boshqa sessiyalarni bekor qiladi. Login/parol almashinuvi orasidagi asinxron poyga ham tekshiriladi.
3. **CSRF.** Yozuvchi API aniq APP_ORIGIN va application/json talab qiladi. Operator callbacki alohida: uning autentifikatsiyasi real adapter mas’uliyati. Begona origin, oddiy form body va noma’lum sessiya testlarda rad etiladi.
4. **Ma’lumot yo‘qolishi.** Oilaviy yozuvlar revision orqali saqlanadi. Eskirgan nusxa 409 qaytaradi. Poll kelayotgan paytda yaratilgan mahalliy o‘zgarish eski javob bilan almashtirilmaydi. Ulanish uzilganda pending nusxa saqlanadi. Kirish/chiqish boshqa oynaga hodisa orqali bildiriladi; shaxsiy ma’lumotlar umumiy mehmon hisobiga yozilmaydi.
5. **Takliflar.** 32 bayt tasodifiy bir martalik kod, bazada faqat xeshi, 24 soat muddat. Kodni oila egasi yaratadi. Noto‘g‘ri, takror ishlatilgan va eskirgan kodlar rad etiladi.
6. **Pul tasdig‘i.** Checkout faqat administrator ruxsat bergan HTTPS domenida. Faqat adapter tasdiqlagan callback order va aynan kutilgan summaga mos kelsa “paid”. Idempotent qayta ishlash ikki marta xarajat yaratmaydi. Jarayondagi to‘lov hamyonini o‘chirish taqiqlangan. Tayyorlanmagan operator 503 qaytaradi; soxta qoldiq yo‘q.
7. **Server fayllari.** HTTP faqat belgilangan frontend fayllarini tarqatadi. .env, database.json, push-key.json va server kodi ochilmaydi. Disk yozuvi temporary fayl + fsync + rename bilan atomik. Yozish xatosida xotiradagi baza o‘zgarmaydi. Buzuq baza jimgina yangi bazaga almashtirilmaydi. Bir data papkasiga bitta server jarayoni uchun lock bor.
8. **Kirish validatsiyasi.** Server va brauzer bir xil modelni ishlatadi. Summalar butun va chegaralangan, sanalar haqiqiy, IDlar cheklangan belgilar bilan, takror IDlar rad etiladi. Upload/request hajmi va yozuvlar soni cheklangan. CSV formula boshlovchi qiymatlar himoyalangan. Dinamik matn HTMLga chiqarilishdan oldin escape qilinadi.
9. **Push.** Faqat ma’lum HTTPS push operatorlari; begona URL orqali ichki tarmoqqa so‘rov yuborib bo‘lmaydi. VAPID imzosi kriptografik tekshiruvdan o‘tadi. Push moliyaviy mazmunsiz, kalit serverda. Sessiya tugasa scheduler yubormaydi. 404/410 obunalar olib tashlanadi.
10. **Brauzer/headerlar.** X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy va CSP bor. API javoblari no-store. Tashqi checkout noopener/noreferrer bilan ochiladi. Server so‘rov va header timeoutlarini cheklaydi.

## Qolgan cheklovlar

- **Haqiqiy kommunal to‘lov hali ulanmagan.** Operator shartnomasi, real adapter, sandbox testlari, callback tekshiruvi va refund jarayoni bo‘lmaguncha real pul bilan ishga tushirmaslik kerak.
- **Hosting hali yaratilmagan.** Internet uchun HTTPS, server disk ruxsatlari, shifrlangan disk/zaxira va monitoringni sozlash kerak. Lokal HTTP cookie’da Secure qo‘llanmaydi; bu ishlab chiqish rejimi.
- **JSON bazasi bitta jarayon uchun.** Ko‘p auditoriya, ko‘p server, katta hajm va murakkab pul operatsiyalari uchun PostgreSQLga ko‘chirish lozim.
- **Email tasdiqlash, parolni email orqali tiklash va 2FA yo‘q.** Email login identifikatori, tasdiqlangan shaxs degani emas. Email xizmatiga ulanishdan oldin ommaviy ro‘yxatdan o‘tishni keng tarqatmaslik kerak.
- **Inline event handlerlar saqlangan.** CSP’da `script-src 'unsafe-inline'` bor; matn escape va qat’iy model mavjud, lekin kuchli CSP uchun handlerlarni alohida JS listenerlarga to‘liq ko‘chirish kerak. Bu tekshiruv uni “to‘liq yopilgan” deb hisoblamaydi.
- **Moliyaviy ma’lumotlar server diskida va JSON zaxirada ochiq formatda.** OS/volume shifrlashi va zaxira kirish huquqlarini hostingda sozlang. Pending nusxa localStorage’da qolishi mumkin; umumiy kompyuterda fayl/nusxalarni ehtiyot qiling.
- **Real brauzer/telefon/push operatori bilan test yo‘q.** Testlar Node VM, API dispatcher va soxta tashqi javoblarga asoslangan; to‘liq end-to-end, tashqi pentest va dependency/container skani o‘rnini bosmaydi.

## Test buyruqlari

Loyiha ildizida `npm run check` va `npm test`. Testlar vaqtinchalik papkada ishlaydi, haqiqiy bazani o‘zgartirmaydi va pul o‘tkazmaydi.

Manbalar:

- OWASP Password Storage: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP CSRF Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP Authentication: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- RFC 8292: https://www.rfc-editor.org/rfc/rfc8292
- Payme ulanish hujjati: https://developer.help.paycom.uz/nastroyka-vzaimodeystviya/

## 4.0 kundalik xizmatlar qo‘shimchasi

- Vazifa va uchrashuvlar server modeli bilan tekshiriladi; oilaviy ruxsat va revision himoyasi ularga ham tegishli. Oiladagi yozuvlar barcha ruxsatli a’zolarga ko‘rinadi.
- Namoz va xarita so‘rovlari faqat belgilangan tashqi hostlar va katalogdagi shaharlar bilan ishlaydi; ixtiyoriy URL/SQL/query kodi qabul qilinmaydi. Cache, so‘rov hajmi, timeout va bir vaqtdagi tashqi so‘rovlar cheklangan. Manba ishlamasa soxta vaqt yoki GPS berilmaydi.
- Joylashuv faqat foydalanuvchi tugmani bosganda olinadi. `Permissions-Policy` geolocation=(self) qilib shu funksiya uchun ochilgan; kamera/mikrofon yopiq. GPS koordinatalari oilaviy diskka yozilmaydi, lekin qidiruv uchun Overpass’ga yuboriladi. Xaritani ochishda OSM foydalanuvchi IP’sini ko‘radi; UI bu tashqi yuklashni alohida boshlaydi.
- Pullik qo‘ng‘iroq faqat serverda administrator tekshirgan email→telefon xaritasiga va shaxsiy opt-in’dan keyin yuboriladi. Frontenddagi raqam ishonchli deb olinmaydi. SMS OTP hali yo‘q; raqam egasini administrator tekshirishi kerak.
- Call joblar serverdagi shaxsiy yozuvlar, boshqa oila a’zosi ularni olib tashlay olmaydi. Sessiya, oilaviy a’zolik, rejaning o‘zgarmaganligi va rozilik yuborish paytida qayta tekshiriladi. Urinishdan oldin diskka yoziladi, unknown javob avtomatik takrorlanmaydi.
- Twilio callback URL+parametrlar bo‘yicha HMAC-SHA1 imzosi va doimiy vaqtli taqqoslash bilan tekshiriladi; CallSid tekshiriladi, kechikkan status avvalgi holatga qaytarmaydi. Operator kalitlari clientga berilmaydi.
- Haqiqiy qo‘ng‘iroq, transport GPS va kommunal operator hali ishga tushirilmagan. Testlar faqat contract/fake javoblar bilan; tashqi xizmatlarga pullik yoki foydalanuvchiga yo‘naltirilgan harakat bajarilmagan.
