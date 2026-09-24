# TaskDrop Sync Relay (Cloudflare Worker)

سرورلس رله برای همگام‌سازی ابری و امن دیتابیس `TaskDrop` با استفاده از Cloudflare Workers و KV.

## مراحل راه‌اندازی (فقط ۱ بار):

۱. ورود به پوشه و ایجاد KV Namespace:

```bash
cd cloudflare
npx wrangler kv namespace create TASKDROP_VAULTS
```

این دستور یک `id` به شما می‌دهد. آن را در فایل `wrangler.jsonc` در بخش `id` قرار دهید.

۲. (اختیاری ولی توصیه می‌شود) تنظیم توکن امنیتی سرور برای جلوگیری از استفاده دیگران:

```bash
npx wrangler secret put AUTH_TOKEN
```

در پرامپت، یک کلمه عبور امن برای توکن سرور وارد کنید.

۳. دیپلوی با یک دستور:

```bash
npx wrangler deploy
```

پس از پایان، کلودفلر به شما آدرسی شبیه به این می‌دهد:
`https://taskdrop-sync-relay.YOUR_SUBDOMAIN.workers.dev`

این آدرس و توکن را در بخش **«همگام‌سازی ابری»** داخل اپلیکیشن `TaskDrop` وارد کنید!
