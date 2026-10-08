#!/usr/bin/env python3
"""Build the single-file offline copy of the COPD Action Plan Builder.

Everything the tool needs (styles, fonts, scripts, translations, inhaler pictures and the
PDF/QR reading libraries) is packed into ONE .html file that works from a USB stick or a
shared drive with no internet connection. A .zip with the file and short instructions is
made next to it (some email systems block bare .html attachments).

Usage (from the repository root or anywhere):
    python3 copd-action-plan/tools/build_offline.py

Output:
    copd-action-plan/download/COPD-Action-Plan-Builder.html
    copd-action-plan/download/COPD-Action-Plan-Builder.zip
Run it again after changing the tool so the download stays current.
"""
import base64
import datetime
import json
import pathlib
import re
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent          # copd-action-plan/
OUT_DIR = ROOT / 'download'
OUT_NAME = 'COPD-Action-Plan-Builder'
ONLINE_URL = 'https://anirgarg.github.io/copdflaoht/copd-action-plan/'


def read(rel):
    return (ROOT / rel).read_text(encoding='utf-8')


def b64(rel):
    return base64.b64encode((ROOT / rel).read_bytes()).decode('ascii')


def safe_inline_js(code, name):
    # "</script" inside inline JS would end the <script> element early.
    if re.search(r'</script', code, re.I):
        code = re.sub(r'</(script)', r'<\\/\1', code, flags=re.I)
        print(f'  escaped </script in {name}')
    return code


def inline_fonts_css():
    css = read('fonts/fonts.css')
    def to_data(m):
        return f"url(data:font/woff2;base64,{b64('fonts/' + m.group(1))})"
    return re.sub(r'url\(([\w.-]+\.woff2)\)', to_data, css)


def inline_data_js():
    js = read('data.js')
    def to_data(m):
        return f"'data:image/jpeg;base64,{b64('medications/' + m.group(1))}'"
    js, n = re.subn(r"'medications/([\w.-]+\.jpg)'", to_data, js)
    print(f'  embedded {n} inhaler pictures')
    return js


def app_version():
    m = re.search(r"const APP_VERSION = '([^']+)'", read('data.js'))
    return m.group(1) if m else 'unknown'


def build():
    html = read('index.html')
    version = app_version()
    built = datetime.date.today().isoformat()

    # Stylesheets
    html, n1 = re.subn(r'<link rel="stylesheet" href="fonts/fonts\.css[^"]*">',
                       lambda m: '<style>\n' + inline_fonts_css() + '</style>', html)
    html, n2 = re.subn(r'<link rel="stylesheet" href="styles\.css[^"]*">',
                       lambda m: '<style>\n' + read('styles.css') + '</style>', html)
    assert n1 == 1 and n2 == 1, 'stylesheet links not found in index.html'

    # Scripts (classic, in order)
    def inline_script(m):
        src = m.group(1)
        code = inline_data_js() if src == 'data.js' else read(src)
        extra = ''
        if src == 'app.js':
            libs = {
                'jsqr': b64('vendor/jsQR.js'),
                'pdf': b64('vendor/pdf.min.js'),
                'pdfWorker': b64('vendor/pdf.worker.min.js'),
            }
            extra = ('<script>window.OFFLINE_BUILD = ' + json.dumps({'version': version, 'built': built, 'online': ONLINE_URL}) +
                     ';\nwindow.OFFLINE_LIBS = ' + json.dumps(libs) + ';</script>\n  ')
        return extra + '<script>\n/* ' + src + ' */\n' + safe_inline_js(code, src) + '\n</script>'
    html, n3 = re.subn(r'<script src="([\w./-]+\.js)(?:\?[^"]*)?"></script>', inline_script, html)
    print(f'  inlined {n3} scripts')

    # Nothing may still point at a separate local file
    markup = re.sub(r'<script>.*?</script>', '', html, flags=re.S)   # check the HTML, not script text
    leftovers = [r for r in re.findall(r'(?:src|href)="(?!data:|https?:|#|mailto:)([^"]+)"', markup)
                 if not r.startswith('download/')]                    # the download link is hidden offline
    if leftovers:
        sys.exit(f'Unbundled references remain: {leftovers}')

    banner = (f'<!-- COPD Action Plan Builder v{version}, single-file offline copy built {built}.\n'
              f'     Created by Dr Anirudha (Ani) Garg. Online version: {ONLINE_URL}\n'
              f'     Bundled libraries: qrcode-generator (MIT), pako (MIT/Zlib), jsQR (Apache-2.0), PDF.js (Apache-2.0);\n'
              f'     font: Atkinson Hyperlegible (SIL OFL 1.1). -->\n')
    html = html.replace('<!doctype html>', '<!doctype html>\n' + banner, 1)

    OUT_DIR.mkdir(exist_ok=True)
    out_html = OUT_DIR / f'{OUT_NAME}.html'
    out_html.write_text(html, encoding='utf-8')

    howto = f"""COPD Action Plan Builder - offline copy (version {version}, built {built})
Created by Dr Anirudha (Ani) Garg, MSc MD FRACGP CCFP - ani.garg.md@gmail.com

HOW TO USE
1. Copy "{OUT_NAME}.html" to your computer, a USB stick or a shared drive.
2. Double-click it. It opens in your web browser (Chrome, Edge, Firefox or Safari).
3. Use it exactly like the website. No internet connection is needed.

GOOD TO KNOW
- Nothing you type is sent anywhere. Patient details are never stored by the tool.
- Your clinic settings are remembered by the browser on that computer. To move them
  to another computer, use "Save template" and "Load template".
- "Open old plan" re-opens a plan from its PDF or a photo of the printed page,
  using the edit code printed in the corner.
- Newest version online: {ONLINE_URL}

Bundled open-source software: qrcode-generator (MIT), pako (MIT/Zlib), jsQR (Apache-2.0),
PDF.js (Apache-2.0); font Atkinson Hyperlegible (SIL Open Font License 1.1).
"""
    out_zip = OUT_DIR / f'{OUT_NAME}.zip'
    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as z:
        z.write(out_html, f'{OUT_NAME}.html')
        z.writestr('How to use.txt', howto.replace('\n', '\r\n'))
        z.write(ROOT / 'fonts' / 'OFL-LICENSE.txt', 'licences/Atkinson-Hyperlegible-OFL.txt')
        z.write(ROOT / 'vendor' / 'README.md', 'licences/bundled-libraries.md')

    print(f'Built {out_html.relative_to(ROOT.parent)} ({out_html.stat().st_size / 1e6:.1f} MB)')
    print(f'Built {out_zip.relative_to(ROOT.parent)} ({out_zip.stat().st_size / 1e6:.1f} MB)')


if __name__ == '__main__':
    build()
