<h1 align="center">
  <a href="https://github.com/Naozumi520/discordOverlayMac"><img src="./src/icon/favicon.png" avtar_c_icon" width="200"></a>
  <br>
  Remedy Pro
  <br>
  <br>
</h1>

# Usage  

## 1. Installation  
<p align="center">
  <img style='height: 50%; width: 50%; object-fit: contain' src="src/img/Remedy_dmg.png" />
</p>

Download the .dmg from [release page](https://github.com/Naozumi520/Remedy/releases), open the .dmg file and drag the `Remedy Pro.app` to the Applications folder.  
  
## 2. Startup  
<p align="center">
  <img style='height: 50%; width: 50%; object-fit: contain' src="src/img/Remedy_ico.png" />
</p>

Double click "Remedy Standard" from your application list to open it. For some reasons this app is not signed yet. If you're not able to open the app, follow [this](https://support.apple.com/en-hk/guide/mac-help/mh40616/mac). If remedy run properly, you should able to see the Remedy icon appear in the menu bar.  

## 3. Log in to Remedy
<p align="center">
  <img style='height: 50%; width: 50%;' src="src/img/login.png" />
</p>

## 4. Test  
Join a random channel. You should now see the overlay. Pressing control + ` should show the chat overlay.  
<p align="center">
  <img style='height: 50%; width: 50%;' src="src/img/overlay.png" />
  <img style='height: 50%; width: 50%;' src="src/img/chat_overlay.png" />
</p>

# Questions

## How can I customize or quit the overlay?  
<p align="center">
  <img style='height: 50%; width: 50%; object-fit: contain' src="src/img/menu.png" />
  <img style='height: 50%; width: 50%; object-fit: contain' src="src/img/preferences.png" />
</p>

After clicking the Remedy icon, there are few options in the menu bar:   
- `Preferences menu`:
  Open the overlay preferences menu, where you can adjust the overlays, such as text color and the size. The settings will be applied immediately.
- `Close`:
  To quit remedy.

## Can overlay override a fullscreen app?  
Yes, Remedy overlay can override maximized and fullscreen apps.  

## Can Remedy run automatically on macOS startup?  
Yes, simply turn on `Start at login` in Preferences.
<p align="center">
  <img style='height: 50%; width: 50%; object-fit: contain' src="https://user-images.githubusercontent.com/52615455/209567174-0bb68b13-b29c-48ca-aeb0-ade28a8f5b42.png"/>
</p>

## Why does Remedy have no icon on the dock?
Due to the overlay behavior under macOS, Remedy has no icon on the dock. To keep the overlay on top of a simple fullscreen (AKA borderless screen), Remedy has to be to hide the icon from the dock and you'll only see it when the login screen or preferences is opened.

## Remedy is so big? 92.2MB!
Remedy was created with [ElectronJS](https://www.electronjs.org), and it's based on chromium. Sizing is a known issue and I've been doing my best to keep the pack size down. I'm still looking for a alternatives.

## Discord TOS?
As you know, Remedy uses packages like `discord.js-selfbot-v13`. Indeed, this against Discord TOS, as it uses some tricks that can be counted as selfbots, in order to get the user's voice status (#3) and allow the discord streamkit to work on group chats and dm calls (#4). However, Remedy only uses restricted api (`voiceStateUpdate`, `client.user.voice`) and does no harm to other users (no spam, not includes nitro snipers, etc.). If Remedy was downloaded from the `Naozumi\Remedy` github repo, you'll be fine so far. If you received warning from Discord, please report back ASAP and stop using Remedy.