const { app, BrowserWindow, dialog, screen, Menu, Tray, nativeTheme, nativeImage } = require('electron')
const path = require('path')
const storage = require('electron-json-storage')
const pie = require('puppeteer-in-electron')
const puppeteer = require('puppeteer-core')
let tray, page, initializer, overlay
let overlayUnpinned = false

nativeTheme.themeSource = 'dark'

let windowState = {
  x: 0,
  y: 0
}
if (process.platform === 'darwin') {
  app.dock.hide()
}

function log (message, type) {
  message.split('\n').forEach(line => console.log(`Remedy Standard [${type || 'info'}]: ${line}`))
};

async function initialize () {
  log(`Starting services\nVersion ${require('../package.json').version}`, 'client')
  await pie.initialize(app)
}

async function createWindow () {
  log('Creating window...', 'client')
  storage.get('screenPosition', function (error, object) {
    if (object.windowState) {
      log('Restoring overlay position...', 'client')
      windowState = object.windowState
    }
  })
  function Createmenu (tab1, tab2, tab3) {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: tab1,
        click: async function () {
          if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
          } else if (initializer) {
            initializer.show()
          }
        }
      },
      {
        label: tab2,
        click: async function () {
          Createmenu('Show', !overlayUnpinned ? 'Pin overlay' : 'Unpin overlay', 'Close')
          overlayUnpinned = !overlayUnpinned
          if (overlayUnpinned) {
            overlay.setIgnoreMouseEvents(false)
            overlay.setFocusable(true)
          } else {
            overlay.setIgnoreMouseEvents(true)
            overlay.setFocusable(false)
            windowState = overlay.getBounds()
            storage.set('screenPosition', { windowState: windowState })
          }
        }
      },
      {
        label: tab3,
        click: function () {
          log('Exited application with code 0')
          return app.quit()
        }
      }
    ])
    tray.setContextMenu(contextMenu)
  }
  Createmenu('Show', 'Unpin overlay', 'Close')
  const size = screen.getPrimaryDisplay().workAreaSize
  initializer = new BrowserWindow({
    title: 'DiscordOverlayMac',
    icon: './src/assets/icon/favicon.png',
    width: size.width / 1.75,
    height: size.height / 1.75,
    fullscreen: false,
    minimizable: false,
    center: true,
    webPreferences: {
      backgroundThrottling: false,
      devTools: false
    },
    show: false
  })
  initializer.loadURL('https://streamkit.discord.com/overlay')
  const browser = await pie.connect(app, puppeteer)
  page = await pie.getPage(browser, initializer)
  await page.goto('https://streamkit.discord.com/overlay')
  await page.waitForSelector('.install-button button', { timeout: 5000 })
  await page.evaluate(function (selector) {
    document.querySelector(selector).click()
  }, '.install-button button')
  await page.waitForSelector('button[value=voice]', { timeout: 5000 })
  await page.evaluate(function (selector) {
    document.querySelector(selector).click()
  }, 'button[value=voice]')
  initializer.show()
  initializer.webContents.on('before-input-event', async (event, input) => {
    if (input.control && input.key.toLowerCase() === 'enter') {
      event.preventDefault()
      try {
        const overlaySelector = await page.waitForSelector('#app-mount > div > div > div.install.is-open > div.config-link > div:nth-child(3) > input', { timeout: 500 })
        var overlayUrl = await overlaySelector.evaluate(el => el.value)
      } catch (e) {
        return dialog.showMessageBox(initializer, {
          buttons: ['OK'],
          type: 'warning',
          message: 'Coudn\'t find the overlay URL.'
        })
      }
      if (overlayUrl && !overlay) {
        overlay = new BrowserWindow({
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
        overlay.setAlwaysOnTop(true, 'screen-saver')
        overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
        overlay.setIgnoreMouseEvents(true)
        overlay.setFocusable(false)
        overlay.webContents.setZoomFactor(90)
        overlay.webContents.executeJavaScript('if (typeof console.oldlog === \'undefined\') { console.oldlog = console.log; } window.consoleCatchers = []; console.log = function (text, input) { if (typeof input !== \'undefined\') { window.consoleCatchers.forEach(function (item, index) { item(input) }) } else { console.oldlog(text); } }; window.consoleCatchers.push(function (input) { if (input.evt == \'VOICE_STATE_UPDATE\') { name = input.data.nick; uState = input.data.voice_state; muteicon = \'\'; if (uState.self_mute || uState.mute) { muteicon = "<img src=\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAABhMAAAYJQE8CCw1AAAAB3RJTUUH5AUGCx0VMm5EjgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAABzSURBVDjLxZIxCsAwCEW/oT1P7z93zZJjeIYMv0sCIaBoodTJDz6/JgJfBslOsns1xYONvK66JCeqAC4ALTz+dJvOo0lu/zS87p2C98IdHlq9Buo5D62h17amScMk78hBWXB/DUdP2fyBaINjJiJy4o94AM8J8ksz/MQjAAAAAElFTkSuQmCC\' style=\'height:0.9em;\'>"; } deaficon = \'\'; if (uState.self_deaf || uState.deaf) { deaficon = "<img src=\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAABhMAAAYJQE8CCw1AAAAB3RJTUUH5AUGCx077rhJQQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAACNSURBVDjLtZPNCcAgDIUboSs4iXTGLuI2XjpBz87g4fWiENr8iNBAQPR9ef7EbfsjAEQAN4A2UtCcGtyMzFxjwVlyBHAwTRFh52gqHDVnF+6L1XJ/w31cp7YvOX/0xlOJ254qYJ1ZLTAmPWeuDVxARDurfBFR8jovMLEKWxG6c1qB55pEuQOpE8vKz30AhEdNuXK0IugAAAAASUVORK5CYII=\' style=\'height:0.9em;\'>"; } spans = document.getElementsByTagName(\'span\'); for (i = 0; i < spans.length; i++) { if (spans[i].innerHTML.startsWith(name)) { text = name + muteicon + deaficon; spans[i].innerHTML = text; } } } });')
        overlay.loadURL(overlayUrl.replaceAll('true', 'True'))
        await overlay.webContents.insertCSS(`
          * {
            -webkit-app-region: drag;
            user-select: none;
            pointer-events: none;
          }
        `)
        await page.waitForSelector('#app-mount > div > div > div.install.is-open > div.config-link > div:nth-child(3) > input', { hidden: true, timeout: 0 })
        overlay.close()
        initializer.close()
        console.log('Overlay closed.')
        return overlay = undefined
      }
    }
  })
}
initialize()

app.on('ready', async () => {
  app.on('window-all-closed', e => e.preventDefault())
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, '/icon/favicon.png')).resize({
    width: 18,
    height: 18
  })
  tray = new Tray(trayIcon)
  createWindow()
})
