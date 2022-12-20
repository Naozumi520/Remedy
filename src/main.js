const { preferences } = require('./preferences.js')
const { Client, DiscordAuthWebsocket } = require('discord.js-selfbot-v13')
const client = new Client({
  DMSync: preferences.preferences.Interface.dm_sync.includes('dm_sync')
})
const { app, BrowserWindow, ipcMain, Menu, Tray, nativeTheme, nativeImage } = require('electron')
const fs = require('fs')
const path = require('path')
const storage = require('electron-json-storage')
const pie = require('puppeteer-in-electron')
const puppeteer = require('puppeteer-core')
let tray, page, backService, overlay, contextMenu, serverId, channelId
let darwin = true
let overlayUnpinned = false

const notPackaged = !app.isPackaged
nativeTheme.themeSource = 'dark'
if (process.platform === 'darwin') {
  app.dock.hide()
} else {
  darwin = false
}

let windowState = {
  x: 0,
  y: 0
}

function log(message, type) {
  message.split('\n').forEach(line => console.log(`Remedy Pro [${type || 'info'}]: ${line}`))
};

client.on('ready', async () => {
  log(`logged in with account ${client.user.username}.`)
})

async function initialize() {
  log(`Starting services\nVersion ${require('../package.json').version}`, 'client')
  await pie.initialize(app)
}

function createMenu(tab1, tab2, tab3) {
  contextMenu = Menu.buildFromTemplate([
    {
      label: tab1,
      click: function () {
        try {
          preferences.prefsWindow.show()
        } catch (e) {
          preferences.show()
        }
      }
    },
    {
      label: tab2,
      enabled: false,
      click: async function () {
        createMenu('Preferences menu', !overlayUnpinned ? 'Pin overlay' : 'Unpin overlay', 'Close')
        contextMenu.items[1].enabled = true
        overlayUnpinned = !overlayUnpinned
        overlay.setIgnoreMouseEvents(!overlayUnpinned)
        overlay.setFocusable(overlayUnpinned)
        const bounds = overlay.getBounds()
        storage.set('screenPosition', { windowState: bounds })
        windowState = bounds
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
  return contextMenu
}

async function createWindow() {
  log('Creating window...', 'client')
  storage.get('screenPosition', function (error, object) {
    if (error) throw error
    if (object.windowState) {
      log('Restoring overlay position...', 'client')
      windowState = object.windowState
    }
  })
  createMenu('Preferences menu', 'Unpin overlay', 'Close')
  backService = new BrowserWindow({
    title: 'Remedy Pro Service (Discord StreamKit Overlay)',
    icon: './src/assets/icon/favicon.png',
    width: 0,
    height: 0,
    fullscreen: false,
    minimizable: false,
    center: true,
    webPreferences: {
      backgroundThrottling: false,
      devTools: false
    },
    show: false
  })
  backService.loadURL('https://streamkit.discord.com/overlay')
  const browser = await pie.connect(app, puppeteer)
  page = await pie.getPage(browser, backService)
  await page.goto('https://streamkit.discord.com/overlay')
  await page.waitForSelector('.install-button button', { timeout: 0 })
  await page.evaluate(function (selector) {
    document.querySelector(selector).click()
  }, '.install-button button')
  await page.waitForSelector('button[value=voice]', { timeout: 0 })
  await page.evaluate(function (selector) {
    document.querySelector(selector).click()
  }, 'button[value=voice]')
}
initialize()

app.on('ready', async () => {
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, '/icon/favicon_menu.png')).resize({
    width: 16,
    height: 16
  })
  trayIcon.setTemplateImage(true)
  tray = new Tray(trayIcon)
  createWindow()
})

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (oldState.streaming === false && newState.streaming === true) {
    if (notPackaged) log((!newState.member?.nickname ? newState.user.username : newState.member?.nickname) + ' started streaming!')
    if (overlay) {
      overlay.webContents.send('event', { action: 'stream:start', args: { user: (!newState.member?.nickname ? newState.user.username : newState.member?.nickname), userId: (!newState.member?.id ? newState.user.id : newState.member?.id) } })
    }
  }
  if (oldState.streaming === true && newState.streaming === false) {
    if (notPackaged) log((!oldState.member?.nickname ? oldState.user.username : oldState.member?.nickname) + ' stopped streaming!')
    if (overlay) {
      overlay.webContents.send('event', { action: 'stream:stop', args: { user: (!oldState.member?.nickname ? oldState.user.username : oldState.member?.nickname), userId: (!oldState.member?.id ? oldState.user.id : oldState.member?.id) } })
    }
  }
  if (newState?.user === client.user) {
    if (oldState.channelId === newState.channelId) return
    if (!oldState.channelId) {
      serverId = newState.guild.id
      channelId = newState.channelId
      // log(`User joined voice channel:\nServer ID: ${serverId}\nChannel ID: ${channelId}`, 'voiceStateUpdate')
      if (!overlay) {
        overlay = new BrowserWindow({
          title: 'Remedy Overlay Component',
          useContentSize: true,
          x: 0,
          y: 0,
          frame: false,
          hasShadow: false,
          resizable: false,
          fullscreenable: false,
          transparent: true,
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            zoomFactor: 0.85,
            devTools: notPackaged
          }
        })
        overlay.setSkipTaskbar(!darwin)
        overlay.setBounds(windowState)
        overlay.setAlwaysOnTop(true, 'screen-saver')
        overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
        overlay.setIgnoreMouseEvents(true)
        overlay.setFocusable(false)
        overlay.webContents.setZoomFactor(90)
        overlay.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, '/overlayScript.js')))
        const url = `https://streamkit.discord.com/overlay/voice/${serverId}/${channelId}?icon=true&online=true&logo=white&text_color=${preferences.preferences.Interface.txt_color.replace('#', '%23')}&text_size=${preferences.preferences.Interface.txt_size}&text_outline_color=${preferences.preferences.Interface.txt_outline_color.replace('#', '%23')}&text_outline_size=${preferences.preferences.Interface.txt_outline_size}&text_shadow_color=${preferences.preferences.Interface.txt_shadow_color.replace('#', '%23')}&text_shadow_size=${preferences.preferences.Interface.txt_shadow_size}&bg_color=${preferences.preferences.Interface.bg_color.replace('#', '%23')}&bg_opacity=${parseFloat(preferences.preferences.Interface.bg_opacity) / 100}&bg_shadow_color=${preferences.preferences.Interface.bg_shadow_color.replace('#', '%23')}&bg_shadow_size=${preferences.preferences.Interface.bg_shadow_size}&invite_code=&limit_speaking=${preferences.preferences.Interface.general.includes('users_only')}&small_avatars=${preferences.preferences.Interface.general.includes('small_avt')}&hide_names=${preferences.preferences.Interface.general.includes('hide_nick')}&fade_chat=0`
        overlay.loadURL(url.replaceAll('true', 'True'))
        log('Overlay loaded:', 'voiceStateUpdate')
        log(url, 'voiceStateUpdate')
        await overlay.webContents.insertCSS(`
          #root {
            -webkit-app-region: drag;
            user-select: none;
            pointer-events: none;
          }
        `)
        contextMenu.items[1].enabled = true
      }
    } else {
      try {
        contextMenu.items[1].enabled = false
        createMenu('Preferences menu', 'Unpin overlay', 'Close')
        const bounds = overlay.getBounds()
        storage.set('screenPosition', { windowState: bounds })
        windowState = bounds
        overlay?.close()
      } catch (e) {
        // log(e, 'voiceStateUpdate')
      }
      overlay = undefined
    }
  }
})

preferences.on('save', () => {
  if (overlay) {
    const url = `https://streamkit.discord.com/overlay/voice/${serverId}/${channelId}?icon=true&online=true&logo=white&text_color=${preferences.preferences.Interface.txt_color.replace('#', '%23')}&text_size=${preferences.preferences.Interface.txt_size}&text_outline_color=${preferences.preferences.Interface.txt_outline_color.replace('#', '%23')}&text_outline_size=${preferences.preferences.Interface.txt_outline_size}&text_shadow_color=${preferences.preferences.Interface.txt_shadow_color.replace('#', '%23')}&text_shadow_size=${preferences.preferences.Interface.txt_shadow_size}&bg_color=${preferences.preferences.Interface.bg_color.replace('#', '%23')}&bg_opacity=${parseFloat(preferences.preferences.Interface.bg_opacity) / 100}&bg_shadow_color=${preferences.preferences.Interface.bg_shadow_color.replace('#', '%23')}&bg_shadow_size=${preferences.preferences.Interface.bg_shadow_size}&invite_code=&limit_speaking=${preferences.preferences.Interface.general.includes('users_only')}&small_avatars=${preferences.preferences.Interface.general.includes('small_avt')}&hide_names=${preferences.preferences.Interface.general.includes('hide_nick')}&fade_chat=0`.replaceAll('true', 'True')
    overlay.loadURL(url)
    overlay.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, '/overlayScript.js')))
  }
})

function loginSetup() {
  const prompt = new BrowserWindow({
    title: 'Remedy login prompt',
    titleBarStyle: 'hidden',
    width: 400,
    height: 500,
    center: true,
    resizable: false,
    fullscreenable: false,
    acceptFirstMouse: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      zoomFactor: 0.85,
      devTools: false
    }
  })
  prompt.webContents.loadFile(path.join(__dirname, '/prompt/loginPrompt.html'))
  prompt.on('close', () => {
    app.quit()
  })
  const AuthWebsocket = new DiscordAuthWebsocket()
  AuthWebsocket.connect()
  AuthWebsocket.on('ready', (_, url) => {
    prompt.webContents.send('event', { action: 'qrRen', args: { qrCodeUrl: url } })
    prompt.show()
  })
    .on('finish', (_, token) => {
      storage.set('discordToken', { token: token })
      prompt.destroy()
      client.login(token).catch(e => {
        loginSetup()
      })
    })
  ipcMain.once('login_m_token', (_, msg) => {
    try {
      prompt.destroy()
      AuthWebsocket.destroy()
    } catch (e) {
    } finally {
      const prompt = require('custom-electron-prompt')
      prompt({
        title: 'Login with Discord Token',
        label: 'Please input your Discord token:',
        value: '',
        type: 'input'
      })
        .then((r) => {
          if (r === null) {
            log('user cancelled', 'client')
            log('Exited application with code 0', 'client')
            app.quit()
          } else {
            storage.set('discordToken', { token: r })
            client.login(r).catch(e => {
              loginSetup()
            })
          }
        })
        .catch(console.error)
    }
  })
}

storage.get('discordToken', function (error, object) {
  if (error) throw error
  client.login(object.token).catch(e => {
    loginSetup()
  })
})
