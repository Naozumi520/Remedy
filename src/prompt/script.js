const ipcRenderer = require('electron').ipcRenderer

const tokenBtn = document.getElementById('tokenBtn')
tokenBtn.addEventListener('click', function (e) {
    e.preventDefault()
    ipcRenderer.send('login_m_token')
})

ipcRenderer.on('event', (_, msg) => {
    switch (msg.action) {
        case 'qrRen':
            const qrCode = new QRCodeStyling({
                width: 200,
                height: 200,
                type: "svg",
                data: msg.args.qrCodeUrl,
                image: "./Discord-Logo-Color.svg",
                dotsOptions: {
                    color: "#5865F2",
                    type: "rounded"
                },
                backgroundOptions: {
                    color: "#ffffff",
                },
                imageOptions: {
                    crossOrigin: "anonymous",
                    margin: 4
                }
            });
            qrCode.append(document.getElementById("qrcode"));
            break;
    }
})