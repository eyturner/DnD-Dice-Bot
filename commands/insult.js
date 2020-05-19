const random = require('random');
const Discord = require('discord.js');
const fs = require('fs');

let insults = [];

try {
  let data = fs.readFileSync('insults.txt', 'utf-8');
  insults = data.split('\n');
} catch(err) {
  console.error(err);
}

module.exports = {
  name: 'insult',
  args: true,
  description: 'Insults the targetd user',
  usage: '@<username>',
  execute(message) {
    try {
      let insulted = message.mentions.users.first();
      let insult = insults[random.int(0, insults.length - 1)];
      message.channel.send(insult, { reply: insulted });
    } catch (err) {
      message.reply('I\'m sorry, I don\'t recognize that command. The proper usage is: !insult @<user>');
      console.error(err);
    }
  },
};