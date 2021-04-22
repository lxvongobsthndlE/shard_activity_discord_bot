const DiscordMessageAttachment = require('discord.js').MessageAttachment;
const levels = require('../botData/xpLevels.json');
const Canvas = require('canvas');

/** Command: ranktest
 *  Returns the executing users exp, message_count and rank on the server
 * 
 */
module.exports = {
    name: 'ranktest',
    description: 'See your rank, exp, level and message count on this server.',
    args: false,
    usage: '',
    aliases: [],
    async execute(message, args, guildConfig) {
        if(guildConfig.botCommandChannelId !== '' && guildConfig.botCommandChannelId !== message.channel.id) return message.channel.send("Failed");
        console.log(message.author.username + ' called "rank" command' + ((args.length > 0) ? ' with args: ' + args : '.'));

        const user = await message.client.db.UserActivity.findOne({ where: { userid: message.author.id } });
        let userLvl, userExp, userRank, userMsgs, userExpForNextLevel;
        if (user) {
            userExp = user.get('exp');
            userLvl = getLevel(userExp);
            userExpForNextLevel = getNextLevelExp(userLvl, true);
            userRank = await getRank(message.author.id, message.client.db);
            userMsgs = user.get('message_count');
        }
        else {
            return message.channel.send('An unknown error occurred...');
        }

        //Canvas creation
        const canvas = Canvas.createCanvas(700, 250);
        const ctx = canvas.getContext('2d');
        //Load backgroundimage sync
        const background = await Canvas.loadImage('./rank-canvas-example.png');
        //Put background on canvas streching to canvas dimensions
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        //Draw border
        ctx.strokeStyle = '#74037b';
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        //Add texts
        //Select font and color
        ctx.font = applyFont(canvas, `${message.author.username}#${message.author.discriminator}`);
        ctx.fillStyle = '#ffffff';
        //Add Username
        ctx.fillText(`${message.author.username}#${message.author.discriminator}`, canvas.width / 2.5, canvas.height / 1.8);
        //Add Info above username
        ctx.font = '28px sans-serif';
        ctx.fillText(`RANK #${userRank} | LVL ${userLvl}`, canvas.width / 2.5, canvas.height / 3.5);
        //Add info below username
        ctx.font = applyFont(canvas, `${userExp}/${userExpForNextLevel} XP    ${userMsgs} messages`, 35);
        ctx.fillText(`${userExp}/${userExpForNextLevel} XP    ${userMsgs} messages`, canvas.width / 2.5, canvas.height / 1.2);

        //Add user avatar
        //Load user avatar sync
        const avatar = await Canvas.loadImage(message.author.displayAvatarURL({ format: 'jpg' }));
        //Create circle for avatar to fit in
        //Pick up the pen
	    ctx.beginPath();
	    //Start the arc to form a circle
	    ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
	    //Put the pen down
	    ctx.closePath();
	    //Clip off the region you drew on
	    ctx.clip();
        //Put avatar on canvas
        ctx.drawImage(avatar, 25, 25, 200, 200);

        //create MessageAttachment
        const attachment = new DiscordMessageAttachment(canvas.toBuffer(), `rank-image-${message.author.username}.png`)
        return message.channel.send('Test Rank Canvas', attachment);
    }
}

function applyFont(canvas, text, baseFontsize=70) {
    const ctx = canvas.getContext('2d');
    do {
        ctx.font = `${baseFontsize -= 5}px sans-serif`;
    } while (ctx.measureText(text).width > canvas.width - 350);
    return ctx.font;
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