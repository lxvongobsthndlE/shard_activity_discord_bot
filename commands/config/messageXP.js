const DiscordMessageEmbed = require('discord.js').MessageEmbed;
const ArgumentError = require('../../errors/ArgumentError');

/** Command: messageXP
 *  Change the messageXP min, max and timeout for this server.
 */
module.exports = {
    name: 'messageXP',
    description: 'Change the messageXP min, max and timeout for this server.\nDefaults: min: 16, max: 24, timeout: 30000.',
    args: true,
    usage: '<min | max | timeout> <value>',
    aliases: ['msgxp'],
    execute(message, args, guildConfig) {
        console.log(message.author.username + ' called "config/messageXP" command' + ((args.length > 0) ? ' with args: ' + args : '.'));

        var embed = new DiscordMessageEmbed()
        .setAuthor(message.author.tag, message.author.displayAvatarURL())
        .setColor('#33cc33')
        .setTimestamp();
        if (args[0] == 'min') {
            message.client.guildManager.updateGuildConfigById(guildConfig.guildId, 'messageXPmin', args[1]);
            embed.setTitle('Updated messageXPmin');
            embed.setDescription('The new messageXPmin for this server is: **' + args[1] + '**');
        }
        else if (args[0] == 'max') {
            message.client.guildManager.updateGuildConfigById(guildConfig.guildId, 'messageXPmax', args[1]);
            embed.setTitle('Updated messageXPmax');
            embed.setDescription('The new messageXPmax for this server is: **' + args[1] + '**');
        }
        else if (args[0] == 'timeout') {
            message.client.guildManager.updateGuildConfigById(guildConfig.guildId, 'messageXPtimeout', args[1]);
            embed.setTitle('Updated messageXPtimeout');
            embed.setDescription('The new messageXPtimeout for this server is: **' + args[1] + '**');
        }
        else {
            embed = new ArgumentError(message.author, this.name, args, 'The first argument provided must be either "min" or "max" or "timeout"!').getEmbed();
        }

        message.channel.send(embed);
    }
}