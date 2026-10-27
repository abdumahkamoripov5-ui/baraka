# Barakani Vercel + Neon’da joylashtirish

Vercel frontend va Node Functions’ni, Neon esa PostgreSQL bazasini ishlatadi. Vercel ichidagi vaqtinchalik fayllar foydalanuvchi bazasi sifatida ishlatilmaydi. Mahalliy `npm start` avvalgidek JSON bilan ishlaydi; Vercel alohida PostgreSQL kirish nuqtasidan foydalanadi.

Bu yo‘l uchun GitHub majburiy emas: mahalliy `baraka/` papkasini Vercel CLI bilan yuboramiz. Ushbu qo‘llanma deploy bajarilganini bildirmaydi. Hisoblar, loyiha va ulanish sozlamalarini egasi yaratishi kerak.

## 1. Bepul hisoblar

1. https://vercel.com/signup orqali Vercel hisobini oching. Shaxsiy/notijorat foydalanish uchun **Hobby** tanlang.
2. https://console.neon.tech orqali Neon hisobini oching va **Free** rejasida `baraka` loyihasini yarating.
3. Neon’da bazani va Vercel funksiyasini imkon qadar yaqin hududlarda ishlating. Kichik sinov uchun standart hududdan boshlash mumkin.

Pullik rejani yoqish kerak emas. Bepul limitlar cheksiz xizmatni anglatmaydi; Vercel va Neon’dagi Usage sahifalarini kuzating. Neon Free’da karta talab qilinmaydi. Vercel Hobby tijoriy foydalanishga mo‘ljallanmagan.

## 2. Neon ulanish manzili

1. Neon loyihasida **Connect** tugmasini bosing.
2. **Connection pooling**ni yoqing.
3. `postgresql://...` bilan boshlanuvchi connection string’ni nusxalang. Host odatda `-pooler`ni o‘z ichiga oladi. Neon bergan TLS parametrlarini saqlang.
4. Uni keyin Vercel’da `DATABASE_URL` nomi bilan saqlaysiz. Bu parol saqlovchi maxfiy qiymat: chatga, Git’ga yoki frontendga qo‘ymang.

Jadvallar birinchi API so‘rovida avtomatik yaratiladi. Supabase, alohida Volume yoki qo‘lda SQL yozish talab qilinmaydi.

## GitHub orqali import qilayotgan bo‘lsangiz

GitHub repositoriyasi `abdumahkamoripov5-ui/baraka`da ilova ichki `baraka/` papkasida joylashgan. Vercel import oynasida **Root Directory → Edit → baraka**, **Application Preset → Other** tanlang. Build Command `npm run check`, Output Directory `vercel-public`; konfiguratsiya `baraka/vercel.json`dan olinadi. “Possible configuration mismatch” aniqlangan Container turi bilan qo‘lda tanlangan Other farqini bildirishi mumkin; ilova ildizini to‘g‘ri tanlash zarur.

GitHub yo‘lida quyidagi CLI bog‘lash qadami kerak emas. Xususiy kirish, Neon va `DATABASE_URL` / `APP_ORIGIN` qadamlari ikkala yo‘lga ham tegishli.

## 3. Kompyuterdagi loyihani Vercel’ga bog‘lash

Windows PowerShell’da quyidagilarni bittadan bajaring. Node.js 22 o‘rnatilgan bo‘lsin.

```powershell
cd C:\Users\projects\family_app\baraka
npx vercel login
npx vercel link
```

`npx` Vercel CLI’ni o‘rnatishni so‘rasa `y` deb javob bering. Login brauzerda hisobni tasdiqlashni so‘raydi.

`link` savollariga:

- **Set up this directory?** → `Y`
- **Which scope?** → o‘z hisobingiz
- **Link to existing project?** → yangi loyiha bo‘lsa `N`
- **Project name?** → noyob nom, masalan `baraka-ismingiz`
- **Directory?** → `./`

Vercel loyihasining ildizi aynan `baraka/` bo‘lishi kerak. Tashqi `family_app/` bilan adashtirmang. Framework kerak bo‘lsa **Other** tanlanadi. `vercel.json` build va yo‘naltirishni belgilaydi; `dist`ni Output Directory sifatida alohida tanlamang.

## 4. Avval xususiy kirishni saqlash

Vercel boshqaruv panelida shu loyihani oching:

**Security → Deployment Protection → Vercel Authentication → All Deployments → Save**.

Bu oldingi xususiy auditoriya tanlovini saqlaydi. Vercel’ning 2026-09-09 yangiligiga ko‘ra bu himoya barcha rejalarda bepul. Interfeys boshqa joyda bo‘lsa loyiha Settings ichidan Deployment Protection’ni qidiring. Himoya yoqilmaguncha oilaviy bazani ulab production chiqarishni davom ettirmang.

## 5. Birinchi deploy va sayt manzili

```powershell
npx vercel --prod
```

Bu birinchi bosqichda sayt fayllarini chiqaradi; `DATABASE_URL` va `APP_ORIGIN` hali kiritilmagan bo‘lsa kirish ishlamaydi va API 503 qaytaradi. Bu sozlashning vaqtinchalik bosqichi.

Vercel loyihasining **Settings → Domains** bo‘limidan asosiy, o‘zgarmaydigan production manzilini oling. Masalan: `https://baraka-ismingiz.vercel.app`. Har bir deployga beriladigan uzun vaqtinchalik URL’ni olmang.

## 6. Ikki sozlamani kiritish

**Settings → Environment Variables** ichida quyidagilarni **Production** muhiti uchun yarating:

| Nomi | Qiymati |
|---|---|
| `DATABASE_URL` | Neon’dan olingan maxfiy pooled connection string |
| `APP_ORIGIN` | Asosiy HTTPS manzil, masalan `https://baraka-ismingiz.vercel.app` |

`APP_ORIGIN` oxirida `/` bo‘lmasin. Misol matnini o‘z manzilingiz bilan almashtiring. Maxfiy kalitlar uchun `NEXT_PUBLIC_` kabi prefiks ishlatmang. `PORT`, `HOST`, `BARAKA_DATA_DIR`, `PUSH_CONTACT` va operator tokenlarini kiritish talab qilinmaydi.

Preview uchun alohida baza va o‘sha preview’ga mos `APP_ORIGIN` kerak. Production bazasini preview’ga ham ulashdan saqlaning: preview’da qilingan o‘zgarishlar ham shu bazaga tushadi.

Sozlamalar saqlangach qayta yuboring:

```powershell
npx vercel --prod
```

## 7. Ishlashini tekshirish

1. Asosiy HTTPS manzilini oching va Vercel himoyasidan o‘z hisobingiz bilan o‘ting.
2. Shu manzilga `/api/status` qo‘shib oching: `server: true`, `hosting: "vercel"`, `push.ready: false` bo‘lishi kerak.
3. Barakada yangi hisob yarating. Chiqib, shu parol bilan qayta kiring.
4. Bitta xarajat kiriting, sahifani yangilang va yozuv saqlanganini tekshiring.
5. Telefoningizda ham xususiy deployga kirish huquqi bilan ochib tekshiring. Keyin oila taklif kodini va ikkinchi hisobni sinang.
6. Qayta deploydan keyin ham hisob va yozuvlar saqlanganini tekshiring.

503 bo‘lsa Environment Variables va Neon ulanish holatini tekshiring. 403 / «So‘rov manbasi mos emas» bo‘lsa brauzer manzili `APP_ORIGIN` bilan aynan mos bo‘lsin; asosiy manzildan foydalaning. Vercel Function loglarini tekshirish mumkin, lekin DATABASE_URL’ni logga chiqarmang.

## Mavjud ma’lumotlarni ko‘chirish

Yangi Neon bazasi dastlab bo‘sh. Mahalliy `data/database.json` avtomatik yuklanmaydi va Vercel’ga yuborilmaydi. Eski hisob va oilaviy ma’lumotlarni ko‘chirish uchun mahalliy baza nusxasini saqlab qo‘ying; faqat **bo‘sh Neon bazasiga** quyidagi importni qo‘llash mumkin.

Maxfiy qiymatni mahalliy, Git’dan chetlatilgan `.env.vercel.local` fayliga yozing:

```dotenv
DATABASE_URL=NEON_DAN_OLINGAN_MAXFIY_MANZIL
```

Node 22 bilan, `baraka/` ichida:

```powershell
npm ci
node --env-file=.env.vercel.local scripts/import-postgres.cjs data/database.json
```

Import manba faylini o‘zgartirmaydi va foydalanuvchisi mavjud Neon bazasiga yozishni rad etadi. Eski parollar saqlanadi, lekin sessiyalar, takliflar va qurilma/Telegram ulanishlari bekor qilinadi: yangi manzilda qayta kiring. Agar avval 7-qadamda test hisob yaratgan bo‘lsangiz import uchun alohida bo‘sh Neon baza yarating; mavjud bazani o‘chirib tashlamang.

## Vercel variantining chegaralari

- Moliya, email/parol orqali kirish, oilaviy/shaxsiy hisob va revision bilan sinxronlash ishlaydi.
- Faol oynada oilaviy yangiliklar avtomatik 60 soniyada olinadi. O‘z tahriringiz odatdagidek yuboriladi; «Yangilash» orqali kutmasdan olish mumkin.
- Avtomatik push, qo‘ng‘iroq, SMS OTP, email tiklash, Telegram va haqiqiy kommunal to‘lov Vercel kirish nuqtasida ulanmagan. Xizmat operatorlari va jadvalni alohida moslashtirish zarur. Ularning tayyorligi haqida soxta ma’lumot berilmaydi.
- Barcha oilalar hozir PostgreSQL’dagi bitta JSONB snapshotda; tranzaksiya qulfi bir vaqtdagi yozuvlarni himoyalaydi. Bu kichik oilaviy pilot uchun, katta auditoriya uchun alohida jadvallar va har oilaga tegishli tranzaksiyalar kerak. Bepul limitlarda nechta foydalanuvchi sig‘ishini oldindan kafolatlamaydi.
- Vercel Authentication saytni xususiy saqlaydi; Barakaning o‘z login va oila ruxsatlari ham qo‘llanadi. Saytni hammaga ochish alohida qaror.

## Tekshiruv buyruqlari

```powershell
npm run check
npm test
```

`tests/vercel.test.cjs` ichidagi haqiqiy PostgreSQL testi faqat `TEST_DATABASE_URL` berilsa ishlaydi. U **vaqtinchalik alohida bazada** ishlatilishi shart: shu bazadagi `baraka_snapshot` jadvalini yaratib/o‘chiradi. Production URL’ni bu o‘zgaruvchiga bermang.

Manbalar:

- [Vercel CLI orqali joylashtirish](https://vercel.com/docs/projects/deploy-from-cli)
- [Vercel Node Functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel konfiguratsiyasi](https://vercel.com/docs/project-configuration)
- [Barcha deploylarni bepul himoyalash, 2026-09-09](https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan)
- [Vercel Hobby shartlari](https://vercel.com/legal/terms)
- [Neon Free va limitlar](https://neon.com/pricing)
