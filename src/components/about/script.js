document.getElementById('ver').innerText = document.getElementById('ver').innerText.replaceAll('{ver}', require('../../../package.json').version)
document.getElementById('au').innerHTML = document.getElementById('au').innerHTML.replaceAll('{current_yr}', new Date().getFullYear())
