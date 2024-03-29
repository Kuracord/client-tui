const blessed = require("blessed")
const API = require("./api.js")
const { exec } = require("child_process")
const _ = require("lodash")
function getTime(date) {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
}
String.prototype.chunk = function chunk(length) {
  return this.match(new RegExp('.{1,' + length + '}', 'g'));
}
function createPopup(form, screen, label, content, withInput = false, callback) {
    let state = {}
    let popupbox = blessed.box({
      parent: form,
      label: label,
      content: content,
      border: 'line',
      type: 'overlay',
      style: {
        border: {
          fg: "white"
        }
      },
      top: 'center',
      left: 'center',
      width: '40%',
      height: '45%'
    })
    let cancelbutton = blessed.button({
      parent: popupbox,
      content: "Cancel",
      mouse: true,
      keys: true,
      style: {
        bg: "white",
        fg: "black"
      },
      top: '70%',
      left: '25%',
      height: 1,
      width: 10
    })
    let confirmbutton = blessed.button({
      parent: popupbox,
      content: "Confirm",
      mouse: true,
      keys: true,
      style: {
        bg: "white",
        fg: "black"
      },
      top: '70%',
      left: '60%',
      height: 1,
      width: 10
    })
    let textinput;
    if (withInput) {
    textinput = blessed.textbox({
      parent: popupbox,
      mouse: true,
      keys: true,
      border: 'line',
      style: {
        border: {
          fg: 'white'
        },
        fg: 'white'
      },
      width: '80%',
      height: 3,
      top: 1,
      name: 'text'
    });
    textinput.on("focus", () => {
      textinput.readInput()
    })
    textinput.on("submit", () => {
      state.text = textinput.getValue()
    })
    }
    cancelbutton.on("press", () => {
      popupbox.destroy()
      screen.render()
    })
    confirmbutton.on("press", () => {
      callback(state.text)
      popupbox.destroy()
      screen.render()
    })
}
module.exports = class AppComponent {
  constructor(form, screen) {
    this.state = {}
    let guilds = API.user.guilds
    let list = blessed.list({
      parent: form,
      border: 'line',
      width: '30%',
      height: '48%',
      label: 'Guilds',
      top: 0,
      tags: true,
      mouse: true,
      keys: true,
      style: {
        selected: {
         bg: 'white',
         fg: 'black'
        }
      },
      scrollbar: {
        ch: ' ',
        track: {
          bg: 'grey'
        },
        style: {
          inverse: true
        }
      }
    })
    guilds.forEach(({guild})=>{
      let g = list.add(guild.name)
      screen.render()
      g._id = guild.id
    })
    API.checkNews().then(news=>{
      if (!news) return
      createPopup(form, screen, "Changelog", `Author: ${news.author.username}\n${news.content}`, false, () => {})
      screen.render()
    })
    let channelslist = blessed.list({
      border: 'line',
      width: '30%',
      height: '47%',
      label: 'Channels',
      top: '48%',
      tags: true,
      mouse: true,
      keys: true,
      style: {
        selected: {
         bg: 'white',
         fg: 'black'
        }
      },
      scrollbar: {
        ch: ' ',
        track: {
          bg: 'grey'
        },
        style: {
          inverse: true
        }
      }
    })
    form.append(channelslist)
    screen.render()
    let guildbutton = blessed.button({
      parent: form,
      align: 'center',
      mouse: true,
      keys: true,
      content: "Create Guild",
      style: {
        bg: "white",
        fg: "black"
      },
      top: '92%',
      left: '1%',
      height: 1,
      width: '13%'
    })
    let channelbutton = blessed.button({
      parent: form,
      align: 'center',
      mouse: true,
      keys: true,
      content: "Create Channel",
      style: {
        bg: "white",
        fg: "black" 
      },
      top: '92%',
      left: '15%',
      height: 1,  
      width: '14%'
    })
    let messageslist = blessed.list({
      border: 'line',
      width: '69%',
      height: '87%',
      label: 'Messages',
      left: '30%',
      tags: true,
      mouse: true,
      keys: true,
      style: {
        selected: {
         bg: 'white',
         fg: 'black'
        }
      },
      scrollbar: {
        ch: ' ',
        track: {
          bg: 'grey'
        },
        style: {
          inverse: true
        }
      }
    })
    form.append(messageslist)
    screen.render()
    guildbutton.on("press", () => {
      createPopup(form, screen, "Create Guild", "Enter a name for guild", true, async (value) => {
        try {
          await API.createGuild(value)
        } catch (e) {}
      })
      screen.render()
    })
    channelbutton.on("press", () => {
      if (!this.state.selectedGuild) return;
      createPopup(form, screen, "Create Channel", "Enter a name for channel", true, async (value) => {
        try {
          await API.createChannel(this.state.selectedGuild, value)
        } catch (e) {}
      })
      screen.render()
    })
    let messageinput = blessed.textbox({
      parent: form,
      mouse: true,
      keys: true,
      border: 'line',
      style: {
        border: {
          fg: 'white'
        }
      },
      width: '69%',
      height: '12%',
      top: '87%',
      left: '30%',
      name: 'text'
    });
    list.on("select", async (item) => {
      let { guild } = guilds.find(({guild})=>guild.id==item._id)
      this.state.selectedGuild = guild.id
      try {
      if (!guild.channels) guild.channels = await API.fetchChannels(guild.id)
      channelslist.clearItems()
      guild.channels.forEach(channel=>{
        let ch = channelslist.add("#" + channel.name)
        screen.render()
        ch._id = channel.id
      })
      } catch {}
    })
    channelslist.on("select", async (item) => {
      let { guild } = guilds.find(({guild})=>guild.channels?.find(ch=>ch.id==item._id))
      if (!guild) return;
      let channel = guild.channels.find(ch=>ch.id==item._id)
      this.state.selectedChannel = channel.id
      try {
      if (!channel.messages) channel.messages = await API.fetchMessages(channel.id)
      messageslist.clearItems()
      channel.messages.forEach(message=>{
        if (message.editedAt != null) message.content += " (edited)"
        let cont = blessed.escape(`${getTime(new Date(message.createdAt))} ${message.author.username}: ${message.content}`)
        let width = messageslist.width - 4
        let contents = cont.chunk(width)
        contents.forEach(content=>{let item = messageslist.add(content); item._id = message.id })
        if (message.attachments) message.attachments.forEach(att=>{
          let item = messageslist.add(`Attachment: ${att.filename}`)
          item.on("click", () => {
            exec(`xdg-open '${att.url}'`)
          })
        })
        screen.render()
      })
      } catch {}
      messageslist.scroll(messageslist._scrollBottom())
      screen.render()
    })
    function emitMessage(content, author, date) {
        if (author.bot) author.username += " (BOT)"
        let cont = blessed.escape(`${getTime(date)} ${author.username}: ${content}`)
        let width = messageslist.width - 4
        let contents = cont.chunk(width)
        contents.forEach(content=>{let msg = messageslist.add(content); msg.style.fg = "grey"})
        messageslist.scroll(messageslist._scrollBottom())
        screen.render()
    }
    API.events.on("message_create", (message) => {
      let { guild } = guilds.find(({guild})=>guild.id==message.guild.id)
      let channel = guild.channels?.find(a=>a.id==message.channel.id)
      if (message.channel.id == this.state.selectedChannel) {
        let cont = blessed.escape(`${getTime(new Date(message.createdAt))} ${message.author.username}: ${message.content}`)
        let width = messageslist.width - 4
        let contents = cont.chunk(width)
        contents.forEach(content=>{let item = messageslist.add(content); item._id = message.id})
        if (message.attachments) message.attachments.forEach(att=>{
          let item = messageslist.add(`Attachment: ${att.filename}`)
          item._id = att.id
          item.on("click", () => {
            exec(`xdg-open '${att.url}'`)
          })
        })
        messageslist.scroll(messageslist._scrollBottom())
        screen.render()
      }
      if (channel && channel.messages) channel.messages.push(message) 
    })
    API.events.on("message_update", (message) => {
      let { guild } = guilds.find(({guild})=>guild.id==message.guild.id)
      let channel = guild.channels?.find(a=>a.id==message.channel.id)
      if (!channel) return;
      let oldMessage = channel.messages?.find(a=>a.id==message.id)
      if (!oldMessage) return;
      if (message.channel.id == this.state.selectedChannel) {
        let cont = blessed.escape(`${getTime(new Date(message.createdAt))} ${message.author.username}: ${message.content}`)
        let width = messageslist.width - 4
        let contents = cont.chunk(width)
        contents.forEach((content, index) => {
          let oldContents = blessed.escape(`${getTime(new Date(message.createdAt))} ${message.author.username}: ${oldMessage.content}`).chunk(width)
          let item = messageslist.items.find(a=>a.getText()==oldContents[index])
          if ((index - 1) == contents.length) content += "(edited)"
          if ((contents.length - oldContents.length) > 0) {
            let toRemove = oldContents.slice(contents.length - oldContents.length)
            toRemove.forEach(value=>{
              let index = messageslist.items.findIndex(a=>a.getText()==value)
              if (index) {
                delete messageslist.items[index]
                messageslist.items = _.compact(messageslist.items)
                screen.render()
              }
            })
          }
          if (item) item.setContent(content)
          else item = messageslist.add(content)
          item._id = message.id
        })
        screen.render()
      }
    })
    API.events.on("message_delete", ({ guildId, channelId, messageId}) => {
      let { guild } = guilds.find(({guild})=>guild.id==guildId)
      let channel = guild.channels?.find(a=>a.id==channelId)
      let messageIndex = channel.messages?.findIndex(a=>a.id==messageId)
      if (channel && channel.messages) {
        delete channel.messages[messageIndex]
        channel.messages = _.compact(channel.messages)
      }
      if (channelId == this.state.selectedChannel) {
        console.log(messageslist.items.filter(a=>a._id==messageId))
        messageslist.items.filter(a=>a._id==messageId).forEach((item, index) => {
          delete messageslist.items[index]
        })
        messageslist.items = _.compact(messageslist.items)
        screen.render()
      }
    })
    API.events.on("guild_create", (guild) => {
      guilds.push(guild)
      let g = list.add(guild.name)
      g._id = guild.id
      screen.render()
    })
    API.events.on("channel_create", async (channel) => {
      let { guild } = guilds.find(({guild})=>guild.id==channel.guild.id)
      if (!guild.channels) guild.channels = await API.fetchChannels(guild.id)
      guild.channels.push(channel)
      let ch = channelslist.add("#" + channel.name)
      ch._id = channel.id
      screen.render()
    })
    API.events.on("changelog", (news) => {
      createPopup(form, screen, "Changelog", `Author: ${news.author.username}\n${news.content}`, false, () => {})
      screen.render()
      API.saveNews(news.id)
    })
    messageinput.on('focus', function() {
      messageinput.readInput();
    });
    let handleCommands = async (args) => {
      let command = args.shift().toLowerCase()
      if (command == "help") emitMessage("No help yet :(", { username: "Kuracord", bot: true }, new Date())
      if (command == "shrug") {
        if (args.length < 1) return;
        await API.sendMessage(this.state.selectedChannel, args.join(" ") + " ¯\\_(ツ)_/¯")
      }
    }
    messageinput.on('submit', async () => {
      let content = messageinput.getValue().trim()
      if (!content || content == "") return
      messageinput.setValue("")
      screen.render()
      if (content.startsWith("/")) {
        emitMessage(content, { username: API.user.username }, new Date())
        return await handleCommands(content.slice(1).split(" "))
      }
      try {
      if (this.state.selectedChannel) await API.sendMessage(this.state.selectedChannel, content)
      messageinput.emit('focus')
      } catch {}
    })
  }
}
