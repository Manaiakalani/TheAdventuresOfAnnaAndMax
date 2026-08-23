# 🏔️ The Adventures of Anna and Max

A visual journey through nature's wonders — mountains, forests, and coastlines.

## Stack

- **Hosting:** [Azure Static Web Apps](https://azure.microsoft.com/en-us/products/app-service/static)
- **CI/CD:** GitHub Actions (auto-deploy on push to `main`)
- **Fonts:** [Google Fonts](https://fonts.google.com/) (Shadows Into Light)
- **Images:** Hosted in-repo (originally [Unsplash](https://unsplash.com/))
- **Analytics:** Self-hosted, cookie-free tracking

## Development

Static site - edit HTML/CSS/JS and push. Changes deploy automatically.

`styles.css` and `script.js` are cached for a day, so after changing either run `npm run stamp` and commit the updated HTML. CI fails the deploy if the hashes are stale.

```bash
npm install
npx playwright install chromium
npm start          # local server on http://127.0.0.1:4280
npm test           # Playwright against the local tree
npm run stamp      # version CSS/JS/image URLs after an asset change
```

## License

[MIT](LICENSE)