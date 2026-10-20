#!/usr/bin/env python3
"""Actual-browser navigation + frame tests. Requires external Playwright in CI.

`--inline` exists only to smoke UI in network-restricted runtimes; its no-WebGL
mode does NOT count as validating the 3D renderer. CI runs the full HTTP path.
"""
from __future__ import annotations

import argparse
import base64
import functools
import json
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
                    page = browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,
                                           is_mobile=name=='mobile',has_touch=name=='mobile')
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
                    page.locator('#schematic circle').last.click()
                    assert page.locator('#part-inspector').is_visible()
                    assert 'dowel' in page.locator('#part-inspector-name').inner_text().lower()
                    if ready == 'true':
                        page.wait_for_function("document.querySelector('#part-callout')?.hidden === false",timeout=9000)
                        page.locator('#part-callout').click()
                        assert page.locator('#part-inspector').is_visible()
                    page.locator('#view-drawing').click()
                    assert page.locator('#view-drawing').get_attribute('aria-pressed') == 'true'
                    assert page.evaluate('document.body.dataset.viewMode') == 'drawing'
                    page.locator('#scrub').fill('8')
                    page.wait_for_timeout(400)
                    page.screenshot(path=str(output/f'{name}-drawing.png'), full_page=True)
                    page.locator('#view-room').click()
                    assert page.locator('#view-room').get_attribute('aria-pressed') == 'true'
                    for index in range(14):
                        step = page.locator('.step').nth(index)
                        expected = step.locator('.step-title').inner_text()
                        step.click()
                        assert page.locator('#current-title').inner_text() == expected
                        assert step.get_attribute('aria-current') == 'step'
                    assert page.locator('#step-count').inner_text() == '14 / 14'
                    page.locator('#scrub').fill('13')
                    assert page.locator('#current-title').inner_text() == 'Finish with the official manual'
                    page.wait_for_function("document.querySelector('#progress-hardware').textContent.startsWith('82 / 82') && document.querySelector('#progress-panels').textContent.startsWith('11 / 11')",timeout=9000)
                    assert page.locator('#progress-panels').inner_text() == '11 / 11 PANELS'
                    assert page.locator('#schematic rect').count() == 11
                    page.wait_for_timeout(350)
                    page.screenshot(path=str(output/f'{name}-assembled.png'), full_page=True)
                    page.locator('#scrub').fill('0')
                    page.wait_for_function("document.querySelector('#progress-hardware').textContent.startsWith('0 / 82') && document.querySelector('#progress-panels').textContent.startsWith('0 / 11')",timeout=9000)
                    assert page.locator('#progress-panels').inner_text() == '0 / 11 PANELS'
                    if ready == 'true':
                        # The implementation reaches the final 3D draw path and
                        # never reports a lost context or uncaught JS exception.
                        assert page.locator('#viewer').evaluate('(c) => c.width > 0 && c.height > 0')
                    page.screenshot(path=str(output/f'{name}.png'), full_page=True)
                    # The same engine must render and navigate real, independently
                    # authored furniture, construction, outdoor and PC concepts.
                    studies = [
                        ('table-concept',5,13),
                        ('doghouse-concept',8,11),
                        ('fence-concept',8,28),
                        ('pc-concept',10,15),
                    ]
                    for study, steps, parts in studies:
                        page.locator(f'[data-project-id="{study}"]').click()
                        assert page.evaluate('document.body.dataset.project') == study
                        assert page.locator('.step').count() == steps
                        assert int(page.locator('#scrub').get_attribute('max')) == steps-1
                        assert page.locator('#manual-open').is_visible()
                        assert page.locator('.project-option[aria-pressed="true"]').count() == 1
                        # The generated manual is a separate accessible overlay,
                        # not the vendor's unlicensed artwork.
                        page.locator('#manual-open').click()
                        assert page.locator('#manual-dialog').is_visible()
                        assert page.locator('.manual-card').count() == steps
                        page.locator('.manual-card').nth(1).locator('button').click()
                        assert not page.locator('#manual-dialog').is_visible()
                        assert page.locator('.step').nth(1).get_attribute('aria-current') == 'step'
                        page.locator('#view-drawing').click()
                        assert page.evaluate('document.body.dataset.viewMode') == 'drawing'
                        page.locator('#view-room').click()
                        for step_index in range(steps):
                            selected = page.locator('.step').nth(step_index)
                            selected.click()
                            assert selected.get_attribute('aria-current') == 'step'
                            assert page.locator('#current-title').inner_text() == selected.locator('.step-title').inner_text()
                        page.locator('#scrub').fill(str(steps-1))
                        page.wait_for_function("""() => Array.from(document.querySelectorAll('.inventory-counters span')).every(el => {const [installed,total]=el.textContent.trim().split(' / ');return Number(installed)===parseInt(total)})""", timeout=9000)
                        complete = page.locator('#inventory-counters span').all_text_contents()
                        assert sum(int(x.split('/')[1].split()[0]) for x in complete) == parts
                        assert 'review' in page.locator('#project-warning').inner_text().lower() or 'never' in page.locator('#project-warning').inner_text().lower()
                        page.screenshot(path=str(output/f'{name}-{study}.png'),full_page=True)
                        page.locator('#scrub').fill('0')
                        page.wait_for_function("""() => Array.from(document.querySelectorAll('.inventory-counters span')).every(el => el.textContent.trim().startsWith('0 / '))""", timeout=9000)
                        assert page.evaluate('document.documentElement.scrollWidth') <= width, f'{name}/{study} horizontal scroll'
                        assert page.evaluate('document.body.dataset.renderReady') == ready
                        if study == 'fence-concept':
                            assert page.locator('#fence-parameters').is_visible()
                            page.locator('#fence-bays').fill('8')
                            page.locator('#fence-pickets').fill('18')
                            assert page.locator('#fence-geometry-count').inner_text().startswith('144')
                            assert page.locator('#step-count').inner_text() == '01 / 08'
                            page.locator('#scrub').fill('7')
                            page.wait_for_function("document.querySelector('#progress-panels').textContent.startsWith('160 / 160')", timeout=9000)
                            # 8 bays x 18 pickets + 16 rails = 160 panels.
                            assert page.locator('#progress-panels').inner_text() == '160 / 160 PANELS'
                            assert page.evaluate('document.documentElement.scrollWidth') <= width
                            if ready == 'true':
                                perf=page.evaluate('window.livingManualsDiagnostics.metrics()')
                                assert perf and perf['visibleParts'] >= 178
                                assert perf['drawCalls'] >= perf['visibleParts']
                                print(f'{name}: 8-bay fence WebGL drawCalls={perf["drawCalls"]}, visibleParts={perf["visibleParts"]}')
                            page.screenshot(path=str(output/f'{name}-fence-expanded.png'),full_page=True)
                            page.locator('[data-project-id="table-concept"]').click()
                            page.locator('[data-project-id="fence-concept"]').click()
                            assert page.locator('#fence-geometry-count').inner_text().startswith('144')
                            assert page.locator('#fence-bays').input_value() == '8'
                            assert page.locator('#fence-pickets').input_value() == '18' 
                    # Export a concept then import it through the same guarded UI.
                    with page.expect_download() as download_info:
                        page.locator('#export-project').click()
                    download = download_info.value
                    exported = output/f'{name}-export.json'
                    download.save_as(exported)
                    assert 'illustrative' in exported.read_text().lower()
                    candidate=json.loads(exported.read_text())
                    candidate['id']='user-import-test'
                    candidate['title']='User-owned concept study'
                    exported.write_text(json.dumps(candidate))
                    page.locator('#import-project').set_input_files(str(exported))
                    page.wait_for_function("document.getElementById('project-message').textContent.includes('UNVERIFIED')",timeout=7000)
                    page.locator('#import-project').set_input_files({
                        'name': 'invalid.json', 'mimeType': 'application/json',
                        'buffer': b'{"schemaVersion":1,"review":{"status":"verified"}}'
                    })
                    page.wait_for_function("document.getElementById('project-message').textContent.toLowerCase().includes('rejected')",timeout=7000)
                    page.locator('[data-project-id="bookcase-study-v2"]').click()
                    assert not errors, f'{name} uncaught page exceptions: {errors}' 
                    print(f'{name}: PASS (WebGL2={ready}, all 14 states, scrubbing, modes, counters, layout)')
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
                fallback.locator('[data-project-id="fence-concept"]').click()
                assert fallback.locator('.step').count() == 8
                assert fallback.locator('#viewer-fallback').is_visible()
                assert fallback.locator('#fallback-svg rect').count() > 0
                fallback.locator('#manual-open').click()
                assert fallback.locator('.manual-card').count() == 8
                fallback.locator('.manual-dialog-head button').click()
                print('no-WebGL fallback: PASS (project switching and independent manuals still work)')
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
