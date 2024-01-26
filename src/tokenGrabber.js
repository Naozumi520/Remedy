new Promise((resolve, reject) => {
  window.webpackChunkdiscord_app.push([
    [Math.random()],
    {},
    req => {
      if (!req.c) return;
      for (const m of Object.keys(req.c)
        .map(x => req.c[x].exports)
        .filter(x => x)) {
        if (m.default && m.default.getToken !== undefined) {
          const token = m.default.getToken();
          return resolve(token);
        }
        if (m.getToken !== undefined) {
          const token = m.getToken();
          return resolve(token);
        }
      }
      reject(new Error('Token not found'));
    },
  ]);
});
