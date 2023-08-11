<h1 align="center">
  <a href="https://github.com/Naozumi520/discordOverlayMac"><img src="./src/icon/favicon.png" avtar_c_icon" width="200"></a>
  <br>
  Remedy
  <br>
  <br>
</h1>

[![CodeFactor](https://www.codefactor.io/repository/github/naozumi520/remedy/badge)](https://www.codefactor.io/repository/github/naozumi520/remedy)

# Introduction
Remedy is a application for displaying an overlay of discord voice channels even in fullscreen application under macOS.  

# Motivation
I made this app because the discord overlay is currently only available for Windows. This annoys me a bit because I use the feature a lot. (Who doesn't want to some little games and chat even on the mac?)

# About the application
Remedy comes in two editions, Standard and Pro. This app was made using the Discord streaming kit which had limited function, so in order to perform like the official Discord client (see the table below), some tricks have to be used. But it uses some selfbot-related tricks which against the Discord TOS. If you're not happy with that, you can just use the standard version, but it's less convenient.

| Features                                                 | Standard           | Pro                |
| -------------------------------------------------------- | ------------------ | ------------------ |
| Show users when someone joining the VC                   | :white_check_mark: | :white_check_mark: |
| Green border around the avatar when someone speaks       | :white_check_mark: | :white_check_mark: |
| Show the mute/deafen status                              | :white_check_mark: | :white_check_mark: |
| Detect which VC your in and create overlay automatically | :x:                | :white_check_mark: |
| Group calls/ DM calls                                    | :x:                | :white_check_mark: |
| 'Live' icon when someone is streaming                    | :x:                | :white_check_mark: |
| Show an eye when someone is watching your stream         | :x:                | :x:                |
| Discord chat overlay                                     | :x:                | :white_check_mark: |

## Usage
[Standard](Standard.md) | [Pro](Pro.md)

## Credit
### [trigg](https://github.com/trigg) / [Discover](https://github.com/trigg/Discover)
Trigg shows us the possibility of getting mute/deafen status on the discord streamkit.  
His project has inspired me a lot.

### [Ganbin](https://github.com/Ganbin)
Ganbin help fixed the issue that the adjust options are not working [#1](https://github.com/Naozumi520/Remedy/issues/1).

### [Elysia](https://github.com/aiko-chan-ai)
[aiko-chan-ai/discord.js-selfbot-v13](https://github.com/aiko-chan-ai/discord.js-selfbot-v13)

### [ChinHongTan](https://github.com/ChinHongTan)
ChinHongTan, one of the core developers, helps in addressing code issues and improving code quality.
