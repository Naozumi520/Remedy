const { app, BrowserWindow, screen, dialog } = require('electron')
const path = require('path')
const pie = require('puppeteer-in-electron')
const puppeteer = require('puppeteer-core')
const is_mac = process.platform === 'darwin'
if (is_mac) {
  app.dock.hide()
}

async function createWindow() {
  await pie.initialize(app)
  app.on('ready', async () => {
    const size = screen.getPrimaryDisplay().workAreaSize;
    const initializer = new BrowserWindow({
      title: 'DiscordOverlayMac',
      icon: './src/icon/favicon.png',
      width: size.width / 1.75,
      height: size.height / 1.75,
      fullscreen: false,
      center: true,
      webPreferences: {
        backgroundThrottling: false,
        devTools: false
      }
    })
    initializer.loadURL('https://streamkit.discord.com/overlay')
    const browser = await pie.connect(app, puppeteer)
    const page = await pie.getPage(browser, initializer)
    await page.goto('https://streamkit.discord.com/overlay')
    initializer.on('window-all-closed', () => {
      app.quit()
    })
    initializer.webContents.on('before-input-event', async (event, input) => {
      if (input.control && input.key.toLowerCase() === 'enter') {
        event.preventDefault()
        try {
          const overlaySelector = await page.waitForSelector('#app-mount > div > div > div.install.is-open > div.config-link > div:nth-child(3) > input', { timeout: 500 });
          var overlayUrl = await overlaySelector.evaluate(el => el.value);
        } catch (e) {
          return dialog.showMessageBox(initializer, {
            buttons: ['OK'],
            type: 'warning',
            message: 'Coudn\'t find the overlay URL.\n\nEnither click both button should be work.\nJust make sure you\'ve clicked the button.',
          });
        }
        if (overlayUrl) {
          const overlay = new BrowserWindow({
            useContentSize: true,
            x: 0,
            y: 0,
            frame: false,
            resizable: false,
            fullscreenable: false,
            transparent: true,
            webPreferences: {
              zoomFactor: 0.85
            }
          })
          overlay.setAlwaysOnTop(true, "screen-saver")
          overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
          overlay.setIgnoreMouseEvents(true);
          overlay.setFocusable(false);
          overlay.webContents.setZoomFactor(90);
          overlay.loadURL(overlayUrl)
          await page.waitForSelector('#app-mount > div > div > div.install.is-open > div.config-link > div:nth-child(3) > input', { hidden: true, timeout: 0 });
          return overlay.close()
        }
      }
    })
  })
}
createWindow()

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
