const { app, BrowserWindow, dialog, screen, Menu, Tray, nativeTheme, nativeImage } = require('electron')
const path = require('path')
const storage = require('electron-json-storage')
const pie = require('puppeteer-in-electron')
const puppeteer = require('puppeteer-core')
const fs = require('fs')
let tray, page, initializer, contextMenu, createMenuOuter, overlay
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
  function createMenu (tab1, tab2, tab3) {
    contextMenu = Menu.buildFromTemplate([
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
        enabled: false,
        click: async function () {
          createMenu('Show', !overlayUnpinned ? 'Pin overlay' : 'Unpin overlay', 'Close')
          contextMenu.items[1].enabled = true
          overlayUnpinned = !overlayUnpinned
          if (overlayUnpinned) {
            overlay.setIgnoreMouseEvents(false)
            overlay.setFocusable(true)
          } else {
            overlay.setIgnoreMouseEvents(true)
            overlay.setFocusable(false)
            windowState = overlay.getBounds()
            storage.set('screenPosition', { windowState })
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
  createMenuOuter = createMenu
  createMenu('Show', 'Unpin overlay', 'Close')
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
  await page.waitForSelector('#root > div > div.Config_landing__Y1hp5 > div.Config_landingInner__gXttS > div > div.Config_installButton__Hug7z > button:nth-child(1)', { timeout: 5000 })
  await page.evaluate(function (selector) {
    document.querySelector(selector).click()
  }, '#root > div > div.Config_landing__Y1hp5 > div.Config_landingInner__gXttS > div > div.Config_installButton__Hug7z > button:nth-child(1)')
  await page.waitForSelector('button[value=voice]', { timeout: 5000 })
  await page.evaluate(function (selector) {
    document.querySelector(selector).click()
  }, 'button[value=voice]')
  initializer.show()
  initializer.webContents.on('before-input-event', async (event, input) => {
    if (input.control && input.key.toLowerCase() === 'enter') {
      event.preventDefault()
      try {
        const overlaySelector = await page.waitForSelector('#root > div > div.Config_install__vja5r.Config_isOpen__Qxr2x > div.Config_configLink__NPhvj > div:nth-child(3) > input[type=text]', { timeout: 500 })
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
          type: 'panel',
          resizable: false,
          fullscreenable: false,
          transparent: true,
          webPreferences: {
            zoomFactor: 0.85
          }
        })
        overlay.setIgnoreMouseEvents(true)
        overlay.setFocusable(false)
        overlay.webContents.setZoomFactor(90)
        overlay.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, '/overlayInjectScript.js')))
        overlay.loadURL(overlayUrl.replaceAll('true', 'True'))
        await overlay.webContents.insertCSS(`
          * {
            -webkit-app-region: drag;
            user-select: none;
            pointer-events: none;
          }
        `)
        contextMenu.items[1].enabled = true
        await page.waitForSelector('#root > div > div.Config_install__vja5r.Config_isOpen__Qxr2x > div.Config_close__Hhqpn.Config_isOpen__Qxr2x', { hidden: true, timeout: 0 })
        overlay.close()
        contextMenu.items[1].enabled = false
        createMenuOuter('Show', 'Unpin overlay', 'Close')
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
