# Third-party libraries (bundled so the tool never loads code from other servers)

| File | Library | Version | Licence | Used for |
|---|---|---|---|---|
| `qrcode.js` | qrcode-generator (Kazuhiko Arase) | 2.0.4 | MIT | Drawing the edit code on the printed plan |
| `pako.min.js` | pako | 2.1.0 | MIT and Zlib | Compressing / expanding the plan data in the edit code |
| `jsQR.js` | jsQR (cozmo) | 1.4.0 | Apache-2.0 | Reading the edit code from an uploaded PDF or photo (loaded only when needed) |
| `pdf.min.js`, `pdf.worker.min.js` | PDF.js (Mozilla), from pdfjs-dist | 4.10.38 | Apache-2.0 | Opening an uploaded PDF in the browser (loaded only when needed) |

Copied unmodified from the npm packages (`.mjs` files renamed to `.js` so every web host serves them as JavaScript).
Everything runs in the browser; uploaded files are never sent anywhere.
