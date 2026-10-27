# Budjet va oilaning sevimli joylari

Budjet va toifa limitining 80% qismi sarflanganda boshqaruv sahifasida ogohlantirish va bildirishnomalar ro‘yxatida eslatma chiqadi. Faqat joriy oy, bugungacha kiritilgan xarajatlar hisoblanadi. Bu ogohlantirish sahifa ichida ishlaydi; telefon push xabari sifatida yuborilmaydi.

«Saqlangan joylar» bo‘limida istalgan manzilni nomi, manzili, izohi, shahri va saqlovchi oila a’zosi bilan qo‘shish, tahrirlash va o‘chirish mumkin. Joylar umumiy oila holati bilan serverda va JSON zaxira nusxada saqlanadi. Bir xil oilaga ulangan hisoblar ularni ko‘radi. Saqlovchi nomi alohida kirish ruxsati emas.

Piyoda, avtomobil va transport tugmalari tashqi Google Maps orqali yo‘l ochadi. API kaliti talab qilinmaydi. Manzilni aniq belgilash uchun koordinata qo‘shish tavsiya etiladi. Formadagi GPS tugmasi faqat foydalanuvchi hozir turgan joyini oladi, uzoqdagi restoran koordinatasini topmaydi.
https://developers.google.com/maps/documentation/urls/get-started

«Yaqin bekatlar» koordinatadan 1500 metr atrofidagi OSM bekatlarini oladi. Yo‘nalish faqat OSM relation a’zoligi yoki operator bergan stopIds/routeIds bilan tasdiqlansa ko‘rsatiladi. Bu to‘liq sayohat rejalashtiruvchisi emas: almashishlar va ikki bekat orasidagi qatnovni yo‘l tugmasidan tekshiring. OSM ma’lumoti to‘liq bo‘lmasligi mumkin. Transport bo‘limidagi bekatni ham saqlash mumkin.

## Jonli avtobus GPS uchun murojaat namunasi

Toshkent shahar transport boshqarmasining rasmiy sahifasi:
https://toshkent.mintrans.uz/management

Baraka oilaviy ilovasida yo‘lovchilarga jamoat transporti ma’lumotlarini ko‘rsatish uchun quyidagi ma’lumotlarga o‘qish huquqini so‘raymiz:
- Bekatlar koordinatasi va ularning yo‘nalishlarga bog‘lanishi;
- Avtobuslarning jonli GPS koordinatasi, route_id va yangilangan vaqt belgisi;
- Bekatga taxminiy yetib kelish vaqti (mavjud bo‘lsa);
- API hujjati va test javobi, endpoint, autentifikatsiya usuli;
- So‘rovlar cheklovi, foydalanish va qayta ko‘rsatish shartlari;
- GTFS / GTFS-Realtime mavjud bo‘lsa, ularga kirish tartibi.

API kalitini brauzer kodi yoki GitHubga joylamang. BARAKA_TRANSIT_ADAPTER server modulining snapshot({cityId,latitude,longitude}) usuli orqali ulanadi. Modul {source,stops,routes,vehicles,arrivals} qaytaradi. Vaqtlar Unix millisekundlarda. routes[].stopIds va stops[].routeIds ixtiyoriy, mavjud identifikatorlarga bog‘lanadi. Eski GPS nuqtalar jonli xaritada yashiriladi. Amaldagi shartnoma uchun baraka/lib/city-services.cjs normalizeTransit funksiyasini ko‘ring.

Serverni qayta ishga tushirib, brauzerda Ctrl+F5 bosing. Avvalgi holat backups/baraka-before-favorites-budget-20261020.tar.gz faylida.
