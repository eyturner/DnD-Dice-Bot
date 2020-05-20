const random = require('random');
const Discord = require('discord.js');
const fs = require('fs');

let pickups = [];

try {
  let data = fs.readFileSync('puLines.txt', 'utf-8');
  pickups = data.split('\n');
} catch(err) {
  console.error(err);
}

module.exports = {
  name: 'seduce',
  args: true,
  description: 'Seduces the targetd user',
  usage: '@<username>',
  aliases: ['flirt'],
  execute(message) {
    try {
      let seduced = message.mentions.users.first();
      let puLine = pickups[random.int(0, pickups.length - 1)];
      message.channel.send(puLine, { reply: seduced });
    } catch (err) {
      message.reply('I\'m sorry, I don\'t recognize that command. The proper usage is: !seduce @<user>');
      console.error(err);
    }
  },
};