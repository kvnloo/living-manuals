#!/usr/bin/env python3
"""Actual-browser navigation + frame tests. Requires external Playwright in CI.

`--inline` exists only to smoke UI in network-restricted runtimes; its no-WebGL
mode does NOT count as validating the 3D renderer. CI runs the full HTTP path.
"""
from __future__ import annotations

import argparse
import base64
import functools
import http.server
import re
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def inline_document() -> str:
    """Compile local ES modules into data: imports, without third-party bundlers."""
    cache: dict[Path, str] = {}

    def module(path: Path) -> str:
        path = path.resolve()
        if path in cache:
            return cache[path]
        code = path.read_text(encoding='utf-8')

        def substitute(match: re.Match[str]) -> str:
            child = (path.parent / match.group(2)).resolve()
            if not child.is_relative_to(ROOT):
                raise ValueError('Unexpected import outside the app')
            payload = base64.b64encode(module(child).encode()).decode()
            return match.group(1) + 'data:text/javascript;base64,' + payload + match.group(3)

        code = re.sub(r'''(from\s+['"])(\.[^'\"]+)(['"])''', substitute, code)
        cache[path] = code
        return code

    html = (ROOT/'index.html').read_text(encoding='utf-8')
    html = html.replace('<link rel="stylesheet" href="./styles.css">',
                        '<style>' + (ROOT/'styles.css').read_text(encoding='utf-8') + '</style>')
    payload = base64.b64encode(module(ROOT/'src/main.js').encode()).decode()
    html = html.replace('<script type="module" src="./src/main.js"></script>',
                        f'<script type="module" src="data:text/javascript;base64,{payload}"></script>')
    return html


class SilentStaticHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def run(inline: bool, allow_no_webgl: bool, output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    server = None
    html = inline_document() if inline else None
    if not inline:
        handler = functools.partial(SilentStaticHandler, directory=str(ROOT))
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as api:
            browser = api.chromium.launch(headless=True,
                executable_path='/usr/bin/chromium' if inline else None,
                args=['--no-sandbox','--enable-unsafe-swiftshader','--enable-webgl',
                      '--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader'])
            try:
                for name, width, height in [('desktop', 1440, 900), ('mobile', 390, 844)]:
                    page = browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
                    errors = []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    if inline:
                        page.set_content(html, wait_until='load')
                    else:
                        page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='load')
                    page.wait_for_function("document.body.dataset.renderReady !== undefined")
                    ready = page.evaluate('document.body.dataset.renderReady')
                    if not allow_no_webgl:
                        assert ready == 'true', f'{name}: WebGL2 failed: ' + page.locator('#render-error').inner_text()
                    else:
                        assert ready in ('true','false')
                    assert page.locator('.step').count() == 14
                    assert page.locator('#current-title').inner_text() == 'Examine the parts'
                    assert page.evaluate('document.documentElement.scrollWidth') <= width, f'{name} horizontal scroll'
                    page.locator('#next').click()
                    assert page.locator('#current-title').inner_text() == 'Locate the dowels'
                    assert page.locator('#schematic circle').count() == 12
                    page.locator('#view-drawing').click()
                    assert page.locator('#view-drawing').get_attribute('aria-pressed') == 'true'
                    assert page.evaluate('document.body.dataset.viewMode') == 'drawing'
                    page.locator('#view-room').click()
                    assert page.locator('#view-room').get_attribute('aria-pressed') == 'true'
                    page.locator('#scrub').fill('13')
                    assert page.locator('#current-title').inner_text() == 'Finish with the official manual'
                    page.wait_for_function("document.querySelector('#progress-hardware').textContent.startsWith('82 / 82') && document.querySelector('#progress-panels').textContent.startsWith('11 / 11')",timeout=9000)
                    assert page.locator('#progress-panels').inner_text() == '11 / 11 PANELS'
                    assert page.locator('#schematic rect').count() == 11
                    page.locator('#scrub').fill('0')
                    page.wait_for_function("document.querySelector('#progress-hardware').textContent.startsWith('0 / 82') && document.querySelector('#progress-panels').textContent.startsWith('0 / 11')",timeout=9000)
                    assert page.locator('#progress-panels').inner_text() == '0 / 11 PANELS'
                    if ready == 'true':
                        # The implementation reaches the final 3D draw path and
                        # never reports a lost context or uncaught JS exception.
                        assert page.locator('#viewer').evaluate('(c) => c.width > 0 && c.height > 0')
                    page.screenshot(path=str(output/f'{name}.png'), full_page=True)
                    assert not errors, f'{name} uncaught page exceptions: {errors}'
                    print(f'{name}: PASS (WebGL2={ready}, 14 states, scrubbing, modes, counters, layout)')
                    page.close()

                fallback = browser.new_page(viewport={'width':390,'height':844})
                fallback.add_init_script("HTMLCanvasElement.prototype.getContext = () => null")
                if inline:
                    fallback.set_content(html,wait_until='load')
                else:
                    fallback.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='load')
                fallback.wait_for_function("document.body.dataset.renderReady === 'false'")
                assert fallback.locator('#viewer-fallback').is_visible()
                fallback.locator('#next').click()
                assert fallback.locator('#current-title').inner_text() == 'Locate the dowels'
                assert fallback.locator('#schematic circle').count() == 12
                print('no-WebGL fallback: PASS (still navigable and illustrated)')
                fallback.close()
            finally:
                browser.close()
    finally:
        if server:
            server.shutdown()
            server.server_close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inline', action='store_true', help='Bypass blocked HTTP to smoke static UI')
    parser.add_argument('--allow-no-webgl', action='store_true', help='Local limited run only; disallowed in CI')
    parser.add_argument('--output', type=Path, default=Path('browser-artifacts'))
    args = parser.parse_args()
    run(args.inline, args.allow_no_webgl, args.output)
