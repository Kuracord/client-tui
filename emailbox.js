const blessed = require("blessed")
const EventEmitter = require("events")
const API = require("./api.js")
const fs = require("fs")
const path = require("path")
const os = require("os")

module.exports = class LoginComponent extends EventEmitter {
  constructor(form, screen) {
    super()
    this.state = {}
    var emailbox = blessed.box({
      parent: form,
      left: 'center',
      top: 2,
      height: 2,
      width: '30%',
    })
    blessed.text({
      parent: emailbox,
      content: "Email",
      height: 1,
      width: '100%'
    })
    var emailtext = blessed.textbox({
      parent: emailbox,
      mouse: true, 
      keys: true, 
      style: {
        bg: 'blue'
      },
      height: 1,
      width: '100%',
      top: 1,
      name: 'text'
    });

    emailtext.on('focus', function() {
      emailtext.readInput();
    });
    emailtext.on("submit", () => {
      this.state.email = emailtext.getValue()
    })
    var passbox = blessed.box({
      parent: form,
      left: 'center',
      top: 5,
      height: 2,
      width: '30%',
    })
    blessed.text({
      parent: passbox,
      content: "Password",
      height: 1,
      width: '100%'
    })
    var passtext = blessed.textbox({
      parent: passbox,
      mouse: true, 
      keys: true, 
      censor: true,
      style: {
        bg: 'blue'
      },
      height: 1,
      width: '100%',
      top: 1,
      name: 'text'
    });

    passtext.on('focus', function() {
      passtext.readInput();
    });
    passtext.on("submit", () => {
      this.state.pass = passtext.getValue()
    })
    var submitbutton = blessed.button({
      parent: form,
      mouse: true,
      keys: true,
      style: {
        bg: 'blue'
      },
      left: 'center',
      top: 8,
      width: 5,
      height: 1,
      content: "Login"
    })
    var submittext = blessed.text({
      parent: form,
      hidden: true,
      style: {
        fg: 'red',
      },
      left: 'center',
      top: 9,
      content: ""
    })
    submitbutton.on("press", async () => {
      try {
        await API.login(this.state.email, this.state.pass)
        await API.fetchUser()
        if (!fs.existsSync(path.join(os.homedir(), ".config/kuracord"))) {
          await fs.promises.mkdir(path.join(os.homedir(), ".config/kuracord"))
          await fs.promises.writeFile(path.join(os.homedir(), ".config/kuracord/config.json"), JSON.stringify({ token: API.token }))
        }
        this.emit("submit")
      } catch (e) {}
    })
    this.destroy = () => {
      emailbox.destroy()
      passbox.destroy()
      submitbutton.destroy()
      submittext.destroy()
      //screen.realloc()
      screen.render()
    }
  }
}
