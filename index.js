const Discord = require('discord.js');
const { prefix, token, permissionNumber } = require('./config.json');
const fs = require('fs');
const { Permissions } = require('discord.js');
const permission = new Permissions(permissionNumber);

const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const oldRegex = /\br([0-9]|[1-2][0-9]|30)d([0-9]|[1-9][0-9]|[1-9][0-9][0-9]|1000)\b/;

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	let args = message.content.slice(prefix.length).split(/ +/);
	let commandName = args.shift().toLowerCase();

	//	See if anyone used the old way of writing. If they did, use roll.js
	//  and send the arguments properly
	if(oldRegex.test(commandName)) {
		args.unshift(commandName.substr(1, commandName.length));
		commandName = 'roll';
	}

	const command = client.commands.get(commandName)
	|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) return;

	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments, ${message.author}!`;
		if(command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
		}

		return message.channel.send(reply);
	}

	try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

client.login(process.env.BOT_TOKEN);
