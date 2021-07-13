const discord = require('discord.js');
const client = new discord.Client();
const settings = require('./settings.json');
client.privchannels = new discord.Collection();
let guild;
client.on('ready', async ()=>{
    guild = client.guilds.cache.get(settings.guild)
    console.log("logged in with " + client.user.username +"#"+ client.user.discriminator);
})

client.on('voiceStateUpdate', async(oldState, newState)=>{
    let newMember = newState.member;
    let newUserChannel = newState.member.voice.channel;

    if (client.privchannels.has(`${newMember.user.id}`)) {
        let publicchannel = client.channels.cache.get(settings.publicChannelId);
        let userChannel = client.privchannels.get(newMember.user.id).channel;
        if(!newUserChannel){
            const promises = userChannel.members
            .filter(member => member.user.id != newMember.user.id)
            .map(member => member.voice.setChannel(publicchannel))
          
            await Promise.all(promises)
            userChannel.delete();
            client.privchannels.delete(newMember.user.id);
            return
        }
        if (newUserChannel.id == userChannel.id) return;
        if (newUserChannel.id == settings.channelId) return newState.setChannel(userChannel, "already have priv");
        const promises = userChannel.members
        .filter(member => member.user.id != newMember.user.id)
        .map(member => member.voice.setChannel(publicchannel))
      
        await Promise.all(promises)
        userChannel.delete();
        client.privchannels.delete(newMember.user.id);
    }

    if(!newUserChannel) return;

    if (newUserChannel.id == settings.channelId) {
        if (client.privchannels.has(`${newMember.user.id}`)) return;
        guild.channels.create(newMember.user.username, { type: "voice", userLimit: 2, parent: settings.categoryId }).then((channel)=>{
        newState.setChannel(channel, "created new private channel");
        client.privchannels.set(newMember.user.id,{
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
        let userChannel = client.privchannels.get(message.author.id).channel;
        userChannel.setUserLimit(args[0]);
    }
    if (message.content.startsWith("!channelname")){
        if (!client.privchannels.has(message.author.id)) return;
        const args = message.content.slice(12).trim().split(' ');
        if (!args[0]) return message.channel.send('lütfen geçerli bir isim giriniz');
        let userChannel = client.privchannels.get(message.author.id).channel;
        userChannel.setName(args[0]);
    }
})

client.login(settings.token);