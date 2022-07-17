const { Client } = require('discord.js-selfbot-v13')
const client = new Client()
const { app, BrowserWindow, Menu, Tray, nativeTheme, nativeImage } = require('electron')
const path = require('path')
const storage = require('electron-json-storage')
const pie = require('puppeteer-in-electron')
const puppeteer = require('puppeteer-core')
const { preferences } = require('./preferences.js')
let tray, page, service, overlay, contextMenu, createMenuOuter, serverId, channelId
let overlayUnpinned = false

nativeTheme.themeSource = 'dark'
app.dock.hide()

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

async function createWindow() {
  log('Creating window...', 'client')
  storage.get('screenPosition', function (error, object) {
    if (object.windowState) {
      log('Restoring overlay position...', 'client')
      windowState = object.windowState
    }
  })
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
          if (overlayUnpinned) {
            overlay.setIgnoreMouseEvents(false)
            overlay.setFocusable(true)
          } else {
            overlay.setIgnoreMouseEvents(true)
            overlay.setFocusable(false)
            storage.set('screenPosition', { windowState: overlay.getBounds() })
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
    return contextMenu
  }
  createMenuOuter = createMenu
  createMenu('Preferences menu', 'Unpin overlay', 'Close')
  service = new BrowserWindow({
    title: 'DiscordOverlayMac',
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
  service.loadURL('https://streamkit.discord.com/overlay')
  const browser = await pie.connect(app, puppeteer)
  page = await pie.getPage(browser, service)
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
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, '/icon/favicon.png')).resize({
    width: 18,
    height: 18
  })
  tray = new Tray(trayIcon)
  createWindow()
})

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (newState?.user == client.user) {
    if (oldState.selfMute === true && newState.selfMute === false) {
      return
    }
    if (oldState.selfMute === false && newState.selfMute === true) {
      return
    }
    if (oldState.selfDeaf === true && newState.selfDeaf === false) {
      return
    }
    if (oldState.selfDeaf === false && newState.selfDeaf === true) {
      return
    }
    if (oldState.serverMute === true && newState.serverMute === false) {
      return
    }
    if (oldState.serverMute === false && newState.serverMute === true) {
      return
    }
    if (oldState.serverDeaf === true && newState.serverDeaf === false) {
      return
    }
    if (oldState.serverDeaf === false && newState.serverDeaf === true) {
      return
    }
    if (oldState.selfVideo === true && newState.selfVideo === false) {
      return
    }
    if (oldState.selfVideo === false && newState.selfVideo === true) {
      return
    }
    if (oldState.streaming === true && newState.streaming === false) {
      return
    }
    if (oldState.streaming === false && newState.streaming === true) {
      return
    }
    if (newState.channelId !== oldState.channelId && !oldState.channelId) {
      serverId = newState.guild.id
      channelId = newState.channelId
      log(`User joined voice channel:\nServer ID: ${serverId}\nChannel ID: ${channelId}`, 'voiceStateUpdate')
      if (!overlay) {
        overlay = new BrowserWindow({
          title: 'Remedy Overlay Component',
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
        overlay.setBounds(windowState)
        overlay.setAlwaysOnTop(true, 'screen-saver')
        overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
        overlay.setIgnoreMouseEvents(true)
        overlay.setFocusable(false)
        overlay.webContents.setZoomFactor(90)
        overlay.webContents.executeJavaScript('if (typeof console.oldlog === \'undefined\') { console.oldlog = console.log; } window.consoleCatchers = []; console.log = function (text, input) { if (typeof input !== \'undefined\') { window.consoleCatchers.forEach(function (item, index) { item(input) }) } else { console.oldlog(text); } }; window.consoleCatchers.push(function (input) { if (input.evt == \'VOICE_STATE_UPDATE\') { name = input.data.nick; uState = input.data.voice_state; muteicon = \'\'; if (uState.self_mute || uState.mute) { muteicon = "<img src=\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAABhMAAAYJQE8CCw1AAAAB3RJTUUH5AUGCx0VMm5EjgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAABzSURBVDjLxZIxCsAwCEW/oT1P7z93zZJjeIYMv0sCIaBoodTJDz6/JgJfBslOsns1xYONvK66JCeqAC4ALTz+dJvOo0lu/zS87p2C98IdHlq9Buo5D62h17amScMk78hBWXB/DUdP2fyBaINjJiJy4o94AM8J8ksz/MQjAAAAAElFTkSuQmCC\' style=\'height:0.9em;padding-left:3px;transform: translateY(1px);\'>"; } deaficon = \'\'; if (uState.self_deaf || uState.deaf) { deaficon = "<img src=\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAABhMAAAYJQE8CCw1AAAAB3RJTUUH5AUGCx077rhJQQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAACNSURBVDjLtZPNCcAgDIUboSs4iXTGLuI2XjpBz87g4fWiENr8iNBAQPR9ef7EbfsjAEQAN4A2UtCcGtyMzFxjwVlyBHAwTRFh52gqHDVnF+6L1XJ/w31cp7YvOX/0xlOJ254qYJ1ZLTAmPWeuDVxARDurfBFR8jovMLEKWxG6c1qB55pEuQOpE8vKz30AhEdNuXK0IugAAAAASUVORK5CYII=\' style=\'height:0.9em;padding-left:3px;transform: translateY(1px);\'>"; } spans = document.getElementsByTagName(\'span\'); for (i = 0; i < spans.length; i++) { if (spans[i].innerHTML.startsWith(name)) { text = name + muteicon + deaficon; spans[i].innerHTML = text; } } } });')
        const url = `https://streamkit.discord.com/overlay/voice/${serverId}/${channelId}?icon=true&online=true&logo=white&text_color=${preferences.preferences.Interface.txt_color.replace('#', '%23')}&text_size=${preferences.preferences.Interface.txt_size}&text_outline_color=${preferences.preferences.Interface.txt_outline_color.replace('#', '%23')}&text_outline_size=${preferences.preferences.Interface.txt_outline_size}&text_shadow_color=${preferences.preferences.Interface.txt_shadow_color.replace('#', '%23')}&text_shadow_size=${preferences.preferences.Interface.txt_shadow_size}&bg_color=${preferences.preferences.Interface.bg_color.replace('#', '%23')}&bg_opacity=${parseFloat(preferences.preferences.Interface.bg_opacity) / 100}&bg_shadow_color=${preferences.preferences.Interface.bg_shadow_color.replace('#', '%23')}&bg_shadow_size=${preferences.preferences.Interface.bg_shadow_size}&invite_code=&limit_speaking=${preferences.preferences.Interface.general.includes('users_only')}&small_avatars=${preferences.preferences.Interface.general.includes('small_avt')}&hide_names=${preferences.preferences.Interface.general.includes('hide_nick')}&fade_chat=0`
        overlay.loadURL(url.replaceAll('true', 'True'))
        await overlay.webContents.insertCSS(`
          * {
            -webkit-app-region: drag;
            user-select: none;
            pointer-events: none;
          }
        `)
        contextMenu.items[1].enabled = true
      }
    } else {
      overlay?.close()
      contextMenu.items[1].enabled = false
      createMenuOuter('Preferences menu', 'Unpin overlay', 'Close')
      storage.set('screenPosition', { windowState: overlay.getBounds() })
      return overlay = undefined
    }
  }
})

preferences.on('save', () => {
  const url = `https://streamkit.discord.com/overlay/voice/${serverId}/${channelId}?icon=true&online=true&logo=white&text_color=${preferences.preferences.Interface.txt_color.replace('#', '%23')}&text_size=${preferences.preferences.Interface.txt_size}&text_outline_color=${preferences.preferences.Interface.txt_outline_color.replace('#', '%23')}&text_outline_size=${preferences.preferences.Interface.txt_outline_size}&text_shadow_color=${preferences.preferences.Interface.txt_shadow_color.replace('#', '%23')}&text_shadow_size=${preferences.preferences.Interface.txt_shadow_size}&bg_color=${preferences.preferences.Interface.bg_color.replace('#', '%23')}&bg_opacity=${parseFloat(preferences.preferences.Interface.bg_opacity) / 100}&bg_shadow_color=${preferences.preferences.Interface.bg_shadow_color.replace('#', '%23')}&bg_shadow_size=${preferences.preferences.Interface.bg_shadow_size}&invite_code=&limit_speaking=${preferences.preferences.Interface.general.includes('users_only')}&small_avatars=${preferences.preferences.Interface.general.includes('small_avt')}&hide_names=${preferences.preferences.Interface.general.includes('hide_nick')}&fade_chat=0`.replaceAll('true', 'True')
  if (overlay) {
    overlay.loadURL(url)
  }
})

storage.get('discordToken', function (error, object) {
  if (error) throw error
  if (object.token) {
    client.login(object.token)
  } else {
    const prompt = require('custom-electron-prompt')
    prompt({
      title: 'Discord Token not found',
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
          client.login(r)
        }
      })
      .catch(console.error)
  }
})
