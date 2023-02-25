const options = {
  debugMode: true,
  linkSelector:
        'a[href^="' +
        window.location.origin + '"]:not([data-no-swup]), a[href^="./"]:not([data-no-swup])'
}

const swup = new Swup(options)
