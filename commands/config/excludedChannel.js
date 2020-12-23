const DiscordMessageEmbed = require('discord.js').MessageEmbed;
const ArgumentError = require('../../errors/ArgumentError');

/** Command: excludedChannel
 *  Add or remove a channel from the exclusion list for this server
 */
module.exports = {
    name: 'excludedChannel',
    description: 'Add or remove a channel from the exclusion list for this server',
    args: true,
    usage: '<add | remove> <channel id>',
    aliases: ['excluded_ch', 'exclch'],
    execute(message, args, guildConfig) {
        console.log(message.author.username + ' called "config/excludedChannel" command' + ((args.length > 0) ? ' with args: ' + args : '.'));

        var embed = new DiscordMessageEmbed()
        .setAuthor(message.author.tag, message.author.displayAvatarURL())
        .setColor('#33cc33')
        .setTimestamp();
        if (args[0] == 'add') {
            if (!message.guild.channels.cache.has(args[1])) {
                return message.channel.send(new NoSuchChannelError(message.author, this.name, args, 'The provided channel id does not match a channel on this server!'))
            }
            guildConfig.excludedChannels.push(args[1]);
            message.client.guildManager.updateGuildConfigById(guildConfig.guildId, 'excludedChannels', guildConfig.excludedChannels);
            embed.setTitle('Updated excludedChannels');
            embed.setDescription('Added new excludedChannel with id: **' + args[1] + '**');
        }
        else if (args[0] == 'remove') {
            var newExcludedChannels = guildConfig.excludedChannels.filter(c => c !== args[1]);
            message.client.guildManager.updateGuildConfigById(guildConfig.guildId, 'excludedChannels', newExcludedChannels);
            embed.setTitle('Updated excludedChannels');
            embed.setDescription('Removed excludedChannel with id: **' + args[1] + '**');
        }
        else {
            embed = new ArgumentError(message.author, this.name, args, 'The first argument provided must be either "add" or "remove"!').getEmbed();
        }

        message.channel.send(embed);
    }
}