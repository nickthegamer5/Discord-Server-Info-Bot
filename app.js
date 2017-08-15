const Discord = require('discord.js');
const client = new Discord.Client();
const gamedig = require('gamedig');
const cron = require('cron');
var fs = require('fs');

try {
    var config = require('./config.json');
}catch(e){
    console.log("Missing or unfilled values in config.json!\nWritting correct config.json...");

    var tempConfig = {
        "token": "",
        "prefix": "",
        "ownerID": "",
        "discordServers": [
            {
                "id": 0,
                "name": "",
                "servers": [
                    {
                        "name" : "server name",
                        "ip": "1.1.1.1",
                        "game": "game"
                    }
                ]
            }
        ]
    };

    fs.writeFileSync('./config.json', JSON.stringify(tempConfig, null, 4), (err) => {console.log(err)});

 	process.exit(0);
 } 

console.log("Querying servers...");

var serversStatus = {};
var playerlist;

config.discordServers.forEach(function(discordServer, i) {
    
    //serversStatus.server[i].id = discordServer.serverid;
    //console.log(`Querying servers for Discord server ${discordServer.id} (${discordServer.name})`);

    discordServer.servers.forEach(function(server, o) {
        Gamedig.query({
            type: server.game,
            host: server.ip
        }).then((state) => {
            console.log(`Server ${server.ip} (${server.name}) is online. Discord server: ${discordServer.id} (${discordServer.name})`);
            serverstat = state;
			console.log(state);
        }).catch((error) => {
            console.log(`Server ${server.ip} (${server.name}) is offine. Discord server: ${discordServer.id} (${discordServer.name})`);
        });
    });
});

client.login(config.token);
client.on('ready', () => {
    console.log('I am ready!');
});

var cronJob = cron.job("* * * * *", function(){
    config.discordServers.forEach(function(discordServer, i) {
    
        //serversStatus.server[i].id = discordServer.serverid;
        console.log(`Querying servers for Discord server ${discordServer.id} (${discordServer.name})`);

        discordServer.servers.forEach(function(server, o) {
            Gamedig.query({
                type: server.game,
				port: server.port,
                host: server.ip
            }).then((state) => {
                console.log(`${server.ip} (${server.name}) is online for Discord ${discordServer.name}`);
                serverstat = state;
            }).catch((error) => {
                console.log(`${server.ip} (${server.name}) is offine for Discord ${discordServer.name}`);
            });
        });
	});
}); 
cronJob.start();

client.on('message', (message) => {

    if (!message.content.startsWith(config.prefix) || message.author.bot) return;

    if (message.content.startsWith(config.prefix + 'prefix') && message.member.id == config.ownerID) {
        let newPrefix = message.content.split(' ').slice(1, 2)[0];
        config.prefix = newPrefix;
        fs.writeFile('./config.json', JSON.stringify(config), (err) => console.error);
        message.channel.send('Prefix has been changed to ' + config.prefix);
    }
    
    if (message.content.startsWith(config.prefix + 'server')) {
        const embed = new Discord.RichEmbed()
		.setDescription("[" + serverstat.name +"](steam://connect/"+serverstat.query.host+":" + serverstat.query.port +")")
		.addField("IP", serverstat.query.host, true)
		.addField("Gamemode", serverstat.raw.game, true)
		.addField("Map", serverstat.map, true)
		.addField("Players", serverstat.players.length + "/" + serverstat.maxplayers, true);
		
        message.channel.send({embed});
    }

    if (message.content.startsWith(config.prefix + 'info')) {
		const embed = new Discord.RichEmbed()
		.setTitle("Server Info Bot Statistics")
		.addField("Memory Usage", ((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)) + " MB", true)
		.addField("Discord.js","v" + Discord.version,true)
		.setFooter("created by nickthegamer5","https://cdn.discordapp.com/avatars/177939422468243457/55dda02364bf2d5d710126b6b1b972e1.jpg?size=128");
        message.channel.send({embed});
    }
});