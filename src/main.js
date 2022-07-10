const { Client } = require('discord.js-selfbot-v13');
const client = new Client();
const { app, BrowserWindow, screen, Menu, Tray, nativeTheme, nativeImage } = require('electron')
const path = require("path")
const storage = require('electron-json-storage');
const pie = require('puppeteer-in-electron')
const puppeteer = require('puppeteer-core')
const { preferences } = require('./preferences.js')
let tray, page, service, overlay, serverId, channelId;

nativeTheme.themeSource = 'dark'

const trayIcon = nativeImage.createFromPath(path.join(__dirname, '/icon/favicon.png')).resize({
  width: 18,
  height: 18,
});
if (process.platform === 'darwin') {
  app.dock.hide()
}

function log(message, type) {
  message.split('\n').forEach(line => console.log(`remedy [${type || 'info'}]: ${line}`))
};

client.on('ready', async () => {
  log(`logged in with account ${client.user.username}.`);
})

async function initialize() {
  log(`Starting services\nVersion ${require('../package.json').version}`, 'client')
  await pie.initialize(app)
}

async function createWindow() {
  log('Creating window...', 'client')
  tray = new Tray(trayIcon);
  function Createmenu(tab1, tab2) {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: tab1, click: function () {
          if (preferences?.prefsWindow) {
            preferences.prefsWindow.show()
          } else {
            preferences.show()
          }
        }
      },
      {
        label: tab2, click: function () {
          log('exited application with code 0', 'client');
          return app.quit()
        }
      }
    ]);
    tray.setContextMenu(contextMenu);
  }
  Createmenu('Preferences menu', 'Close')
  const size = screen.getPrimaryDisplay().workAreaSize
  service = new BrowserWindow({
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
    show: false,
  })
  service.loadURL('https://streamkit.discord.com/overlay')
  const browser = await pie.connect(app, puppeteer)
  page = await pie.getPage(browser, service)
  await page.goto('https://streamkit.discord.com/overlay')
  await page.waitForSelector('.install-button button', { timeout: 0 });
  await page.evaluate(function (selector) {
    document.querySelector(selector).click();
  }, '.install-button button')
  await page.waitForSelector('button[value=voice]', { timeout: 0 });
  await page.evaluate(function (selector) {
    document.querySelector(selector).click();
  }, 'button[value=voice]')
}
initialize()

app.on('ready', async () => {
  createWindow()
})

client.on('voiceStateUpdate', async (oldState, newState) => {
  const member = newState.member;
  if (member.user == client.user) {
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
    if (newState.channelId !== oldState.channelId && !oldState.channelId) {
      serverId = newState.guild.id;
      channelId = newState.channelId;
      log(`User joined voice channel:\nServer ID: ${serverId}\nChannel ID: ${channelId}`, 'voiceStateUpdate');
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
        overlay.setAlwaysOnTop(true, 'screen-saver')
        overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
        overlay.setIgnoreMouseEvents(true)
        overlay.setFocusable(false)
        overlay.webContents.setZoomFactor(90)
        overlay.webContents.executeJavaScript(`if (typeof console.oldlog === 'undefined') { console.oldlog = console.log; } window.consoleCatchers = []; console.log = function (text, input) { if (typeof input !== 'undefined') { window.consoleCatchers.forEach(function (item, index) { item(input) }) } else { console.oldlog(text); } }; window.consoleCatchers.push(function (input) { if (input.evt == 'VOICE_STATE_UPDATE') { name = input.data.nick; uState = input.data.voice_state; muteicon = ''; if (uState.self_mute || uState.mute) { muteicon = "<img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAABhMAAAYJQE8CCw1AAAAB3RJTUUH5AUGCx0VMm5EjgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAABzSURBVDjLxZIxCsAwCEW/oT1P7z93zZJjeIYMv0sCIaBoodTJDz6/JgJfBslOsns1xYONvK66JCeqAC4ALTz+dJvOo0lu/zS87p2C98IdHlq9Buo5D62h17amScMk78hBWXB/DUdP2fyBaINjJiJy4o94AM8J8ksz/MQjAAAAAElFTkSuQmCC' style='height:0.9em;padding-left:5px;transform: translateY(1px);'>"; } deaficon = ''; if (uState.self_deaf || uState.deaf) { deaficon = "<img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAABhMAAAYJQE8CCw1AAAAB3RJTUUH5AUGCx077rhJQQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAACNSURBVDjLtZPNCcAgDIUboSs4iXTGLuI2XjpBz87g4fWiENr8iNBAQPR9ef7EbfsjAEQAN4A2UtCcGtyMzFxjwVlyBHAwTRFh52gqHDVnF+6L1XJ/w31cp7YvOX/0xlOJ254qYJ1ZLTAmPWeuDVxARDurfBFR8jovMLEKWxG6c1qB55pEuQOpE8vKz30AhEdNuXK0IugAAAAASUVORK5CYII=' style='height:0.9em;padding-left:5px;transform: translateY(1px);'>"; } spans = document.getElementsByTagName('span'); for (i = 0; i < spans.length; i++) { if (spans[i].innerHTML.startsWith(name)) { text = name + muteicon + deaficon; spans[i].innerHTML = text; } } } });`)
        let url = `https://streamkit.discord.com/overlay/voice/${serverId}/${channelId}?icon=true&online=true&logo=white&text_color=${preferences.preferences.Interface.txt_color.replace('#', '%23')}&text_size=${preferences.preferences.Interface.txt_size}&text_outline_color=${preferences.preferences.Interface.txt_outline_color.replace('#', '%23')}&text_outline_size=${preferences.preferences.Interface.txt_outline_size}&text_shadow_color=${preferences.preferences.Interface.txt_shadow_color.replace('#', '%23')}&text_shadow_size=${preferences.preferences.Interface.txt_shadow_size}&bg_color=${preferences.preferences.Interface.bg_color.replace('#', '%23')}&bg_opacity=${parseFloat(preferences.preferences.Interface.bg_opacity) / 100}&bg_shadow_color=${preferences.preferences.Interface.bg_shadow_color.replace('#', '%23')}&bg_shadow_size=${preferences.preferences.Interface.bg_shadow_size}&invite_code=&limit_speaking=${preferences.preferences.Interface.general.includes('users_only')}&small_avatars=${preferences.preferences.Interface.general.includes('small_avt')}&hide_names=${preferences.preferences.Interface.general.includes('hide_nick')}&fade_chat=0`
        overlay.loadURL(url.replaceAll('true', 'True'))
      }
    } else {
      overlay?.close()
      return overlay = undefined;
    }
  }
});

preferences.on('save', () => {
  let url = `https://streamkit.discord.com/overlay/voice/${serverId}/${channelId}?icon=true&online=true&logo=white&text_color=${preferences.preferences.Interface.txt_color.replace('#', '%23')}&text_size=${preferences.preferences.Interface.txt_size}&text_outline_color=${preferences.preferences.Interface.txt_outline_color.replace('#', '%23')}&text_outline_size=${preferences.preferences.Interface.txt_outline_size}&text_shadow_color=${preferences.preferences.Interface.txt_shadow_color.replace('#', '%23')}&text_shadow_size=${preferences.preferences.Interface.txt_shadow_size}&bg_color=${preferences.preferences.Interface.bg_color.replace('#', '%23')}&bg_opacity=${parseFloat(preferences.preferences.Interface.bg_opacity) / 100}&bg_shadow_color=${preferences.preferences.Interface.bg_shadow_color.replace('#', '%23')}&bg_shadow_size=${preferences.preferences.Interface.bg_shadow_size}&invite_code=&limit_speaking=${preferences.preferences.Interface.general.includes('users_only')}&small_avatars=${preferences.preferences.Interface.general.includes('small_avt')}&hide_names=${preferences.preferences.Interface.general.includes('hide_nick')}&fade_chat=0`.replaceAll('true', 'True')
  overlay.loadURL(url)
});

storage.get('discordToken', function (error, object) {
  if (error) throw error;
  if (object.token) {
    client.login(object.token);
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
          log('user cancelled', 'client');
        } else {
          storage.set('discordToken', { token: r })
          client.login(r);
        }
      })
      .catch(console.error);
  }
});