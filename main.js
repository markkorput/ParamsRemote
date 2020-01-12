
const { app, BrowserWindow, protocol } = require('electron')
const path = require('path')
const url = require('url')

let win;

function createWindow () {

  const WEB_FOLDER = 'dist/ParamsRemote';
  const PROTOCOL = 'file';

  // https://github.com/electron/electron/issues/2242#issuecomment-299645388
  protocol.interceptFileProtocol(PROTOCOL, (request, callback) => {
      // console.log('interceptFileProtocol', request.url);
      const base = path.join(__dirname, WEB_FOLDER);
      // // Strip protocol
      let url = request.url.substr(PROTOCOL.length + 3);
      if (url.startsWith(base)) url = url.replace(base, '');
      // Build complete path for node require function
      url = path.join(base, url);
      // Replace backslashes by forward slashes (windows)
      // url = url.replace(/\\/g, '/');
      url = path.normalize(url);
      callback({path: url});
  });

  // Create the browser window.
  win = new BrowserWindow({
    width: 600, 
    height: 670,
    // icon: `file://${__dirname}/dist/assets/logo.png`
    icon: `file://${__dirname}/dist/ParamsRemote/favicon.ico`
  })

  // win.loadURL(`file://${__dirname}/dist/ParamsRemote/index.html`)
  win.loadURL(url.format({
    pathname: 'index.html',
    protocol: PROTOCOL+':',
    slashes: true
  }));

  // uncomment below to open the DevTools.
  // win.webContents.openDevTools()

  // Event when the window is closed.
  win.on('closed', function () {
    win = null
  })
}

// Create window on electron intialization
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {

  // On macOS specific close process
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // macOS specific close process
  if (win === null) {
    createWindow()
  }
})