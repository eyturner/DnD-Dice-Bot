const roll = require('../commands/roll');
const Discord = require('discord.js');
const random = require('random');

module.exports = {
  name: 'init',
  args: true,
  description: 'Same as roll, but updates a map of users and initiatives',
  aliases: ['i'],
  initiatives: {},
  usage: '1d20+1',
  updateInitiatives(message, result, mod, guildId) {
    let name = message.author.username;
    if(!this.initiatives[guildId]) {
      this.initiatives[guildId] = {};
    }
    let currentInitiatives = this.initiatives[guildId];
    currentInitiatives[name] = {
      initiative: result[0] + mod,
      timeStamp: message.createdAt.toUTCString(),
    };
  },
  clearInitiatives(message, guildId) {
    this.initiatives[guildId] = {};
    message.reply('Cleared!');
  },
  showInitiatives(guildId) {
    let sortedArray = [];
    let guildInitiatives = this.initiatives[guildId];
    for(let adventurer in guildInitiatives) {
      sortedArray.push([adventurer, guildInitiatives[adventurer]]);
    }
    sortedArray.sort(function(a, b) {
      return b[1].initiative - a[1].initiative;
    });
    const respEmbed = new Discord.MessageEmbed()
    .setColor([random.int(0, 255), random.int(0, 255), random.int(0, 255)])
    .setTitle('Current Initiatives');
    for(let i = 0; i < sortedArray.length; i++) {
      let username = sortedArray[i][0];
      let initiative = sortedArray[i][1].initiative;
      let timestamp = sortedArray[i][1].timeStamp;

      respEmbed.addField(`${timestamp}`, `${username}: ${initiative}`);
    }
    return respEmbed;
  },
  getResults(args, vantage) {
    const nums = args[0].split('d');
        let numDice = nums[0];
        let typeDice = nums[1];
        let allResults = [];
        let winner;
        let rollFunc = roll.rollDice;
        switch (vantage) {
          case 'adv': {
            let result1 = rollFunc(Number(numDice), Number(typeDice));
            let result2 = rollFunc(Number(numDice), Number(typeDice));
            allResults.push(result1);
            allResults.push(result2);
            result1[0] > result2[0] ? winner = result1 : winner = result2;
            break;
          }
          case 'dis': {
            let result1 = rollFunc(Number(numDice), Number(typeDice));
            let result2 = rollFunc(Number(numDice), Number(typeDice));
            allResults.push(result1);
            allResults.push(result2);
            result1[0] < result2[0] ? winner = result1 : winner = result2;
            break;
          }
          default:
            winner = rollFunc(Number(numDice), Number(typeDice));
            break;
        }
        allResults.unshift(winner);
        return allResults;
  },
  execute(message, args) {
    if(args) {
      try {
        let isRoll = (/\b([0-9]|[1-2][0-9]|30)d([0-9]|[1-9][0-9]|[1-9][0-9][0-9]|1000)\b/).test(args[0]);
        let guildId = message.guild.id;
        if(isRoll) {
          let mod, vantage;
          [mod, vantage] = roll.getModVantage(args);
          let results = this.getResults(args, vantage);
          let winner = results[0];
          this.updateInitiatives(message, winner, mod, guildId);
          if(vantage) {
            results = results.slice(1);
          }
          let response = roll.createMessageEmbed(message, mod, winner, results);
          message.channel.send(response);
        } else {
          switch (args[0]) {
            case 'clear':
              this.clearInitiatives(message, guildId);
              break;
            case 'show':
              message.channel.send(this.showInitiatives(guildId));
              break;
            default : {
              message.reply('I don\'t recognize that command!');
            }
            break;
          }
        }
      } catch(err) {
        console.error(err);
        message.reply('There was an error trying to execute that command!');
      }
    }
  },
};