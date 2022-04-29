var blessed = require('blessed');
var LoginComponent = require("./emailbox.js")
var AppComponent = require("./app.js")
var screen = blessed.screen({
  smartCSR: true
});
let fs = require("fs")
let path = require("path")
let os = require("os")
let API = require("./api.js")

screen.title = 'Kuracord';

var form = blessed.form({
  parent: screen,
  keys: true,
  left: 'center',
  top: 'center',
  width: "98%",
  height: "98%",
  border: {
    type: 'line'
  },
  style: {
    border: {
      fg: '#f0f0f0'
    }
  },
  label: "Kuracord"
})

Array.prototype.last = function() { return this[this.length - 1] }
var login = new LoginComponent(form, screen)
login.on("submit", () => {
  login.destroy()
  new AppComponent(form, screen)
  API.gatewayConnect()
})
if (fs.existsSync(path.join(os.homedir(), ".config/kuracord/config.json"))) {
  let config = require(path.join(os.homedir(), ".config/kuracord/config.json"))
  API.token = config.token
  API.fetchUser().then(()=>{
    login.emit("submit")
  })
}
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();
