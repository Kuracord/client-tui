const axios = require("axios").default
const EventEmitter = require("events")
const WebSocket = require("ws")
module.exports = class API {
  static token = null
  static user = {}
  static ws = null
  static events = new EventEmitter()
  static async login(email, pass) {
    try {
      let req = await axios.post("http://api.keneshin.xyz/users/login", { email: email, password: pass },
        { json: true })
      this.token = req.data.token
      return true
    } catch (e) {
      if (e.response) {
        if (e.response.status.toString().startsWith("4")) throw new Error(e.response.data.message)
        else throw new Error(e.message)
      }
    }
  }
  static async fetchUser() {
    let req = await axios.get("http://api.keneshin.xyz/users/@me", { headers: { Authorization: this.token }})
    this.user = req.data
  }
  static async fetchChannels(id) {
    let req = await axios.get(`http://api.keneshin.xyz/guilds/${id}/channels`, { headers: { Authorization: this.token }})
    return req.data
  }
  static async fetchMessages(id) {
    let req = await axios.get(`http://api.keneshin.xyz/channels/${id}/messages`, { headers: { Authorization: this.token }})
    return req.data
  }
  static async sendMessage(id, content) {
    let req = await axios.post(`http://api.keneshin.xyz/channels/${id}/messages`, { content }, { json: true, headers: { Authorization: this.token }})
    return req.data
  }
  static async createGuild(name) {
    let req = await axios.post(`http://api.keneshin.xyz/guilds`, { name, icon: "" }, { json: true, headers: { Authorization: this.token }})
    return req.data
  }
  static async createChannel(id, name) {
    let req = await axios.post(`http://api.keneshin.xyz/guilds/${id}/channels`, { name }, { json: true, headers: { Authorization: this.token }})
    return req.data
  }
  static gatewayConnect() {
    this.ws = new WebSocket("ws://gateway.keneshin.xyz")
    this.ws.on("open", () => {
      this.ws.send(JSON.stringify({ op: 0, d: { token: this.token } }))
    })
    this.ws.on("message", (data) => {
      let message = JSON.parse(data)
      if (message.op == 1) this.events.emit(message.t.toLowerCase(), message.d)
    })
  }
}
