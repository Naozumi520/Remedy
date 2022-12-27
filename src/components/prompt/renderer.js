const { ipcRenderer } = require('electron')

const tokenBtn = document.getElementById('tokenBtn')
const defaultInnerHtml = tokenBtn.innerHTML
tokenBtn.innerHTML = tokenBtn.innerHTML.replace('{login_method}', 'login with a user token')
let token = false
tokenBtn.addEventListener('click', function (e) {
  e.preventDefault()
  token = !token
  if (token) {
    document.getElementById('qrcode').style.display = 'none'
    document.getElementById('tokenInput').style.display = 'inline-block'
    document.getElementById('qrTxt').style.display = 'none'
    document.getElementById('tokenTxt').style.display = 'block'
    tokenBtn.innerHTML = defaultInnerHtml.replace('{login_method}', 'login with QR Code')
    const button = document.getElementById('submitToken')
    button.addEventListener('click', function (e) {
      button.disabled = true
      if (document.getElementById('token').value.trim() === '') {
        document.getElementById('tokenInput').style.animation = 'shake 0.2s ease-in-out'
        setTimeout(function () {
          document.getElementById('tokenInput').style.animation = 'appear_QR 0.3s ease-in-out'
          button.disabled = false
        }, 200);
      } else {
        ipcRenderer.send('login_m_token', document.getElementById('token').value.trim())
        button.disabled = true
      }
    })
  } else {
    document.getElementById('tokenInput').style.display = 'none'
    document.getElementById('qrcode').style.display = 'inline-block'
    document.getElementById('qrTxt').style.display = 'block'
    document.getElementById('tokenTxt').style.display = 'none'
    tokenBtn.innerHTML = defaultInnerHtml.replace('{login_method}', 'login with a user token')
  }
})

ipcRenderer.on('event', (_, msg) => {
  switch (msg.action) {
    case 'qrRen':
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
})
