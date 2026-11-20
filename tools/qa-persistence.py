#!/usr/bin/env python3
"""Exercise campaign storage and modal lifecycle in a real Chromium browser.

Requires Python Playwright and Chromium. Start tools/serve.py, then run this file
from any working directory. No assets or network responses are substituted.
"""

import argparse
import json
import re
import shutil

from playwright.sync_api import sync_playwright
from qa_boot_flow import open_campaign_menu

SAVE_KEY = "hive-ascension-campaign-v2"


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
            page.wait_for_function("() => !!window.HiveSystems?.ui.game", timeout=120000)
            open_campaign_menu(page)
            return context, page, errors

        def return_to_menu(page):
            page.locator("#game-canvas").focus()
            page.keyboard.press("Escape")
            page.click("#btn-return-menu")

        def stored_origin(page):
            return page.evaluate("key => JSON.parse(localStorage.getItem(key)).origin", SAVE_KEY)

        context, page, errors = new_page(f"""
            const key = {json.dumps(SAVE_KEY)};
            if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({{
                stage: 4, campaignStarted: true, origin: 'colony', difficulty: 'story',
                unlockedCodex: ['drone'], completedEndings: ['dominion']
            }}));
        """)
        checkpoint = page.evaluate("key => localStorage.getItem(key)", SAVE_KEY)
        page.click("#btn-new-campaign")
        assert page.locator("#prologue-screen").is_visible()
        assert page.evaluate("key => localStorage.getItem(key)", SAVE_KEY) == checkpoint, "Opening the prologue replaced an existing checkpoint"
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("() => !!window.HiveSystems?.ui.game", timeout=120000)
        open_campaign_menu(page)
        page.click("#btn-continue-campaign")
        assert page.evaluate("gameInstance.currentStageIndex") == 4
        assert stored_origin(page) == "colony"
        return_to_menu(page)
        page.click('[data-difficulty="nightmare"]')
        page.click('[data-origin="hive"]')
        page.click("#btn-new-campaign")
        page.click("#btn-start-act-one")
        saved = page.evaluate("key => JSON.parse(localStorage.getItem(key))", SAVE_KEY)
        assert saved["stage"] == 1 and saved["campaignStarted"] is True
        assert saved["difficulty"] == "nightmare" and saved["origin"] == "hive"
        assert "drone" in saved["unlockedCodex"] and "dominion" in saved["completedEndings"]
        assert not errors, errors
        results.append("Opening and abandoning the prologue preserves the existing checkpoint; confirming a new campaign commits the selected options and retains discoveries and endings")
        context.close()

        for origin, host_type in (("hive", "marine"), ("juggernaut", "spacesuit")):
            saved = {"stage": 2, "campaignStarted": True, "origin": origin}
            context, page, errors = new_page(f"""
                localStorage.setItem({json.dumps(SAVE_KEY)}, JSON.stringify({json.dumps(saved)}));
            """)
            for attempt in range(2):
                page.click("#btn-continue-campaign")
                state = page.evaluate("""() => {
                    const game = gameInstance;
                    const host = game.humans.find(human => human.id === 1);
                    return {stage: game.currentStageIndex, origin: game.activeOrigin?.id || null,
                        royal: game.currentStage.isRoyal, hostType: host?.type || null, hostHasModel: !!host?.mesh};
                }""")
                assert state == {"stage": 2, "origin": origin, "royal": True,
                                 "hostType": host_type, "hostHasModel": True}, state
                assert stored_origin(page) == origin
                if attempt == 0:
                    return_to_menu(page)
            # Prepare a completed act so the actual transition can exercise
            # its checkpoint without replacing any of the persistence code.
            page.evaluate("""() => {
                gameInstance.currentStage.isCompleted = true;
                gameInstance.advanceStage(gameInstance.currentStage);
            }""")
            assert page.evaluate("gameInstance.currentStageIndex") == 3
            assert stored_origin(page) == origin
            assert not errors, errors
            results.append(f"Act II {origin} restores its royal variant and modeled {host_type} on fresh boot and from menu, then preserves its origin in the next checkpoint")
            context.close()

        for origin, expected in (("random", "starship"), ("constructor", "starship")):
            saved = {"stage": 2, "campaignStarted": True, "origin": origin, "adultCaste": "__proto__"}
            context, page, errors = new_page(f"""
                localStorage.setItem({json.dumps(SAVE_KEY)}, JSON.stringify({json.dumps(saved)}));
            """)
            page.click("#btn-continue-campaign")
            assert page.evaluate("gameInstance.activeOrigin?.id") == expected, origin
            assert page.evaluate("gameInstance.campaignConfig.adultCaste") == "drone"
            assert stored_origin(page) == expected
            assert not errors, errors
            results.append(f"Legacy Act II origin {origin} resolves to a valid stable origin and inherited caste ID is rejected")
            context.close()

        context, page, errors = new_page("")
        page.click('[data-origin="random"]')
        page.click("#btn-new-campaign")
        page.click("#btn-start-act-one")
        resolved = page.evaluate("gameInstance.activeOrigin?.id")
        assert resolved in ("hive", "juggernaut", "colony", "starship"), resolved
        assert stored_origin(page) == resolved, "The roll must persist before the next act"
        return_to_menu(page)
        page.click("#btn-continue-campaign")
        assert page.evaluate("gameInstance.activeOrigin?.id") == resolved
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("() => !!window.HiveSystems?.ui.game", timeout=120000)
        open_campaign_menu(page)
        page.click("#btn-continue-campaign")
        assert page.evaluate("gameInstance.activeOrigin?.id") == resolved
        assert stored_origin(page) == resolved
        assert not errors, errors
        results.append(f"New random origin {resolved} survives return to menu and full reload while still in Act I")
        context.close()

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
        # Storage preserves well-formed symbolic IDs for the expanded caste
        # catalog. Game configuration, not string sanitization, checks whether
        # that ID is a real supported caste before applying it to an actor.
        assert save["adultCaste"] == "garbage", "Well-formed stored caste IDs must not be silently rewritten"
        normalized = page.evaluate("""() => ({
            malformed: HiveSystems.save.normalize({adultCaste: '../drone<script>'}).adultCaste,
            known: HiveSystems.save.normalize({adultCaste: 'runner'}).adultCaste,
            codex: HiveSystems.save.normalize({unlockedCodex: [null, 'drone', {}, 'drone']}).unlockedCodex
        })""")
        assert normalized == {"malformed": "drone", "known": "runner", "codex": ["drone"]}, "Pure normalization must reject malformed IDs and invalid/duplicate Codex entries without losing a known caste"
        # Real StageEgg bootstrap configures the future Drone via setAdultCaste,
        # which legitimately unlocks the extended-caste record after read().
        # This exact live set was independently observed in the native
        # persistence-bootstrap diagnostic; do not accept arbitrary additions.
        live_codex = save["unlockedCodex"]
        assert all(isinstance(entry, str) and re.fullmatch(r"[a-z0-9_]{2,99}", entry) for entry in live_codex), "Live Codex IDs remain valid symbolic IDs"
        assert len(live_codex) == len(set(live_codex)), "Real bootstrap must not duplicate the seeded discovery"
        assert set(live_codex) == {"drone", "codex_castes_etendues"}, "Seeded discovery plus exactly the proven bootstrap unlock must survive"
        assert save["campaignCharacters"]["asterRho"]["maskAttachments"] == 2
        assert settings["volume"] == 100 and settings["brightness"] == 70
        assert settings["scanlines"] is False and values["audio"] == "true"
        page.click("#btn-continue-campaign")
        page.wait_for_function("""() => gameInstance.currentStageIndex === 3 &&
            gameInstance.campaignConfig.difficulty === 'survivor' &&
            gameInstance.campaignConfig.adultCaste === 'drone'""")
        assert page.evaluate("gameInstance.campaignConfig.adultCaste") == "drone", "Unknown stored caste must never become an active campaign caste"
        assert not errors, errors
        results.append("Pure malformed-data normalization and exact real-bootstrap Codex unlocks pass; unsupported caste rejected by campaign configuration; act III resumes; saved mute applies")
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
            save.checkpoint(4, {adultCaste: 'runner', hostProfile: 'labhound'});
            save.unlock(['runner']);
            return save.read();
        }""")
        assert save["stage"] == 4 and save["difficulty"] == "story"
        assert save["expandedLore"] is False and save["adultCaste"] == "runner"
        assert save["hostProfile"] == "labhound", "Session checkpoint retains the canonical quadruped host profile"
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
        page.wait_for_function("() => !!window.HiveSystems?.ui.game", timeout=120000)
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
