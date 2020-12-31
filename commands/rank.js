const DiscordMessageEmbed = require('discord.js').MessageEmbed;
const xpLevels = require('../botData/xpLevels.json');

/** Command: rank
 *  Returns the executing users exp, message_count and rank on the server
 * TODO: calc rank
 */
module.exports = {
    name: 'rank',
    description: 'See your rank, exp, level and message count on this server.',
    args: false,
    usage: '',
    aliases: ['exp', 'xp'],
    async execute(message, args, guildConfig) {
        if(guildConfig.botCommandChannelId !== '' && guildConfig.botCommandChannelId !== message.channel.id) return message.channel.send("Failed");
        console.log(message.author.username + ' called "rank" command' + ((args.length > 0) ? ' with args: ' + args : '.'));

        var embed = new DiscordMessageEmbed().setColor('#0099ff').setAuthor(message.author.tag, message.author.displayAvatarURL()).setTimestamp();
        const user = await message.client.db.UserActivity.findOne({ where: { userid: message.author.id } });
        if (user) {
            let userLVL = getLevel(user.get('exp'));
            embed.setDescription('\n**Level: ' + userLVL
            + '**\n\n**XP: ' + user.get('exp') + '/' + getNextLevelExp(userLVL, true) 
            + '**\n\n**Total messages: ' + user.get('message_count') + '**\n\n');
            embed.setThumbnail('https://dummyimage.com/100x100/2c2f33/ffffff&text=Rank+' + await getRank(message.author.id, message.client.db));
        }

        message.channel.send(embed);
    }
}

//Returns the level a user has by exp the user got
function getLevel(userEXP) {
    var level = 0;
    levels.forEach(l => {
        if (userEXP > l.totalExp) level = l.level;
        else return;
    })
    return level;
}

//Returns the total exp required for the next level by xp (isLevel==false) or by level (isLevel==true)
function getNextLevelExp(userEXPorLVL, isLevel=false) {
    if (isLevel) {
        return levels[userEXPorLVL + 1].totalExp;
    }
    else {
        return levels[getLevel(userEXPorLVL) + 1].totalExp;
    }
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