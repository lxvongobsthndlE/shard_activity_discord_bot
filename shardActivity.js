#!/usr/bin/env node
const Discord = require('discord.js');
const Sequelize = require('sequelize');
const secret = require('./secret.json');
const presence = require('./botData/presence.json');

// SETUP CLIENT -----------------------------------------------------------------------
// Default Prefix used across servers
const PREFIX = 'sa!';
const TIMEOUT = 20000;
// INIT discord.js
const discordClient = new Discord.Client();
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

// INIT DB-model
const UserActivity = sequelize.define('useractivity', {
    userid: {
        type: Sequelize.INTEGER,
        unique: true
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
    }
});

// BOT LOGIC --------------------------------------------------------------------------
// Start client and set bot presence data
discordClient.once('ready', () => {
    console.log('ShardActivity-Client ready!');
    discordClient.user.setPresence({ activity: { name: presence.activity, type: presence.activityType }, status: presence.status });
    // Sync DB-models
    UserActivity.sync();
});

// Login client
discordClient.login(secret.discordToken);

//EVENT on any message on any server
discordClient.on('message', async message => {
    // Allmighty Logger. Don't use this. Seriously, don't.
    //console.log('[' + message.guild.name + '][' + message.channel.name + '] ' + message.author.tag + ': ' + message.content);

    // Ignore Bot messages.
    if (message.author.bot) return;


    // ADMIN Commands
    if (message.content.startsWith(PREFIX)) {
        if (message.author.id !== '313742410180198431') return;
        const input = message.content.slice(PREFIX.length).trim().split(' ');
        const command = input.shift().toLowerCase();
        const commandArgs = input;

        if (command === 'show') {
            // sa!show
            const userList = await UserActivity.findAll({ attributes: ['username', 'message_count', 'last_activity'] });
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



    // CONSTs
    const GUILDID = message.guild.id;
    const USERID = message.author.id;
    const USERNAME = message.author.username;
    const now = new Date();
    const TIMESTAMP = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();

    /// Save activity to db -------------------------------------
    //Skip if user on timeout
    if (discordClient.timeouts.has(USERID)) return;
    //Get useractivity by userid
    const ua = await UserActivity.findOne({ where: { userid: USERID } });
    //If found increment message_count, reset last_activity and add 1min timeout
    if (ua) {
        //Update useractivity 
        const affectedRows = await UserActivity.update({ message_count: ua.get('message_count') + 1, last_activity: TIMESTAMP }, { where: { userid: USERID } });
        if (affectedRows == 0) {
            console.log('[ERR] Could not update message_count and last_activity for ' + ua.get('username'));
        }
        else {
            //Add Timeout to user
            discordClient.timeouts.set(USERID, TIMESTAMP);
            setInterval(() => {
                discordClient.timeouts.delete(USERID);
            }, TIMEOUT);
        }
    }
    else {
        try {
            const newUA = await UserActivity.create({
                userid: USERID,
                guildid: GUILDID,
                username: USERNAME,
                joined: TIMESTAMP,
                message_count: 1
            });
            console.log('New user ' + USERNAME + ' added.');
        } catch (err) {
            if (err.name === 'SequelizeUniqueConstraintError') {
                return console.log('[ERR] The user ' + USERNAME + ' already exists.');
            }
            console.log(err);
            return console.log('[ERR] Something went wrong with adding a new user.');
        }
    }

});