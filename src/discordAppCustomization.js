document.addEventListener('DOMNodeInserted', (event) => {
  const loginScreenSVG = document.querySelector('#app-mount > div.appAsidePanelWrapper-ev4hlp > div.notAppAsidePanel-3yzkgB > div.app-3xd6d0 > div > svg')
  const settingBtn = document.querySelector('#app-mount > div.appAsidePanelWrapper-ev4hlp > div.notAppAsidePanel-3yzkgB > div.app-3xd6d0 > div > div.layers-OrUESM.layers-1YQhyW > div > div > div > div > div > section > div.container-YkUktl > div.flex-2S1XBF.flex-3BkGQD.horizontal-112GEH.horizontal-1Piu5-.flex-3BkGQD.directionRow-2Iu2A9.justifyStart-2Mwniq.alignStretch-Uwowzr.noWrap-hBpHBz > button:nth-child(3)')
  if (loginScreenSVG) loginScreenSVG.remove(loginScreenSVG.selectedIndex)
  if (settingBtn) settingBtn.remove(settingBtn.selectedIndex)
})
