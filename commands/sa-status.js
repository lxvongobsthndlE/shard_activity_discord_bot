const ArgumentError = require("../errors/ArgumentError");
const fs = require('fs');

/** Command: sa-status <status>
 *  Changes the status of the bot.
 */
module.exports = {
	name: 'sa-status',
    description: 'Change the bots status. Available status: online, idle, dnd, invisible.',
    args: true,
    secret: true,
    aliases: [],
    usage: '<status>',
    execute(message, args, guildConfig) {
        if(message.author.id !== "313742410180198431") return;
        console.log(message.author.username + ' called "sa-status" command' + ((args.length > 0) ? ' with args: ' + args : '.'));

        const stati = ['online', 'idle', 'dnd', 'invisible'];

        var status = args[0].toLowerCase();
        if(!stati.includes(status)) {
            return message.channel.send(new ArgumentError(message.author, this.name, args, 'Provided argument is not a valid status!').getEmbed());
        }

        var presenceData = fs.readFileSync('./botData/presence.json');
        presenceData = JSON.parse(presenceData);
        presenceData.status = status;
        fs.writeFileSync('./botData/presence.json', JSON.stringify(presenceData, null, 2));
        return message.client.user.setStatus(status);        
    }
};