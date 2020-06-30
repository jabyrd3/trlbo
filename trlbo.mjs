import config from './config.mjs';
import {promisify} from 'util';
import {watch, readFile} from 'fs';
import Bypasser from 'node-bypasser';
import irc from 'irc';
import Twitter from 'twitter';

const read = promisify(readFile);

class Trlbo{
  constructor(config){
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.reload = this.reload.bind(this);
    this.tClient = new Twitter({
      consumer_key: config.ck,
      consumer_secret: config.cs,
      access_token_key: config.atk,
      access_token_secret: config.ats
    });
    this.last = {};
    watch('./brain.mjs', this.reload);
    // this.tClient
    this.irc = new irc.Client(config.ircs, config.ircn, {
      channels: [config.chan]
    });
    this.irc.addListener('error', (e) => {
      console.log(e);
    });
    this.irc.addListener('invite', () => {
      console.log('bot invited');
      this.irc.join(config.chan);
    });
    this.start();
  }
  async start(){
    this.handler = eval(await read('./brain.mjs', 'utf8')).bind(this);
    this.listener = this.irc.addListener('message', this.handler);
  }
  stop(){

  }
  async reload(){
    this.irc.removeListener('message', this.handler)
    this.handler = eval(await read('./brain.mjs', 'utf8')).bind(this);
    this.listener = this.irc.addListener('message', this.handler);
  }
}

new Trlbo(config);
