const discord = require('discord.js');
const client = new discord.Client();
const settings = require('./settings.json');
client.privchannels = new discord.Collection();
client.channelIds = new discord.Collection();
let guild;
client.on('ready', async ()=>{
    guild = client.guilds.cache.get(settings.guild)
    console.log("logged in with " + client.user.username +"#"+ client.user.discriminator);
})

client.on('voiceStateUpdate', async(oldState, newState)=>{
    let newMember = newState.member;
    let newUserChannel = newState.member.voice.channel;
    let oldUserChannel = oldState.channel;
    if(oldUserChannel && client.channelIds.has(`${oldUserChannel.id}`) && oldUserChannel.members.size < 1){
            client.privchannels.delete(newMember.user.id);
            client.channelIds.delete(oldUserChannel.id);
            oldUserChannel.delete();
    }
    if (client.privchannels.has(`${newMember.user.id}`)) {
        let userChannel = client.privchannels.get(newMember.user.id).channel;
        if (newUserChannel.id == settings.channelId) return newState.setChannel(userChannel, "already have priv");
    }
    if(!newUserChannel) return;
    if (newUserChannel.id == settings.channelId) {
        if (client.privchannels.has(`${newMember.user.id}`)) return;
        guild.channels.create(newMember.user.username, { type: "voice", userLimit: 2, parent: settings.categoryId }).then((channel)=>{
        newState.setChannel(channel, "created new private channel");
        client.privchannels.set(newMember.user.id,{
          channel: channel
        });
        client.channelIds.set(channel.id,{
            channel: channel
        });
      })
    }
})

client.on('message', async(message)=>{
    if (message.content.startsWith("!userlimit")){
        if (!client.privchannels.has(message.author.id)) return;
        const args = message.content.slice(10).trim().split(' ');
        if (!args[0] || isNaN(args)) return message.channel.send('lütfen geçerli bir sayı giriniz');
        if (args > 99) return; 
        let userChannel = client.privchannels.get(message.author.id).channel;
        userChannel.setUserLimit(args[0]);
    }
    if (message.content.startsWith("!channelname")){
        if (!client.privchannels.has(message.author.id)) return;
        const args = message.content.slice(12).trim();
        if (!args) return message.channel.send('lütfen geçerli bir isim giriniz');
        let userChannel = client.privchannels.get(message.author.id).channel;
        userChannel.setName(args);
    }
    if (message.content.startsWith(".kick")){
        if (!client.privchannels.has(`${message.author.id}`)) return;
        let member = message.guild.member(message.mentions.users.first())
        if (!member) return message.channel.send('Lütfen bir kullanıcı etiketleyiniz.');
        if (!member.voice.channel) return message.channel.send('Kullanıcı herhangi bir ses odasında değil.');
        let userChannel = client.privchannels.get(message.author.id).channel;
        if (member.voice.channel.id != userChannel.id) return message.channel.send('Sadece kendi odanızdaki kişileri atabilirsiniz.');
        member.voice.setChannel(null, "kicked");
    }
})

client.login(settings.token);
