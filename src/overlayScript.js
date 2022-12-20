const ipcRenderer = require('electron').ipcRenderer

if (typeof console.oldlog === 'undefined') {
  console.oldlog = console.log
}
const muteicon = "<img alt=\"\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABOvAAATrwFj5o7DAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAbNJREFUWIXllj0vBFEUht+LCMluQo1EtGpBZAWFApFILIVKKT5ahdZPUPgbIiEqicZHhNIfkGjFDhGSfRQurnFndo072zjdzD3nPO8595zJSP/dTNZAoEPSkCQknRtj7oOpqgO+AUR8WQSsNQq+SLLNJ8SMAIdAMYSAqxQBlx7/ElCx5wchBLykCHiO+Y4AD841jYUQkGRVYDVXeIqAKs4Q5gZPEJAGfwwK9wioBR8PCo8JaDzcEVAF1hsOt7A43N3zClAKBeoCysBc7H3Sqv2oHJizObqyCJh02t3qOa8Fb7OxAKNZBPQ4AzeYAo98dw4MOwX8vgM2yZlNMJsCH0uI3bU+15ngNslS7M7rGjhgAHi1fsuZBcSS1vWFA/qBO+t3ATSHgNesHCgAm1YcVkRvCHjitPP+c7IDHDlggBugLwTcrfzbwAErfK3Zh90D20B7CHi88gnnrBPYd8B7thuFP4MT4L49LzsCyllZTT64pENJRUlPkmaMMcdZAbWsxfNuy8IjSdPGmJO84JKnA5IW9N6BqbzhkqcDxphI0lTe4E9e1kCgW9KwfTw1xtyGkfTf7A06FY1bsYOQoAAAAABJRU5ErkJggg==\" style='height:1em;padding-left:3px;transform: translateY(2px);'>"
const deaficon = "<img alt=\"\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABOvAAATrwFj5o7DAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAgtJREFUWIXllzFrFEEYhp/RmBQaBI8DFU7wwELsbCT/wMoicqDEzr8gFlp4hf8ghVoEG4tgIShofoOFKIooKtqIIYWiEIgneo/FTZLxcrt3u7e5xq/Z2Z153+ed3WHYgf+9QhmRWgOOAo3o8Q14F0L4WmG2HdCm2lafO7i66hv1ptrM8bminiwCrquLaicDPKh+q3fUQ31e7di/pp4CmBoCnwMeAIeTxz+AFeA18Bn4A9SB08BZoAbspfeJ1lM4cCPeHgSORY9MeEvdSGb1SV1Qp3M0+9SL6u10XDJz45s8lzdx1Lk++C11JleU7VUYXldXE9HVMuBS8ChaTERLk4Y33V7tHyf22jOEl6qGqw31cp74RRR+N2e1jwH/oD7LEtcS8XKV8Ni/FPu69rZyAPYkYxpJ+2VRONubzC+gFUJ41DfsbbyGlJUGOJK0VyuGA6wl7a2dNQ1wIGmvM0IVgANsJO3ZQQEKVUF4ZpUKUBW8VIAq4f3GLXfWk3Q3LLLDqdfVLwM8VVujBBgHfiEDPHKA0vA4/u6oAQatgRVgPoTQ2YRT/JvvH9K/Vf0BNuE/x4CXK/W44/xG/et1v/Aa6DMoDY/65SEB5ncNHj2u5cC76oldg0efWfVpBrydjg2JaAG4F287wPkQwuMyAaLfFHCG3vkAeueHVyGE91mCafXhODMfu9QZe6ehidVfnin1J+cYEwUAAAAASUVORK5CYII=\" style='height:1em;padding-left:3px;transform: translateY(2px);'>"
const liveicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 27.02 12.01">
    <path fill="#f04545"
        d="M 0,6.0039 C 0,5.60937 0.0391,5.21875 0.11328,4.83203 0.19138,4.44531 0.30469,4.07031 0.45703,3.70312 0.60547,3.33984 0.79297,2.99609 1.01172,2.66797 1.23047,2.33984 1.48047,2.03515 1.75781,1.75781 2.03516,1.47656 2.33984,1.23047 2.66797,1.01172 2.99609,0.79297 3.33984,0.60547 3.70703,0.45703 4.07031,0.30469 4.44531,0.1914 4.83203,0.11328 5.21875,0.03518 5.60937,0 6.00391,0 h 15.00781 c 0.39453,0 0.78515,0.0352 1.17187,0.11328 0.38672,0.0781 0.76172,0.19141 1.125,0.34375 0.36719,0.14844 0.71094,0.33594 1.03907,0.55469 0.32812,0.21875 0.63281,0.46484 0.91015,0.74609 0.27735,0.27734 0.52735,0.58203 0.7461,0.91016 0.21875,0.32812 0.40625,0.67187 0.55468,1.03515 0.15235,0.36719 0.26563,0.74219 0.34375,1.12891 0.0742,0.38672 0.11328,0.77734 0.11328,1.17187 0,0.39063 -0.0391,0.78125 -0.11328,1.16797 -0.0781,0.38672 -0.1914,0.76172 -0.34375,1.12891 -0.14843,0.36328 -0.33593,0.71094 -0.55468,1.03516 -0.21875,0.32812 -0.46875,0.63281 -0.7461,0.91015 -0.27734,0.28125 -0.58203,0.52735 -0.91015,0.7461 -0.32813,0.22265 -0.67188,0.40625 -1.03907,0.55859 -0.36328,0.14844 -0.73828,0.26172 -1.125,0.33984 -0.38672,0.0781 -0.77734,0.11719 -1.17187,0.11719 H 6.00391 c -0.39454,0 -0.78516,-0.0391 -1.17188,-0.11719 -0.38672,-0.0781 -0.76172,-0.1914 -1.125,-0.33984 C 3.33984,11.39844 2.99609,11.21484 2.66797,10.99609 2.33984,10.77344 2.03516,10.52734 1.75781,10.24609 1.48047,9.96875 1.23047,9.66406 1.01172,9.33594 0.79297,9.01172 0.60547,8.66406 0.45703,8.30078 0.30469,7.93359 0.19141,7.55859 0.11328,7.17187 0.03908,6.78515 0,6.39453 0,6.0039 Z m 0,0" />
    <path fill="#fff" d="m 8.8538666,9.0041491 h -3.4375 v -6.203125 h 1.203125 v 5.140625 h 2.0625 z m 0,0" />
    <path fill="#fff" d="M 10.966965,9.0041491 H 9.7638397 v -6.203125 h 1.2031253 z m 0,0" />
    <path fill="#fff"
        d="m 17.635117,2.8010241 -2.3125,6.234375 h -1.21875 l -2.265625,-6.09375 1.25,-0.203125 1.671875,4.75 1.609375,-4.6875 z m 0,0" />
    <path fill="#fff"
        d="m 22.175171,9.0041491 h -3.703125 v -6.203125 h 3.609375 v 1 h -2.421875 v 1.484375 h 1.859375 l 0.171875,1 h -2.03125 v 1.71875 h 2.515625 z m 0,0" />
    <style>
        svg {
            height: 1.4em;
            padding-left: 3px;
            transform: translateY(4.5px);
        }
    </style>
</svg>`
window.consoleCatchers = []
let spans, text, uState
let streamingUsr = []

console.log = function (text, input) {
  if (typeof input !== 'undefined') {
    window.consoleCatchers.forEach(function (item, index) { item(input) })
  } else { console.oldlog(text) }
}; window.consoleCatchers.push(function (input) {
  if (input.evt === 'VOICE_STATE_UPDATE') {
    spans = document.getElementsByTagName('span')
    const id = input.data.user.id; const name = input.data.nick; uState = input.data.voice_state
    for (let i = 0; i < spans.length; i++) {
      const element = document.getElementsByClassName(spans[0].className)[i].parentElement
      const imgSrc = element.parentElement.getElementsByTagName('img')[0].src
      if (imgSrc.match(/\d{18}/g)[0] === id) {
        text = name
        if (uState.self_mute || uState.mute) {
          text += muteicon
        }
        if (uState.self_deaf || uState.deaf) {
          text += deaficon
        }
        if (streamingUsr.includes(id)) {
          text += liveicon
          spans[i].parentElement.style.paddingTop = '13px'
        } else {
          spans[i].parentElement.style.paddingTop = '18px'
        }
        spans[i].innerHTML = text
      }
    }
  }
})

ipcRenderer.on('event', (_, msg) => {
  const action = msg.action
  const args = msg.args
  switch (action) {
    case 'stream:start':
      streamingUsr.push(args.userId)
      break
    case 'stream:stop':
      streamingUsr = streamingUsr.filter(id => id !== args.userId)
      break
  }
  for (let i = 0; i < spans.length; i++) {
    const element = document.getElementsByClassName(spans[0].className)[i].parentElement
    const imgSrc = element.parentElement.getElementsByTagName('img')[0].src
    if (imgSrc.match(/\d{18}/g)[0] === args.userId) {
      text = args.user
      if (uState.self_mute || uState.mute) {
        text += muteicon
      }
      if (uState.self_deaf || uState.deaf) {
        text += deaficon
      }
      if (streamingUsr.includes(args.userId)) {
        text += liveicon
        spans[i].parentElement.style.paddingTop = '13px'
      } else {
        spans[i].parentElement.style.paddingTop = '18px'
      }
      spans[i].innerHTML = text
    }
  }
})
