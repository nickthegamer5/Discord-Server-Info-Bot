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
        }).catch((error) => {
            console.log(`Server ${server.ip} (${server.name}) is offine. Discord server: ${discordServer.id} (${discordServer.name})`);
        });
    });
});



var cronJob = cron.job("* * * * *", function(){
    config.discordServers.forEach(function(discordServer, i) {
    
        //serversStatus.server[i].id = discordServer.serverid;
        console.log(`Querying servers for Discord server ${discordServer.id} (${discordServer.name})`);

        discordServer.servers.forEach(function(server, o) {
            Gamedig.query({
                type: server.game,
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

client.login(config.token);
client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', (message) => {

    if (!message.content.startsWith(config.prefix) || message.author.bot) return;

    if (message.content.startsWith(config.prefix + 'prefix') && message.member.id == config.ownerID) {
        let newPrefix = message.content.split(' ').slice(1, 2)[0];
        config.prefix = newPrefix;
        fs.writeFile('./config.json', JSON.stringify(config), (err) => console.error);
        message.channel.send('Prefix has been changed to ' + config.prefix);
    }
    
    if (message.content.startsWith(config.prefix + 'server')) {
        playerlist = "";
        serverstat.players.forEach(function(player) {
            playerlist = playerlist + player.name + "\n"
        }, this);

        message.channel.send(
            {
                "embed": {
                    "title": "Server Info Bot",
                    "description": "Info for server [" + serverstat.name +"](steam://connect/"+serverstat.query.host+":" + serverstat.query.port +")",
                    "color": 1113126,
                    "fields": [
                        {
                            "name": "Players",
                        
                            "value": "```" + playerlist + "```"
                        }
                    ]
                }
            });
    }

    if (message.content.startsWith(config.prefix + 'info')) {
        message.channel.send(
        {
            "embed": {
                "title": "Server Info Bot Statistics",
                "fields": [{
                    "name": "Mem Usage",
                    "value": ((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)) + " MB",
                    "inline": true
                }, {
                    "name": "Discord.js",
                    "value": "v" + Discord.version,
                    "inline": true
                }],
                "footer": {
                    "text": "created by nickthegamer5",
                    "icon_url": "https://cdn.discordapp.com/avatars/177939422468243457/3ce778d29d1fc247aa30af136536d737.png?size=2048"
                }
            }
        }
        );
    }
});

