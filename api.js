const axios = require("axios").default
const EventEmitter = require("events")
const WebSocket = require("ws")
const fs = require("fs/promises")
const os = require("os")
const path = require("path")
module.exports = class API {
  static token = null
  static user = {}
  static ws = null
  static events = new EventEmitter()
  static async login(email, pass) {
    try {
      let req = await axios.post("http://localhost:2021/users/login", { email: email, password: pass },
        { json: true })
      this.token = req.data.token
      return true
    } catch (e) {
      if (e.response) {
        if (e.response.status.toString().startsWith("4")) throw new Error(e.response.data.message)
        else throw new Error(JSON.stringify(e.response.data))
      }
    }
  }
  static async fetchUser() {
    try {
      let req = await axios.get("http://localhost:2021/users/@me", { headers: { Authorization: this.token }})
      this.user = req.data
    } catch (e) {
      if (e.response) {
        throw new Error(JSON.stringify(e.response.data))
      }
    }
  }
  static async fetchChannels(id) {
    let req = await axios.get(`http://localhost:2021/guilds/${id}/channels`, { headers: { Authorization: this.token }})
    return req.data
  }
  static async fetchMessages(id) {
    let req = await axios.get(`http://localhost:2021/channels/${id}/messages`, { headers: { Authorization: this.token }})
    return req.data
  }
  static async sendMessage(id, content) {
    let req = await axios.post(`http://localhost:2021/channels/${id}/messages`, { content }, { json: true, headers: { Authorization: this.token }})
    return req.data
  }
  static async createGuild(name) {
    let req = await axios.post(`http://localhost:2021/guilds`, { name, icon: "" }, { json: true, headers: { Authorization: this.token }})
    return req.data
  }
  static async createChannel(id, name) {
    let req = await axios.post(`http://localhost:2021/guilds/${id}/channels`, { name }, { json: true, headers: { Authorization: this.token }})
    return req.data
  }
  static gatewayConnect() {
    this.ws = new WebSocket("ws://localhost:2022")
    this.ws.on("open", () => {
      this.ws.send(JSON.stringify({ op: 0, d: { token: this.token } }))
    })
    this.ws.on("message", (data) => {
      let message = JSON.parse(data)
      if (message.op == 1) this.events.emit(message.t.toLowerCase(), message.d)
    })
  }
  static async checkNews() {
    let config = require(path.join(os.homedir(), ".config/kuracord/config.json"))
    let req = await axios.get("http://localhost:2021/news", { headers: { Authorization: this.token }, json: true })
    if (!req.data.last()) return null
    if (req.data.last().id == config.lastNewsId) return null
    config.lastNewsId = req.data.last().id
    await fs.writeFile(path.join(os.homedir(), ".config/kuracord/config.json"), JSON.stringify(config)) 
    return req.data.last()
  }
  static async saveNews(id) {
    let config = require(path.join(os.homedir(), ".config/kuracord/config.json"))
    config.lastNewsId = id
    await fs.writeFile(path.join(os.homedir(), ".config/kuracord/config.json"), JSON.stringify(config))
  }
}
