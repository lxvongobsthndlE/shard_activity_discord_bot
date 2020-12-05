#!/usr/bin/env node
const Discord = require('discord.js');
const Sequelize = require('sequelize');
const secret = require('./secret.json');
const presence = require('./botData/presence.json');

// SETUP CLIENT -----------------------------------------------------------------------
// Default Prefix used across servers
const PREFIX = 'sa!';
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

// INIT DB-model
const UserActivity = sequelize.define('useractivity', {
    userid: {
        type: Sequelize.INTEGER,
        unique: true
    },
    guildid: Sequelize.INTEGER,
    username: Sequelize.STRING,
    joined: Sequelize.DATE,
    message_count: {
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
    //Allmighty Logger. Don't use this. Seriously, don't.
    console.log('[' + message.guild.name + '][' + message.channel.name + '] ' + message.author.tag + ': ' + message.content);


});