const DiscordMessageEmbed = require('discord.js').MessageEmbed;

/** Command: leaderboard
 *  Shows the activity leaderboard.
 */
module.exports = {
	name: 'leaderboard',
    description: 'Shows the activity leaderboard.',
    aliases: ['lb'],
    numOfEntries: 10,
    usage: '',
    async execute(message, args, guildConfig) {
        if(guildConfig.botCommandChannelId !== '' && guildConfig.botCommandChannelId !== message.channel.id) return message.channel.send("Failed");
        console.log(message.author.username + ' called "leaderboard" command' + ((args.length > 0) ? ' with args: ' + args : '.'));

        var embed = new DiscordMessageEmbed().setColor('#0099ff').setAuthor(message.guild.name, message.guild.iconURL()).setTitle('Leaderboard').setTimestamp();
        const userList = await message.client.db.UserActivity.findAll({ attributes: ['username', 'message_count', 'exp'] });
        //sort list descending
        userList.sort((a, b) => b.exp - a.exp);
        //splice list at numOfEntries
        userList.splice(10);
        const userString = userList.map(u => u.username +' - ' + u.exp + 'EXP (' + u.message_count + ' total messages)').join('\n') || 'No users found.';

        embed.setDescription(userString)

        message.channel.send(embed);
    }

};