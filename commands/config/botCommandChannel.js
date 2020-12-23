const NoSuchChannelError = require('../../errors/NoSuchChannelError');
const DiscordMessageEmbed = require('discord.js').MessageEmbed;

/** Command: botCommandChannel
 *  Change or set the channel in which ShardActivity commands will be allowed for this server.
 */
module.exports = {
    name: 'botCommandChannel',
    description: 'Change or set the channel in which ShardActivity commands will be allowed for this server.',
    args: true,
    usage: '<channel id>',
    aliases: ['botcommandchannel', 'botcommand_ch'],
    execute(message, args, guildConfig) {
        console.log(message.author.username + ' called "config/botCommandChannel" command' + ((args.length > 0) ? ' with args: ' + args : '.'));
        if (!message.guild.channels.cache.has(args[0])) {
            return message.channel.send(new NoSuchChannelError(message.author, this.name, args, 'The provided channel id does not match a channel on this server!'))
        }
        message.client.guildManager.updateGuildConfigById(guildConfig.guildId, 'botCommandChannelId', args[0]);
        message.channel.send(new DiscordMessageEmbed()
            .setAuthor(message.author.tag, message.author.displayAvatarURL())
            .setColor('#33cc33')
            .setTimestamp()
            .setTitle('Updated botCommand channel')
            .setDescription('The new botCommand channel for this server is: #' + message.guild.channels.cache.get(args[0]).name));
    }
}