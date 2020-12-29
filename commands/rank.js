const DiscordMessageEmbed = require('discord.js').MessageEmbed;
const xpLevels = require('../botData/xpLevels.json');

/** Command: rank
 *  Returns the executing users exp, message_count and rank on the server
 * TODO: calc rank
 */
module.exports = {
    name: 'rank',
    description: 'See your rank, exp and message count on this server.',
    args: false,
    usage: '',
    aliases: ['exp', 'xp'],
    async execute(message, args, guildConfig) {
        if(guildConfig.botCommandChannelId !== '' && guildConfig.botCommandChannelId !== message.channel.id) return message.channel.send("Failed");
        console.log(message.author.username + ' called "rank" command' + ((args.length > 0) ? ' with args: ' + args : '.'));

        var embed = new DiscordMessageEmbed().setColor('#0099ff').setAuthor(message.author.tag, message.author.displayAvatarURL()).setTimestamp();
        const user = await message.client.db.UserActivity.findOne({ where: { userid: message.author.id } });
        if (user) {
            embed.setDescription('\n**Level: ' + getLevel(user.get('exp')) + '\n\nXP: ' + user.get('exp') + '/' + getNextLevelXP(user.get('exp')) + '**\n\n');
            embed.addField('Total Messages', user.get('message_count'));
            embed.setThumbnail('https://dummyimage.com/100x100/2c2f33/ffffff&text=Rank+' + await getRank(message.author.id, message.client.db));
        }

        message.channel.send(embed);
    }
}

//Returns the level by xp
function getLevel(xp) {
    var level = 0;
    xpLevels.forEach(l => {
        if (xp > l.exp) level = l.level;
        else return;
    })
    return level;
}

//Returns the xp required for the next level by xp
function getNextLevelXP(xp) {
    return xpLevels.find(el => el.level == getLevel(xp) + 1).exp;
}

//Returns the rank of a user
async function getRank(userID, db) {
    const allUsers = await db.UserActivity.findAll({ attributes: ['userid', 'exp']});
    allUsers.sort((a, b) => b.exp - a.exp);
    for(var i = 0; i < allUsers.length; i++) {
        if(allUsers[i].userid == userID) {
            return i + 1;
        }
    }
    return 0;
}