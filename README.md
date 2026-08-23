# 🏔️ The Adventures of Anna and Max

A visual journey through nature's wonders — mountains, forests, and coastlines.

## Stack

- **Hosting:** [Azure Static Web Apps](https://azure.microsoft.com/en-us/products/app-service/static)
- **CI/CD:** GitHub Actions (auto-deploy on push to `main`)
- **Fonts:** [Google Fonts](https://fonts.google.com/) (Shadows Into Light)
- **Images:** [Unsplash](https://unsplash.com/)
- **Analytics:** Self-hosted, cookie-free tracking

## Development

Static site - edit HTML/CSS/JS and push. Changes deploy automatically.

```bash
npm install
npx playwright install chromium
npm start          # local server on http://127.0.0.1:4280
npm test           # Playwright against the local tree
```

## License

[MIT](LICENSE)