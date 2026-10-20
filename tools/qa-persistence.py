#!/usr/bin/env python3
"""Exercise campaign storage and modal lifecycle in a real Chromium browser.

Requires Python Playwright and Chromium. Start tools/serve.py, then run this file
from any working directory. No assets or network responses are substituted.
"""

import argparse
import json
import shutil

from playwright.sync_api import sync_playwright


def run(url, chromium):
    results = []
    with sync_playwright() as playwright:
        options = {
            "headless": True,
            "args": [
                "--no-sandbox",
                "--enable-unsafe-swiftshader",
                "--use-gl=angle",
                "--use-angle=swiftshader",
            ],
        }
        if chromium:
            options["executable_path"] = chromium
        browser = playwright.chromium.launch(**options)

        def new_page(initialization):
            context = browser.new_context()
            context.add_init_script(initialization)
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(url, wait_until="domcontentloaded")
            page.wait_for_function("window.HiveSystems?.ui.game")
            return context, page, errors

        context, page, errors = new_page("""
            localStorage.setItem('hive-ascension-campaign-v2', JSON.stringify({
                stage: 3.8, campaignStarted: true, difficulty: 'hacked',
                adultCaste: 'garbage', unlockedCodex: [null, 'drone', {}, 'drone'],
                campaignCharacters: {asterRho: {maskAttachments: 99, alive: false}}
            }));
            localStorage.setItem('hive-ascension-settings-v2', JSON.stringify({
                volume: 999, brightness: -50, scanlines: 'bad', muted: true
            }));
        """)
        values = page.evaluate("""({
            save: HiveSystems.save.read(), settings: HiveSystems.settings.values,
            audio: document.querySelector('#btn-audio-toggle').getAttribute('aria-pressed')
        })""")
        save, settings = values["save"], values["settings"]
        assert save["stage"] == 3, "Fractional saved acts must become valid integers"
        assert save["difficulty"] == "survivor", "Unknown difficulty must fall back"
        assert save["adultCaste"] == "drone", "Unknown adult caste must fall back"
        assert save["unlockedCodex"] == ["drone"], "Codex data must filter invalid entries"
        assert save["campaignCharacters"]["asterRho"]["maskAttachments"] == 2
        assert settings["volume"] == 100 and settings["brightness"] == 70
        assert settings["scanlines"] is True and values["audio"] == "true"
        page.click("#btn-continue-campaign")
        page.wait_for_function("""gameInstance.currentStageIndex === 3 &&
            gameInstance.campaignConfig.difficulty === 'survivor'""")
        assert not errors, errors
        results.append("Malformed save/settings normalize; act III resumes; saved mute applies")
        context.close()

        context, page, errors = new_page("""
            for (const method of ['setItem', 'getItem']) {
                Object.defineProperty(Storage.prototype, method, {
                    value() { throw new DOMException('denied', 'SecurityError'); }
                });
            }
        """)
        save = page.evaluate("""() => {
            const save = HiveSystems.save;
            save.startNew('story', false);
            save.unlock(['drone']);
            save.checkpoint(4, {adultCaste: 'runner', hostProfile: 'dog'});
            save.unlock(['runner']);
            return save.read();
        }""")
        assert save["stage"] == 4 and save["difficulty"] == "story"
        assert save["expandedLore"] is False and save["adultCaste"] == "runner"
        assert "drone" in save["unlockedCodex"] and "runner" in save["unlockedCodex"]
        assert page.locator("#toast-message").is_visible(), "Session-only storage needs a warning"
        assert not errors, errors
        results.append("Denied storage preserves session checkpoints/codex and warns about page-close loss")
        context.close()

        context, page, errors = new_page("""
            if (!localStorage.getItem('qa-seeded')) {
                localStorage.setItem('hive-ascension-campaign-v2', '{broken');
                localStorage.setItem('hive-ascension-settings-v2', '[]');
                localStorage.setItem('qa-seeded', 'yes');
            }
        """)
        assert page.locator("#btn-continue-campaign").is_disabled()
        page.click("#btn-new-campaign")
        page.click("#btn-start-act-one")
        page.keyboard.press("Escape")
        page.click("#btn-open-settings")
        page.focus("#setting-volume")
        page.keyboard.press("Escape")
        assert page.locator("#settings-overlay").is_hidden()
        assert page.locator("#pause-overlay").is_visible()
        page.keyboard.press("Escape")
        assert page.locator("#pause-overlay").is_hidden()
        assert page.evaluate("!gameInstance.isSystemPaused"), "Closing pause must resume gameplay"
        page.click("#btn-audio-toggle")
        assert page.evaluate("HiveSystems.settings.values.muted") is True
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("window.HiveSystems?.ui.game")
        assert page.evaluate("HiveSystems.settings.values.muted") is True
        assert page.locator("#btn-audio-toggle").get_attribute("aria-pressed") == "true"
        assert not errors, errors
        results.append("Corrupt JSON recovers; Escape closes focused settings; resume and mute reload work")
        context.close()
        browser.close()
    return {"url": url, "passed": len(results), "checks": results}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:8082/")
    parser.add_argument("--chromium", default=shutil.which("chromium") or shutil.which("chromium-browser"))
    arguments = parser.parse_args()
    print(json.dumps(run(arguments.url, arguments.chromium), ensure_ascii=False, indent=2))
