# Baraka 4.0 — Bugun, namoz, transport va qo‘ng‘iroqlar

## Ochish

Eski serverni Ctrl+C bilan to‘xtating, loyiha ildizida `npm start` ni qayta bajaring. http://localhost:3000 sahifasini Ctrl+F5 bilan yangilang. Bosh sahifa endi **Bugun**. Moliya oldingi menyuda saqlangan. Telefonning pastki menyusini surish orqali qo‘shimcha bo‘limlarni ochish mumkin.

## Nima ishlaydi, nimaga tashqi ulanish kerak?

| Bo‘lim | Kodda bajarilgan | Jonli ishga tushirish holati |
|---|---|---|
| Bugun | Vazifa, uchrashuv, eslatma, to‘lov va qarzlarni birga ko‘rish | Mahalliy rejim va server oilaviy hisobida ishlaydi |
| Rejalar | Sana/vaqt, a’zo, muhimlik, joy, qidirish, bajarildi, tahrirlash va o‘chirish | Mavjud server saqlashi va zaxira nusxalariga ulangan |
| Ovozli signal | Web Audio signali, oldindan eslatish va takror signalni cheklash | Foydalanuvchi yoqqandan keyin, sayt ochiq turganda; OS budilnigi emas |
| Namoz vaqti | AlAdhan API: shahar, sana, usul, hanafiy asr hisobi, vaqt zonasi | Internetdagi manbaga ulanish kerak; bu muhitda faqat kontrakt testlari bajarilgan |
| Bekat va yo‘nalish | OpenStreetMap/Overpass qidiruvi, foydalanuvchi xohlasa GPS nuqtasi, OSM xarita | Internet kerak; jamoaviy xarita, operatorning rasmiy jadvali emas |
| Avtobusning jonli GPS / kelishi | Operator adapteri, yangi GPS pinlari, operator ETA’si, eskirganini yashirish | Transport operatori hali ulanmagan; soxta avtobus/ETA yo‘q |
| Telefon qo‘ng‘irog‘i | Twilio Calls API, shaxsiy rozilik, jadval, imzolangan holat callbacki | Operator hisobi, HTTPS, tasdiqlangan raqamlar kerak; haqiqiy qo‘ng‘iroq qilinmagan |
| Kommunal | Oldingi abonent hisobi, server orderi va tekshirilgan callback arxitekturasi | Operator shartnomasi va real adapter hali taqdim etilmagan; to‘lash o‘chiq |

## Rejalar va vaqt

Vazifa / uchrashuv vaqti brauzer qurilmasining mahalliy soatiga ko‘ra kiritiladi. Telefon qo‘ng‘irog‘i rejalashtirilayotganda u aniq UTC timestampga aylantiriladi. Namoz vaqtlari alohida tanlangan shaharning vaqt zonasida ko‘rsatiladi.

Faol oiladagi rejalar oila a’zolariga ko‘rinadi. Tugallangan yoki o‘chirilgan reja uchun kutilayotgan qo‘ng‘iroq serverning keyingi tekshiruvida bekor qilinadi. Rejaning nomi/sanasi/vaqti o‘zgarsa, oldingi qo‘ng‘iroq ham bekor qilinadi: yangisini o‘zingiz rejalashtiring.

Saytdagi ovozni **Bugun → Yoqish** orqali faollashtiring. “Sinash” va “O‘chirish” mavjud. Tab/OS to‘xtatilsa yoki sayt yopilsa, Web Audio signaliga tayanib bo‘lmaydi. Telefon qo‘ng‘irog‘i mustaqil server mexanizmi.

## Namoz vaqtlari

**Namoz vaqtlari** bo‘limida shaharni tanlang (boshlang‘ich tanlov Toshkent), sanani va hisoblash usulini belgilang, **Yangilash**ni bosing. Ko‘rsatilgan 6 vaqt: bomdod, quyosh, peshin, asr, shom, xufton.

Manba — [AlAdhan](https://aladhan.com/prayer-times-api). Bu hisoblangan jadval. UI buni aniq ko‘rsatadi; mahalliy masjid yoki O‘zbekiston musulmonlari idorasi tasdiqlagan jadval bilan bir xil deb da’vo qilinmaydi. So‘rov shahar katalogidagi qat’iy koordinata va vaqt zonasidan tuziladi, foydalanuvchi serverga istalgan tashqi URL yubora olmaydi. Javob sanasi va vaqt formati tekshiriladi; manba ishlamasa o‘rniga namunaviy vaqt qo‘yilmaydi.

## Transport

**Transport → Bekatlarni ko‘rsatish** tanlangan shahar markazi atrofidagi 1,5 km hududni so‘raydi. **Menga yaqin** brauzer ruxsati bilan bir martalik joylashuv oladi. GPS nuqtasi tanlangan shaharga yaqin bo‘lishi kerak. Joylashuv oilaviy bazada saqlanmaydi, lekin tashqi xarita xizmatiga qidiruv uchun yuboriladi.

Xarita foydalanuvchi bosgandan keyin OSM tile rasmlarini yuklaydi; attribution ko‘rsatiladi. OSM rasmlari uchun odatiy browser cache ishlaydi, yuklab olish/prefetch/offline tile saqlash implementatsiyasi yo‘q. Katta trafik uchun o‘z tile provayderingizni tanlash kerak. [OSM tile siyosati](https://operations.osmfoundation.org/policies/tiles/).

Jonli transport uchun `BARAKA_TRANSIT_ADAPTER` serverdagi ishonchli modulning mutlaq yo‘li. Hozir bunday modul o‘rnatilmagan. Tanlangan operatorning ruxsatli API’si / GTFS-Realtime manbasiga modulni yozish kerak. Kutilgan kontrakt:

```js
module.exports = {
  async snapshot({ cityId, latitude, longitude }) {
    // Operatorga real, ruxsatli so‘rov yuboring.
    return {
      source: 'Haqiqiy operator nomi',
      routes: [{ id, ref, name }],
      stops: [{ id, name, lat, lon }],
      vehicles: [{ id, routeId, lat, lon, updatedAt }],
      arrivals: [{ stopId, routeId, expectedAt, updatedAt }]
    };
  }
};
```

IDlar harf/raqam/_/- dan iborat bo‘lsin, vaqtlar Unix **millisekund**. `updatedAt` 2 daqiqadan eski bo‘lsa, GPS jonli xaritadan yashiriladi va ETA olinmaydi. Jonli operator ulanganida ochiq Transport sahifasi taxminan 30 soniyada yangilanadi; tab qayta ochilganda ham yangilash so‘raladi. ETA operatorning prognozi; masofa/tezlikdan to‘qib hisoblanmaydi. City/source to‘g‘riligi va ma’lumotlarni ulash huquqi adapter egasi tomonidan tekshiriladi.

## Haqiqiy telefon qo‘ng‘irog‘i

Operator: [Twilio Calls API](https://www.twilio.com/docs/voice/api/call-resource). Qo‘ng‘iroq xizmatiga haq olinishi mumkin. Hozir hech qanday haqiqiy qo‘ng‘iroq yuborilmagan va kalitlar sozlanmagan.

Server administratoriga kerakli o‘zgaruvchilar:

- `VOICE_TWILIO_ACCOUNT_SID`
- `VOICE_TWILIO_AUTH_TOKEN`
- `VOICE_FROM_NUMBER`: operator tasdiqlagan jo‘natuvchi, E.164.
- `VOICE_RECIPIENTS_JSON`: email → oldindan tekshirilgan shu foydalanuvchiga tegishli telefon xaritasi. Administrator raqam egasini va ulashga roziligini tashqi tartibda tekshiradi. Dasturda SMS OTP orqali tasdiqlash hali yo‘q.
- `APP_ORIGIN`: haqiqiy HTTPS sayt manzili; operator shu yerga callback yuborishi kerak.

Maxfiy kalitlarni suhbatga yubormang, brauzerda saqlamang va Gitga qo‘shmang. `.env.example` faqat nomlar/namuna ko‘rsatadi. Oddiy `npm start` `.env` ni avtomatik o‘qimaydi — runtime environment yoki Compose orqali bering.

Foydalanuvchi **Bugun → Qo‘ng‘iroqli eslatma** oynasida o‘z tasdiqlangan raqamini niqoblangan ko‘rinishda ko‘radi va alohida rozilik beradi. Keyin reja qatoridagi qo‘ng‘iroq/eslatma tugmasidan vaqt tanlaydi. Ixtiyoriy `To` raqamini yuborish ishlamaydi: server faqat shu login uchun administrator tasdiqlagan raqamni tanlaydi.

Cheklovlar:

- Vaqt 1 daqiqadan keyin, ko‘pi bilan 7 kun va sessiya muddati ichida.
- Eng ko‘pi 5 ta kutilayotgan eslatma, 3 ta urinish / 24 soat, urinishlar oralig‘i kamida 1 daqiqa.
- Bir reja uchun bir vaqtning o‘zida bitta faol qo‘ng‘iroq.
- Yuborishdan oldin holat diskka yoziladi. Javob noma’lum bo‘lsa avtomatik takrorlanmaydi.
- Server 15 soniyada tekshiradi; 15 daqiqadan ko‘p kech qolgan eslatmani yubormaydi. Bu favqulodda signal yoki kafolatlangan aniq soniyali budilnik emas.
- Rozilikni o‘chirish, sessiyadan chiqish yoki oilaviy ruxsatni bekor qilish kutilayotgan qo‘ng‘iroqlarni to‘xtatadi. Operatorga allaqachon yuborilgan qo‘ng‘iroqni bu versiya bekor qilmaydi.
- Qo‘ng‘iroq umumiy inglizcha eslatma aytadi. O‘zbekcha audio/TTS manbasi hali ulanmagan. Rejaning shaxsiy mazmuni operatorga berilmaydi.
- `queued` — operator qabul qilgan, `ringing` — jiringlamoqda, `completed` — yakunlangan. Bu holatlar bir-biri o‘rnida “muvaffaqiyat” deb ko‘rsatilmaydi.
- Callback [Twilio imzosi](https://www.twilio.com/docs/usage/webhooks/webhooks-security) bilan butun URL va parametrlar asosida tekshiriladi. Begona imzo va mos kelmagan CallSid rad etiladi.

## Tekshiruv

`npm run check` va `npm test`. Testlar soxta tashqi javoblar va vaqtinchalik bazalar bilan ishlaydi: real qo‘ng‘iroq qilmaydi, pul sarflamaydi, transport operatoriga so‘rov yubormaydi.

Haqiqiy brauzer/telefon namoyishi, AlAdhan va Overpass’ga ushbu muhitdan jonli ulanish, transport operatori, haqiqiy qo‘ng‘iroq va kommunal sandbox hali tekshirilmagan. Haqiqiy foydalanuvchilarga ulashdan oldin operatorlar bilan shu tekshiruvlar talab qilinadi.
