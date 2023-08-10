const { preferences } = require('./components/preferences/preferences.js')
const { Client } = require('discord.js-selfbot-v13')
const client = new Client({
  DMSync: preferences.preferences.Interface.dm_sync.includes('dm_sync')
})
const { app, session, screen, globalShortcut, BrowserWindow, BrowserView, ipcMain, Menu, Tray, nativeTheme, nativeImage, dialog, shell } = require('electron')
const fs = require('fs')
const path = require('path')
const storage = require('electron-json-storage')
const pie = require('puppeteer-in-electron')
const puppeteer = require('puppeteer-core')
let tray, page, discordAppOverlay, discordAppView, backService, overlay, contextMenu, aboutRMD, serverId, channelId
let darwin, showOverlay = true
let ready, discordAppCurrentlyShowing, overlayUnpinned = false

app.disableHardwareAcceleration() // Turn off Hardware Acceleration to make the overlay smoother during gaming or video playback. This will also help make the experience smoother.

const notPackaged = !app.isPackaged
nativeTheme.themeSource = 'dark'

let windowState = {
  x: 0,
  y: 0
}

function log (message, type) {
  try {
    message.split('\n').forEach(line => console.log(`Remedy Pro [${type || 'info'}]: ${line}`))
  } catch (e) {
    console.log(message)
  }
};

function safeQuit () {
  client?.destroy()
  app.quit()
}

app.on('ready', async () => {
  discordAppView = new BrowserView({
    webPreferences: {
      devTools: notPackaged
    }
  })
  discordAppView.webContents.loadURL('https://discord.com/login')
  discordAppView.webContents.once('did-finish-load', () => {
    storage.get('discordToken', function (error, object) {
      if (error) throw error
      discordAppView.webContents.executeJavaScript(`
        setInterval(() => {
          document.body.appendChild(document.createElement \`iframe\`).contentWindow.localStorage.token = \`"${object.token}"\`
        }, 50);
        setTimeout(() => {
          location.reload();
        }, 2500);
      `)
    })
    discordAppView.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, '/discordAppCustomization.js')))
    const trayIcon = nativeImage.createFromPath(path.join(__dirname, '/icon/favicon_menu.png')).resize({
      width: 16,
      height: 16
    })
    trayIcon.setTemplateImage(true)
    tray = new Tray(trayIcon)
    storage.get('discordToken', function (error, object) {
      if (error) throw error
      ready = true
      client.login(object.token).catch((e) => {
        ready = false
        log(e.toString())
        loginSetup()
      })
    })
    createWindow()
    if (!app.getAppPath().startsWith('/Applications') && app.isPackaged) {
      storage.get('dialogonceshown', function (error, bool) {
        if (Object.keys(bool).length === 0 || bool === false) {
          if (error) throw error
          const dialogFocusMethod = new BrowserWindow()
          dialogFocusMethod.destroy()// MessageBox is not focus by default, creating a browserWindow and immediately destroy.
          dialog.showMessageBox({
            type: 'question',
            message: 'Move to the Application folder?',
            detail: 'Some features may require you to move Remedy to the Applications folder in order to work properly.',
            buttons: [
              'Move to the Application Folder',
              'Do not move'
            ],
            cancelId: 1,
            checkboxLabel: 'Don\'t ask again',
            checkboxChecked: true
          })
            .then((result) => {
              storage.set('dialogonceshown', result.checkboxChecked)
              if (result.response !== 0) { return }
              if (result.response === 0) {
                app.moveToApplicationsFolder()
              }
            })
        }
      })
    }
  })
})

async function initialize () {
  log(`Starting services\nVersion ${require('../package.json').version}`, 'client')
  await pie.initialize(app)
}

function createMenu (tab1, tab2, tab3, tab4) {
  contextMenu = Menu.buildFromTemplate([
    {
      label: 'About Remedy...',
      click: function () {
        aboutRMD?.show()
        if (!aboutRMD) {
          aboutRMD = new BrowserWindow({
            title: 'Remedy Pro',
            titleBarStyle: 'hiddenInset',
            width: 285,
            height: 167,
            resizable: false,
            fullscreenable: false,
            hasShadow: false,
            webPreferences: {
              nodeIntegration: true,
              contextIsolation: false,
              zoomFactor: 0.85,
              devTools: notPackaged
            }
          })
          aboutRMD.webContents.loadFile(path.join(__dirname, '/components/about/index.html'))
          aboutRMD.webContents.on('will-navigate', function (e, url) {
            e.preventDefault()
            shell.openExternal(url)
          })
          aboutRMD.on('closed', function () {
            aboutRMD = null
          })
        }
      }
    },
    { type: 'separator' },
    {
      label: tab1,
      enabled: false,
      accelerator: 'Control+Shift+`',
      click: function () {
        showOverlay = !showOverlay
        showOverlay ? overlay.show() : overlay.hide()
        createMenu(showOverlay ? 'Hide overlay' : 'Show overlay', 'Preferences...', overlayUnpinned ? 'Pin overlay' : 'Unpin overlay', 'Quit')
        contextMenu.items[2].enabled = true
        contextMenu.items[4].enabled = true
      }
    },
    {
      label: tab2,
      click: function () {
        preferences.show()
        preferences.prefsWindow?.show()
        preferences.prefsWindow.once('closed', () => {
          if (darwin) app.dock.hide()
        })
        if (darwin) app.dock.show()
      }
    },
    {
      label: tab3,
      enabled: false,
      click: async function () {
        overlayUnpinned = !overlayUnpinned
        createMenu(showOverlay ? 'Hide overlay' : 'Show overlay', 'Preferences...', overlayUnpinned ? 'Pin overlay' : 'Unpin overlay', 'Quit')
        contextMenu.items[2].enabled = true
        contextMenu.items[4].enabled = true
        overlay.setIgnoreMouseEvents(!overlayUnpinned)
        overlay.setFocusable(overlayUnpinned)
        const bounds = overlay.getBounds()
        storage.set('screenPosition', { windowState: bounds })
        windowState = bounds
      }
    },
    { type: 'separator' },
    {
      label: tab4,
      click: function () {
        overlay?.webContents.insertCSS(`
        #root {
          animation-name: disappear;
          animation-duration: 1.25s;
          animation-fill-mode: forwards;
        }
        `)
        setTimeout(() => {
          log('Exited application with code 0')
          return safeQuit()
        }, 200)
      }
    }
  ])
  tray.setContextMenu(contextMenu)
  return contextMenu
}

async function createWindow () {
  log('Creating window...', 'client')
  storage.get('screenPosition', function (error, object) {
    if (error) throw error
    if (object.windowState) {
      log('Restoring overlay position...', 'client')
      windowState = object.windowState
    }
  })
  createMenu(showOverlay ? 'Hide overlay' : 'Show overlay', 'Preferences...', 'Unpin overlay', 'Quit')
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
      devTools: notPackaged
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

function createOverlay (serverId, channelId, streamingUsr) {
  if (!overlay) {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.size
    overlay = new BrowserWindow({
      title: 'Remedy Overlay Component',
      useContentSize: true,
      x: 0,
      y: 0,
      frame: false,
      type: 'panel',
      hasShadow: false,
      resizable: false,
      fullscreenable: false,
      alwaysOnTop: true,
      transparent: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        zoomFactor: 0.85,
        devTools: notPackaged
      }
    })
    /*
    Pure kiosk mode without menu bar, three conditions:
    - type set to panel (overlap on fullscreen application)
    - Kiosk set to false when startup
    - trigger setAlwaysOnTop to true and screen-saver when showing overlay (overlap on the menu bar)
    */
    discordAppOverlay = new BrowserWindow({
      title: 'Discord App Overlay Component',
      x: 0,
      y: 0,
      width,
      height,
      type: 'panel',
      kiosk: false, // First set kiosk to false
      frame: false,
      roundedCorners: false,
      hasShadow: false,
      resizable: false,
      fullscreenable: false,
      vibrancy: 'fullscreen-ui',
      show: false
    })
    discordAppOverlay.on('close', function (e) {
      e.preventDefault()
      discordAppOverlay.setKiosk(false) // Set Kiosk to false to quit kiosk mode. This make the taskbar appear. That's why kiosk must be false at first otherwise taskbar will disappear.
      discordAppOverlay.setAlwaysOnTop(false)
      return discordAppOverlay.hide()
    })
    discordAppView.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, '/discordAppCustomization.js')))
    discordAppOverlay.addBrowserView(discordAppView)
    discordAppOverlay.loadFile('src/components/discordApp/index.html')
    const screenWidth = screen.getPrimaryDisplay().size.width
    const screenHeight = screen.getPrimaryDisplay().size.height
    discordAppView.setBounds({ x: Math.round((screenWidth / 2) - (Math.round(screenWidth * 0.75) / 2)), y: Math.round((screenHeight / 2) - (Math.round(screenHeight * 0.75) / 2)), width: Math.round(screenWidth * 0.75), height: Math.round(screenHeight * 0.75) })
    globalShortcut.register('Control+`', () => {
      if (!discordAppCurrentlyShowing && ready) {
        discordAppCurrentlyShowing = true
        discordAppOverlay.setKiosk(true) // Set Kiosk to true
        discordAppOverlay.setAlwaysOnTop(true, 'screen-saver')
        discordAppOverlay.show()
      } else {
        discordAppCurrentlyShowing = false
        discordAppOverlay.setKiosk(false) // Set Kiosk to false to quit kiosk mode. This make the taskbar appear. That's why kiosk must be false at first otherwise taskbar will disappear.
        discordAppOverlay.setAlwaysOnTop(false)
        discordAppOverlay.hide()
      }
    })
    globalShortcut.register('Control+shift+`', () => {
      showOverlay = !showOverlay
      showOverlay ? overlay.show() : overlay.hide()
      createMenu(showOverlay ? 'Hide overlay' : 'Show overlay', 'Preferences...', overlayUnpinned ? 'Pin overlay' : 'Unpin overlay', 'Quit')
      contextMenu.items[2].enabled = true
      contextMenu.items[4].enabled = true
    })
    overlay.setSkipTaskbar(!darwin)
    overlay.setBounds(windowState)
    overlay.setIgnoreMouseEvents(true)
    overlay.setFocusable(false)
    overlay.webContents.setZoomFactor(90)
    const url = `https://streamkit.discord.com/overlay/voice/${serverId}/${channelId}?icon=true&online=true&logo=white&text_color=${preferences.preferences.Interface.txt_color.replace('#', '%23')}&text_size=${preferences.preferences.Interface.txt_size}&text_outline_color=${preferences.preferences.Interface.txt_outline_color.replace('#', '%23')}&text_outline_size=${preferences.preferences.Interface.txt_outline_size}&text_shadow_color=${preferences.preferences.Interface.txt_shadow_color.replace('#', '%23')}&text_shadow_size=${preferences.preferences.Interface.txt_shadow_size}&bg_color=${preferences.preferences.Interface.bg_color.replace('#', '%23')}&bg_opacity=${parseFloat(preferences.preferences.Interface.opacity) / 100}&bg_shadow_color=${preferences.preferences.Interface.bg_shadow_color.replace('#', '%23')}&bg_shadow_size=${preferences.preferences.Interface.bg_shadow_size}&invite_code=&limit_speaking=${preferences.preferences.Interface.general.includes('users_only')}&small_avatars=${preferences.preferences.Interface.general.includes('small_avt')}&hide_names=false&fade_chat=0`
    overlay.loadURL(url.replaceAll('true', 'True'))
    overlay.webContents.on('did-finish-load', () => {
      overlay.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, '/overlayInjectScript.js')))
      ipcMain.once('scriptReady', (_, msg) => {
        overlay.webContents.send('event', { action: 'pref:changes', args: preferences.preferences })
        if (streamingUsr && streamingUsr !== null && streamingUsr !== undefined) {
          for (let i = 0; i < streamingUsr.length; i++) {
            const member = streamingUsr[i]
            overlay.webContents.send('event', { action: 'stream:start', args: { user: member.name, userId: member.id } })
          }
        }
      })
      // if (notPackaged) overlay.webContents.openDevTools({ mode: 'detach' })
      log('Overlay loaded', 'voiceStateUpdate')
      overlay.webContents.insertCSS(`
      * {
      overflow: none !important;
      }
      #root {
        -webkit-app-region: drag;
        user-select: none;
        pointer-events: none;
        margin-top: -12px !important;
      }
      img[class^="Voice_avatar"] {
        opacity: ${parseFloat(preferences.preferences.Interface.opacity) / 100};
      }
      @keyframes disappear {
        0% {
          opacity: 1;
          transform-origin: center;
        }

        20% {
          opacity: 0.2;
          transform: translateX(-30rem);
          transform-origin: center;
        }

        100% {
            display: none;
            opacity: 0;
            transform: translateX(-60rem);
            transform-origin: center;
        }
      }
    `)
      contextMenu.items[2].enabled = true
      contextMenu.items[4].enabled = true
    })
  }
}

client.on('ready', async () => {
  log(`logged in with account ${client.user.username}.`)
  if (process.platform === 'darwin') {
    app.dock.hide()
  } else {
    darwin = false
  }
  if (client.user.voice.channel !== null && client.user.voice.channelId !== null) {
    serverId = client.user.voice.channel.guildId
    channelId = client.user.voice.channelId
    // log(`User already joined a voice channel before started up:\nServer ID: ${serverId}\nChannel ID: ${channelId}`, 'voiceStateUpdate')
    const streamingUsr = []
    client.user.voice.channel.members.forEach(member => {
      if (member.voice.streaming && member.voice.streaming !== null && member.voice.streaming !== undefined) {
        streamingUsr.push({
          id: member.id,
          name: member.user.globalName || member.user.username
        })
      }
    })
    createOverlay(serverId, channelId, streamingUsr)
  }
})

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (oldState.streaming === false && newState.streaming === true) {
    // if (notPackaged) log((!newState.member?.globalName ? newState.user.username : newState.member?.globalName) + ' started streaming!')
    if (overlay) {
      overlay.webContents.send('event', { action: 'stream:start', args: { user: (newState.member?.user.globalName || newState.user.username), userId: (!newState.member?.id ? newState.user.id : newState.member?.id) } })
    }
  }
  if (oldState.streaming === true && newState.streaming === false) {
    // if (notPackaged) log((!oldState.member?.globalName ? oldState.user.username : oldState.member?.globalName) + ' stopped streaming!')
    if (overlay) {
      overlay.webContents.send('event', { action: 'stream:stop', args: { user: (oldState.member?.user.globalName || oldState.user.username), userId: (!oldState.member?.id ? oldState.user.id : oldState.member?.id) } })
    }
  }
  if (newState?.user === client.user) {
    if (oldState.channelId === newState.channelId) return
    if (!oldState.channelId) {
      serverId = newState.guild.id
      channelId = newState.channelId
      // log(`User joined voice channel:\nServer ID: ${serverId}\nChannel ID: ${channelId}`, 'voiceStateUpdate')
      const streamingUsr = []
      client.user.voice.channel.members.forEach(member => {
        if (member.voice.streaming && member.voice.streaming !== null && member.voice.streaming !== undefined) {
          streamingUsr.push({
            id: member.id,
            name: member.user.globalName || member.user.username
          })
        }
      })
      createOverlay(serverId, channelId, streamingUsr)
    } else {
      try {
        const bounds = overlay.getBounds()
        storage.set('screenPosition', { windowState: bounds })
        windowState = bounds
        overlay?.close()
        contextMenu.items[2].enabled = false
        contextMenu.items[4].enabled = false
      } catch (e) {
        // log(e, 'voiceStateUpdate')
      }
      overlay = null
    }
  }
})

preferences.on('save', (pref) => {
  if (overlay) {
    const url = `https://streamkit.discord.com/overlay/voice/${serverId}/${channelId}?icon=true&online=true&logo=white&text_color=${preferences.preferences.Interface.txt_color.replace('#', '%23')}&text_size=${preferences.preferences.Interface.txt_size}&text_outline_color=${preferences.preferences.Interface.txt_outline_color.replace('#', '%23')}&text_outline_size=${preferences.preferences.Interface.txt_outline_size}&text_shadow_color=${preferences.preferences.Interface.txt_shadow_color.replace('#', '%23')}&text_shadow_size=${preferences.preferences.Interface.txt_shadow_size}&bg_color=${preferences.preferences.Interface.bg_color.replace('#', '%23')}&bg_opacity=${parseFloat(preferences.preferences.Interface.opacity) / 100}&bg_shadow_color=${preferences.preferences.Interface.bg_shadow_color.replace('#', '%23')}&bg_shadow_size=${preferences.preferences.Interface.bg_shadow_size}&invite_code=&limit_speaking=${preferences.preferences.Interface.general.includes('users_only')}&small_avatars=${preferences.preferences.Interface.general.includes('small_avt')}&hide_names=false&fade_chat=0`.replaceAll('true', 'True')
    overlay.loadURL(url)
    overlay.webContents.on('did-finish-load', () => {
      overlay.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, '/overlayInjectScript.js')))
      ipcMain.once('scriptReady', (_, msg) => {
        overlay.webContents.send('event', { action: 'pref:changes', args: preferences.preferences })
        log('Overlay loaded', 'voiceStateUpdate')
        overlay.webContents.insertCSS(`
      * {
      overflow: none !important;
      }
      #root {
        -webkit-app-region: drag;
        user-select: none;
        pointer-events: none;
        margin-top: -12px !important;
      }
      img[class^="Voice_avatar"] {
        opacity: ${parseFloat(preferences.preferences.Interface.opacity) / 100};
      }
      @keyframes disappear {
        0% {
          opacity: 1;
          transform-origin: center;
        }

        20% {
          opacity: 0.2;
          transform: translateX(-30rem);
          transform-origin: center;
        }

        100% {
            display: none;
            opacity: 0;
            transform: translateX(-60rem);
            transform-origin: center;
        }
      }
    `)
      })
    })
  }
  if (pref?.Interface.remedy_opt.includes('start_at_login')) {
    app.setLoginItemSettings({
      openAtLogin: true
    })
  } else {
    app.setLoginItemSettings({
      openAtLogin: false
    })
  }
})

function loginSetup () {
  app.dock.show()
  const promptWrapper = new BrowserWindow({
    title: 'Remedy login discordAppView',
    titleBarStyle: 'hidden',
    width: 900,
    height: 600,
    center: true,
    resizable: false,
    fullscreenable: false,
    acceptFirstMouse: true,
    show: false,
    backgroundColor: '#2B2D31'
  })
  if (!discordAppView) return loginSetup()
  promptWrapper.setBrowserView(discordAppView)
  discordAppView.setBounds({ x: 0, y: 0, width: 900, height: 600 })
  setTimeout(() => {
    promptWrapper.show()
  }, 1000)
  promptWrapper.on('close', () => {
    setTimeout(() => {
      if (!ready) {
        app.quit()
      }
    }, 1000)
  })
  const ses = session.defaultSession
  ses.webRequest.onBeforeRequest((details, callback) => {
    if (ready) return callback({})
    // console.log(details.url)
    if (details.url.startsWith('https://api.spotify.com/v1/me/player')) {
      promptWrapper.hide()
    }
    if (details.url.startsWith('https://discord.com/api/v9/users/@me/burst-credits')) {
      discordAppView.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, '/tokenGrabber.js'))).then((token) => {
        promptWrapper.close()
        if (token) {
          storage.set('discordToken', { token })
          ready = true
          client.login(token).catch((e) => {
            ready = false
            log(e.toString())
            loginSetup()
          })
        } else {
          loginSetup()
        }
      })
    }
    callback({})
  })
}

if (app.isPackaged) {
  dialog.showErrorBox = function (title, content) {
    log(`${title}\n${content}`)
  }
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
