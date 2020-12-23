const ArgumentError = require("../errors/ArgumentError");
const fs = require('fs');

/** Command: sa-activity <activity> [type]
 *  Change the bots activity. Available types: PLAYING, STREAMING, LISTENING, WATCHING, COMPETING.
 */
module.exports = {
	name: 'sa-activity',
    description: 'Change the bots activity. Available types: PLAYING, STREAMING, LISTENING, WATCHING, COMPETING.',
    args: true,
    secret: true,
    aliases: [],
    usage: '<type> <activity>',
    execute(message, args, guildConfig) {
        if(message.author.id !== "313742410180198431") return;
        console.log(message.author.username + ' called "sa-activity" command' + ((args.length > 0) ? ' with args: ' + args : '.'));

        const types = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'];

        var activityType = args[0].toUpperCase();
        var activity = args.slice(1).join(' ');

        if(!types.includes(activityType)) {
            return message.channel.send(new ArgumentError(message.author, this.name, args, 'Provided first argument is not a valid activity!').getEmbed());
        }

        if(!activity == '') {
            var presenceData = fs.readFileSync('./botData/presence.json');
            presenceData = JSON.parse(presenceData);
            presenceData.activity = activity;
            presenceData.activityType = activityType;
            fs.writeFileSync('./botData/presence.json', JSON.stringify(presenceData, null, 2));
            return message.client.user.setActivity(activity, {type: activityType});
        }

        console.log('Activity was not changed.');
        return;      
    }
};