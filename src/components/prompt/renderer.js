const { ipcRenderer } = require('electron')

const tokenBtn = document.getElementById('tokenBtn')
const defaultInnerHtml = tokenBtn.innerHTML
tokenBtn.innerHTML = tokenBtn.innerHTML.replace('{login_method}', 'login with a user token')
let token = false
let avatarUrl = ''
tokenBtn.addEventListener('click', function (e) {
  e.preventDefault()
  token = !token
  if (token) {
    document.getElementById('qrcode').style.animationName = 'disappear_QR'
    document.getElementById('tokenInput').style.animationName = 'appear_QR'
    document.getElementById('tokenInput').style.display = 'inline-block'
    document.getElementById('qrTxt').style.display = 'none'
    document.getElementById('tokenTxt').style.display = 'block'
    tokenBtn.innerHTML = defaultInnerHtml.replace('{login_method}', 'login with QR Code')
    const button = document.getElementById('submitToken')
    button.addEventListener('click', function (e) {
      e.preventDefault()
      button.disabled = true
      if (document.getElementById('token').value.trim() === '') {
        document.getElementById('tokenInput').style.animation = 'shake 0.2s ease-in-out'
        setTimeout(function () {
          document.getElementById('tokenInput').style.animation = 'appear_QR 0.3s ease-in-out'
          button.disabled = false
        }, 200)
      } else {
        ipcRenderer.send('login_m_token', document.getElementById('token').value.trim())
        button.disabled = true
      }
    })
  } else {
    document.getElementById('tokenInput').style.animationName = 'disappear_QR'
    document.getElementById('qrcode').style.animationName = 'appear_QR'
    document.getElementById('qrcode').style.display = 'inline-block'
    document.getElementById('qrTxt').style.display = 'block'
    document.getElementById('tokenTxt').style.display = 'none'
    tokenBtn.innerHTML = defaultInnerHtml.replace('{login_method}', 'login with a user token')
  }
})

document.getElementById('stBtn_AT').addEventListener('click', function (e) {
  swup.loadPage({ url: './success.html' })
  setTimeout(() => {
    swup.loadPage({ url: './loginPrompt.html' })
  }, 500)
})

document.getElementById('stBtn_pending_AT').addEventListener('click', function (e) {
  swup.loadPage({ url: './pending.html' })
  setTimeout(() => {
    swup.loadPage({ url: './loginPrompt.html' })
  }, 500)
})

document.getElementById('stBtn_pending').addEventListener('click', function (e) {
  swup.loadPage({ url: './pending.html' })
})

document.getElementById('stBtn').addEventListener('click', function (e) {
  swup.loadPage({ url: './success.html' })
})

document.getElementById('RBtn').addEventListener('click', function (e) {
  swup.loadPage({ url: './loginPrompt.html' })
})

document.getElementById('errBtn').addEventListener('click', function (e) {
  document.getElementById('tokenInput').style.animation = 'shake 0.2s ease-in-out'
  setTimeout(function () {
    document.getElementById('tokenInput').style.animation = 'appear_QR 0.3s ease-in-out'
  }, 200)
})

document.addEventListener('swup:contentReplaced', function () {
  const currentPage = window.location.href.split('/').pop().split('.')[0]
  switch (currentPage) {
    case 'pending': {
      document.getElementById('avt_url').src = avatarUrl
      break
    }
    case 'success': {
      document.getElementById('finishBtn').addEventListener('click', function (e) {
        ipcRenderer.send('login_m_success')
      })
      break
    }
  }
})

ipcRenderer.on('event', (_, msg) => {
  switch (msg.action) {
    case 'qrRen': {
      const qrCode = new QRCodeStyling({
        width: 200,
        height: 200,
        type: 'svg',
        data: msg.args.qrCodeUrl,
        image: './Discord-Logo-Color.svg',
        dotsOptions: {
          color: '#5865F2',
          type: 'rounded'
        },
        backgroundOptions: {
          color: '#ffffff'
        },
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 4
        }
      })
      qrCode.append(document.getElementById('qrcode'))
      break
    }
    case 'pending': {
      swup.loadPage({ url: './pending.html' })
      avatarUrl = msg.args.avatarUrl
      break
    }
    case 'logged': {
      swup.loadPage({ url: './success.html' })
      break
    }
  }
})
