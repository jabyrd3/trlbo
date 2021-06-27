import config from './config.mjs';
import {promisify} from 'util';
import {watch, readFile} from 'fs';
import Bypasser from 'node-bypasser';
import irc from 'irc';
import Twitter from 'twitter';
import debounce from 'lodash.debounce';

const read = promisify(readFile);

class Trlbo{
  constructor(config){
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.reload = debounce(this.reload.bind(this), 1000);
    this.config = config;
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
      channels: config.chan
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
    this.config.chan.map(chan => {
      console.log('addlistener', chan);
      this[`listener${chan}`] = this.irc.addListener(`message${chan}`, this.handler)
    });
  }
  stop(){

  }
  async reload(){
    console.log('reloading');
    this.config.chan.map(chan => {
      this.irc.removeListener(`message${chan}`, this.handler);
    });
    this.handler = eval(await read('./brain.mjs', 'utf8')).bind(this);
    this.config.chan.map(chan => {
      console.log('addlistener', chan);
      this[`listener${chan}`] = this.irc.addListener(`message${chan}`, this.handler)
    });
  }
}

new Trlbo(config);
