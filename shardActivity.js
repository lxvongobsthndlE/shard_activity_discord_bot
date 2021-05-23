#!/usr/bin/env node
const Discord = require('discord.js');
const Sequelize = require('sequelize');
const fs = require('fs');
const secret = require('./secret.json');
const presence = require('./botData/presence.json');
const ShardGuildManager = require('./shardGuildManager');
const CommandDoesNotExistError = require('./errors/CommandDoesNotExistError');
const ArgumentError = require('./errors/ArgumentError');
const ExecutionError = require('./errors/ExecutionError');

// SETUP CLIENT -----------------------------------------------------------------------
// INIT discord.js
const discordClient = new Discord.Client();
// INIT Guild Configuration Manager
discordClient.guildManager = new ShardGuildManager();
// INIT Sequelize with sqlite DB
const sequelize = new Sequelize('ShardActivity', 'root', secret.dbPass, {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'database.sqlite'
});
// INIT timeouts
discordClient.timeouts = new Discord.Collection();
// INIT all commands
discordClient.commands = new Discord.Collection();
discordClient.configCommands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const configCommandFiles = fs.readdirSync('./commands/config').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require('./commands/' + file);
    discordClient.commands.set(command.name, command);
}
for (const file of configCommandFiles) {
    const command = require('./commands/config/' + file);
    discordClient.configCommands.set(command.name, command);
}
// INIT DB-model
discordClient.db = [];
discordClient.db.UserActivity = sequelize.define('useractivity', {
    userid: {
        type: Sequelize.INTEGER,
        unique: true,
        primaryKey: true
    },
    guildid: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    username: Sequelize.STRING,
    last_activity: Sequelize.DATE,
    message_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    reaction_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    exp: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    }
});

// BOT LOGIC --------------------------------------------------------------------------
// Start client and set bot presence data
discordClient.once('ready', () => {
    // Sync DB-models
    discordClient.db.UserActivity.sync();

    //Set presence
    discordClient.user.setPresence(
        { 
            activity: { 
                name: presence.activity,
                type: presence.activityType 
            }, 
            status: presence.status 
        });
    setInterval(() => {
        discordClient.user.setPresence(
            { activity: { 
                name: presence.activity, 
                type: presence.activityType 
            }, 
            status: presence.status 
        });
    }, 60000);
    
    //READY
    console.log('Shard-Activity-Client ready!\nServing ' + discordClient.guilds.cache.size + ' servers.');
});

// Login client
discordClient.login(secret.discordToken);

//EVENT on any message on any server
discordClient.on('message', async message => {
    // Allmighty Logger. Don't use this. Seriously, don't.
    //console.log('[' + message.guild.name + '][' + message.channel.name + '] ' + message.author.tag + ': ' + message.content);

    // Get guildConfig
    var guildConfig = discordClient.guildManager.getGuildConfigById(message.guild.id);

    // Ignore Bot messages.
    if (message.author.bot) return;
    // Check for commands
    if (message.content.startsWith(guildConfig.prefix)) {
        //Handle command:
        //Syntax: <prefix><command> <args[0]> <args[1]> ...
        const args = message.content.slice(guildConfig.prefix.length).trim().split(' ');
        const commandName = args.shift().toLowerCase();

        //Get command from collection.
        const command = discordClient.commands.get(commandName) 
            || discordClient.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        //Check if command exists.
        if(!command) {
            return message.channel.send(new CommandDoesNotExistError(message.author, commandName, args).getEmbed());
        }
        //Check if command requires arguments and throw error if yes and none provided.
        if(command.args && !args.length) {
            var argsError = new ArgumentError(message.author, command.name, args, 'This command requires arguments, but none were provided!');
            if(command.usage) argsError.setUsage(guildConfig.prefix + command.name + ' ' + command.usage);
            return message.channel.send(argsError.getEmbed());
        }
        //Try executing the command.
        try {
            command.execute(message, args, guildConfig);
        } catch (error) {
            console.error(error);
            return message.channel.send(new ExecutionError(message.author, command.name, args).getEmbed());
        }
    }
    else if(!guildConfig.excludedChannels.includes(message.channel.id)) {
        //Add activity:
        //Some CONSTs
        let GUILDID = message.guild.id;
        let USERID = message.author.id;
        let USERNAME = message.author.username;
        let now = new Date();
        let TIMESTAMP = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();

        /// Save activity to db -------------------------------------
        //Get useractivity by userid
        const ua = await discordClient.db.UserActivity.findOne({ where: { userid: USERID } });
        //Does the user exist in db?
        if (ua) {
            //If user on timeout, only increment message_count
            if (discordClient.timeouts.has(USERID)) {
                //Update useractivity 
                const affectedRows = await discordClient.db.UserActivity.update({ message_count: ua.get('message_count') + 1, last_activity: TIMESTAMP }, { where: { userid: USERID } });
                if (affectedRows == 0) {
                    console.log('[ERR] Could not update message_count and last_activity for ' + ua.get('username'));
                }
                else {
                    console.log('[_OK] Updated message_count and last_activity for ' + ua.get('username'));
                }
            }
            else { //user not on timeout -> add activity
                //Update useractivity 
                const affectedRows = await discordClient.db.UserActivity.update({ message_count: ua.get('message_count') + 1, last_activity: TIMESTAMP, exp: ua.get('exp') + getRandomXP(guildConfig.messageXPmin, guildConfig.messageXPmax) }, { where: { userid: USERID } });
                if (affectedRows == 0) {
                    console.log('[ERR] Could not update message_count, exp and last_activity for ' + ua.get('username'));
                }
                else {
                    console.log('[_OK] Updated message_count, exp and last_activity for ' + ua.get('username'));
                    //Add Timeout to user
                    discordClient.timeouts.set(USERID, TIMESTAMP);
                    setInterval(() => {
                        discordClient.timeouts.delete(USERID);
                    }, guildConfig.messageXPtimeout);
                }
            }
        }
        else { //user does not exist in db -> create new
            try {
                const newUA = await discordClient.db.UserActivity.create({
                    userid: USERID,
                    guildid: GUILDID,
                    username: USERNAME,
                    joined: TIMESTAMP,
                    message_count: 1,
                    exp: getRandomXP(guildConfig.messageXPmin, guildConfig.messageXPmax)
                });
                console.log('[_OK] New user ' + USERNAME + ' added.');
            } catch (err) {
                if (err.name === 'SequelizeUniqueConstraintError') {
                    return console.log('[ERR] The user ' + USERNAME + ' already exists.');
                }
                console.log(err);
                return console.log('[ERR] Something went wrong with adding a new user.');
            }
        }
    }

});

// Returns a random integer between 16 and 24
function getRandomXP(min=16, max=24) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function oldComms() {
    // ADMIN Commands
    if (message.content.startsWith(PREFIX)) {
        if (message.author.id !== '313742410180198431') return;
        const input = message.content.slice(PREFIX.length).trim().split(' ');
        const command = input.shift().toLowerCase();
        const commandArgs = input;

        if (command === 'show') {
            // sa!show
            const userList = await UserActivity.findAll({ attributes: ['username', 'message_count', 'last_activity'] });
            //optional: sort list descending
            userList.sort((a, b) => b.message_count - a.message_count);
            const userString = userList.map(u => ' [' + u.message_count + '] ' + u.username + ' | ' + ((u.last_activity == null) ? null : u.last_activity.toLocaleString())).join('\n') || 'No users set.';
            return message.channel.send('List of users: \n' + userString);
        } else if (command === 'touch') {
            // sa!touch
            const userID = commandArgs[0];

            const user = await UserActivity.findOne({ where: { userid: userID } });
            if (user) {
                commandArgs[1] ? user.increment('message_count', { by: commandArgs[1] }) : user.increment('message_count');
                return message.reply('Touched user ' + user.username + (commandArgs[1] ? ' ' + commandArgs[1] + ' times.' : '.'));
            }
            return message.reply('Could not find user with id' + commandArgs[0]);
        }
    }
}