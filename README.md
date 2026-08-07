# نگار چوب پارمیس — Negar Choob Parmis

وب‌سایت رسمی نگار چوب پارمیس؛ تأمین چوب و فرآورده‌های چوبی و تجهیز تخصصی فضاهای هتلی،
رستورانی و اداری.

Static marketing site — plain HTML, CSS and vanilla JavaScript. No build step.

## ساختار

| مسیر | توضیح |
|---|---|
| `index.html` | صفحه اصلی |
| `about.html` | درباره ما |
| `contact.html` | تماس با ما |
| `project-*.html` | صفحات پروژه‌ها |
| `css/style.css` | تنها فایل استایل (design system) |
| `js/main.js` | تعاملات — بدون وابستگی خارجی |
| `shot-*.jpg` / `.webp` | تصاویر بریده‌شده و بهینه پروژه‌ها |

## اجرای محلی

```bash
python -m http.server 8123
```

سپس در مرورگر: <http://localhost:8123>
