const random = require('random');
const Discord = require('discord.js');

module.exports = {
	name: 'roll',
	args: true,
	description: 'Rolling dice',
	usage: '1d20+5 dis or !roll 2d8 - 3, etc',
    aliases: ['r'],
    rollModes: {}, // To keep track of normal vs random mode per server

  // Returns an array containing each die roll. Results[0] will contain the sum.
  rollDice(numDice, typeDice) {
    let results = [];
    let sum = 0;
    for(let i = 0; i < numDice; ++i) {
      let num = (random.int(1, typeDice));
      results.push(num);
      sum += num;
    }
    results.unshift(sum);
    return results;
  },
  // Same as roll dice, just using a gaussian distribution.
  rollDiceGauss(numDice, typeDice) {
    const STDDEV = 6;
    const MEAN = 10.5;
    let results = [];
    let sum = 0;
    for(let i = 0; i < numDice; ++i) {
      // Line calculating the result
      const a = Math.random();
      const b = Math.random();
      let num = Math.floor(STDDEV * (Math.sin(-2.0 * Math.log(a)) * (Math.cos(2 * Math.PI * b))) + MEAN + 0.5);
      if(num > 20) {
        num = 20;
      } else if (num < 1) {
        num = 1;
      }
      results.push(num);
      sum += num;
    }
    results.unshift(sum);
    return results;
  },

  // Get the mod and the vantage if provided.
  getModVantage(args) {
    const modifierRegex = /\+\d?|-\d?/;
    const vantageRegex = /^ad?v?$|^di?s?$/;
    let mod = 0, vantage;

    // Loop through our args, look for mod and vantage
    for(let i = 0; i < args.length; ++i) {
      let modIndex = args[i].search(modifierRegex);
      if(modIndex >= 0) {
        // We found the modifier! Let's see where the number is
        let operand = args[i][modIndex];
        if(args[i].length > 1) {
          // The number isn't separated by whitespace. Get the value and restructre args so rollDice works
         let value = args[i].split(operand)[1];
          args[i] = args[i].substring(0, modIndex);
          mod = Number(operand + value);
        } else {
          // The number is separated by whitespace, so args[i+1] should contain number.
          mod = Number(operand + args[i + 1]);
        }
      } else if(vantageRegex.test(args[i])) {
        // We found the vantage, let's set out variable to it.
        vantage = args[i];
      }
    }
    return [mod, vantage];
  },
  // Returns an array containing all results from dice thrown. allResults[0] will always contiain the "winner"
  getResults(args, vantage, guildID) {
    const nums = args[0].split('d');
        let numDice = nums[0];
        let typeDice = nums[1];
        let allResults = [];
        let winner;
        let rollFunc;

        // This sets the roll function based on what the current roll mode is in this guild.
        if(Number(typeDice) != 20) {
          rollFunc = this.rollDice;
        } else if (this.rollModes[guildID] == 'gauss') {
          rollFunc = this.rollDiceGauss;
        } else {
          rollFunc = this.rollDice;
        }

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
  createMessageEmbed(message, mod, winner, results) {
    const respEmbed = new Discord.MessageEmbed()
    .setColor([random.int(0, 255), random.int(0, 255), random.int(0, 255)])
    .setTitle(`Roll by ${message.author.username}`);
    let descString = `RESULT: ${winner[0] + mod} = `;
    winner.slice(1).forEach(roll => {
      descString += roll.toString() + ' + ';
    });
    descString += `${mod}`;
    respEmbed.setDescription(descString);
    let embedFieldNum = 0;
    results.forEach(result => {
      let i = 0;
      result.slice(1).forEach(roll => {
        respEmbed.addField(`Roll #${i + 1}`, roll, true);
        i++;
      });
      // This bit of code just for formatting the output.
      embedFieldNum++;
      if(embedFieldNum < results.length) {
        respEmbed.addField('\u200B', '\u200B');
      }

    });
    return respEmbed;
  },
  // Main function. Called by index.js when "roll" is the command.
	execute(message, args) {
		if(args) {
      try {
        let guildID = message.guild.id;
        if(args[0] == 'gauss' || args[0] == 'random') {
          this.rollModes[guildID] = args[0];
          message.reply(`The roll mode has been set to ${args[0]}!`);
          return;
        }
        let mod, vantage;
        [mod, vantage] = this.getModVantage(args);
        let results = this.getResults(args, vantage, guildID);
        let winner = results[0];

        if(vantage) {
          results = results.slice(1);
        }
        let response = this.createMessageEmbed(message, mod, winner, results);
        message.channel.send(response);

      } catch(err) {
        console.error(err);
        message.reply('There was an error trying to execute that command!');
      }
    }
	},
};
