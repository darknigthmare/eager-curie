"""Open the live campaign menu after the optional terminal splash."""


def open_campaign_menu(page, *, touch=False):
    enter = page.locator('#btn-enter-terminal')
    if enter.is_visible():
        action = 'tap' if touch else 'click'
        getattr(enter, action)()
        skip = page.locator('#btn-skip-intro')
        if skip.is_visible():
            getattr(skip, action)()
    page.locator('#boot-screen').wait_for(state='visible')
