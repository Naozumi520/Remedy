if (typeof console.oldlog === 'undefined') {
  console.oldlog = console.log
}
const muteicon = "<img alt=\"\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABOvAAATrwFj5o7DAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAbNJREFUWIXllj0vBFEUht+LCMluQo1EtGpBZAWFApFILIVKKT5ahdZPUPgbIiEqicZHhNIfkGjFDhGSfRQurnFndo072zjdzD3nPO8595zJSP/dTNZAoEPSkCQknRtj7oOpqgO+AUR8WQSsNQq+SLLNJ8SMAIdAMYSAqxQBlx7/ElCx5wchBLykCHiO+Y4AD841jYUQkGRVYDVXeIqAKs4Q5gZPEJAGfwwK9wioBR8PCo8JaDzcEVAF1hsOt7A43N3zClAKBeoCysBc7H3Sqv2oHJizObqyCJh02t3qOa8Fb7OxAKNZBPQ4AzeYAo98dw4MOwX8vgM2yZlNMJsCH0uI3bU+15ngNslS7M7rGjhgAHi1fsuZBcSS1vWFA/qBO+t3ATSHgNesHCgAm1YcVkRvCHjitPP+c7IDHDlggBugLwTcrfzbwAErfK3Zh90D20B7CHi88gnnrBPYd8B7thuFP4MT4L49LzsCyllZTT64pENJRUlPkmaMMcdZAbWsxfNuy8IjSdPGmJO84JKnA5IW9N6BqbzhkqcDxphI0lTe4E9e1kCgW9KwfTw1xtyGkfTf7A06FY1bsYOQoAAAAABJRU5ErkJggg==\" style='height:1em;padding-left:3px;transform: translateY(2px);'>"
const deaficon = "<img alt=\"\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAABOvAAATrwFj5o7DAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAgtJREFUWIXllzFrFEEYhp/RmBQaBI8DFU7wwELsbCT/wMoicqDEzr8gFlp4hf8ghVoEG4tgIShofoOFKIooKtqIIYWiEIgneo/FTZLxcrt3u7e5xq/Z2Z153+ed3WHYgf+9QhmRWgOOAo3o8Q14F0L4WmG2HdCm2lafO7i66hv1ptrM8bminiwCrquLaicDPKh+q3fUQ31e7di/pp4CmBoCnwMeAIeTxz+AFeA18Bn4A9SB08BZoAbspfeJ1lM4cCPeHgSORY9MeEvdSGb1SV1Qp3M0+9SL6u10XDJz45s8lzdx1Lk++C11JleU7VUYXldXE9HVMuBS8ChaTERLk4Y33V7tHyf22jOEl6qGqw31cp74RRR+N2e1jwH/oD7LEtcS8XKV8Ni/FPu69rZyAPYkYxpJ+2VRONubzC+gFUJ41DfsbbyGlJUGOJK0VyuGA6wl7a2dNQ1wIGmvM0IVgANsJO3ZQQEKVUF4ZpUKUBW8VIAq4f3GLXfWk3Q3LLLDqdfVLwM8VVujBBgHfiEDPHKA0vA4/u6oAQatgRVgPoTQ2YRT/JvvH9K/Vf0BNuE/x4CXK/W44/xG/et1v/Aa6DMoDY/65SEB5ncNHj2u5cC76oldg0efWfVpBrydjg2JaAG4F287wPkQwuMyAaLfFHCG3vkAeueHVyGE91mCafXhODMfu9QZe6ehidVfnin1J+cYEwUAAAAASUVORK5CYII=\" style='height:1em;padding-left:3px;transform: translateY(2px);'>"

window.consoleCatchers = []
let spans, text, uState

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
        spans[i].innerHTML = text
      }
    }
  }
})
