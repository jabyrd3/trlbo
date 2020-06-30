let irc = require('irc');
const Bypasser = require('node-bypasser');
let Twitter = require('twitter');
let config = require('./config');
let Masto = require('mastodon');
const M = new Masto({
  access_token: config.masto.token,
  timeout_ms: 60 * 1000,  // optional HTTP request timeout to apply to all requests.
  api_url: config.masto.url
});
console.log('joining', config.chan);
let last = {};
let client  = new irc.Client(config.ircs, config.ircn, {
  channels: [config.chan]
});

let tclient = new Twitter({
  consumer_key: config.ck,
  consumer_secret: config.cs,
  access_token_key: config.atk,
  access_token_secret: config.ats
});

let params = {screen_name: config.sn};

// grab the twet
const getTweet = (id) => {
  console.log(id);
  return new Promise((res,rej) => {
    tclient
      .get(`/statuses/show/${id}`, params)
      .then((t) => {
        t && console.log('tweet', t.text);
        last = t;
        // todo: cache id here for reply with @handle
        res(`@${t.user.screen_name}: ${t.text.replace('\n\n', '\n')}`);
      })
      .catch(e => console.log(e));
  });
};

// put a twit
const twit = (m) => {
  console.log('twurting', m);
  return new Promise((res, rej) => {
    tclient.post('statuses/update', {status: m}, (e, t, r) => {
      console.log(e);
      if (e) {
        console.log(e);
        rej(e);
      }
      return res();
    });
  });
};
// post to mastodon
mastPost = (text) =>
  M.post('statuses', {
    status: text
  })
    .then(val => console.log(val))
    .catch(err => console.log(`mastadon error: ${e}`));
// reply a twit
const reply = (m) => {
  console.log('replying to ', last.str_id, ' with ', m);
  return new Promise((res, rej) => {
    tclient.post('statuses/update', {status: m, in_reply_to_status_id: last.id_str}, (e, t, r) => {
      console.log(e);
      if (e) {
        console.log(e);
        rej(e);
      }
      return res();
    });
  });
};

// irc server
client.addListener('error', (e) => {
  console.log(e);
});
client.addListener('invite', () => {
  console.log('bot invited');
  client.join(config.chan);
});
client.addListener('error', (e) => {
  console.log(e);
});
client.addListener('join', (c, n, m) => {
  if (n === config.masterNick && c === config.chan){
    console.log('blurt off, masternick joined');
    config.blurt = false;
  }
});
client.addListener('part', (c, n) => {
  if (c === config.chan && n === config.masterNick){
    console.log('blurt on, masternic parted');
    config.blurt = true;
  }
});
client.addListener('message', (f,t,m) => {
  m.indexOf('https://twitter.com') > -1 &&
  config.ignore.indexOf(f) === -1 &&
  m.indexOf('status') > -1 &&
    getTweet(m.slice(m.indexOf('status/') + 7, m.indexOf('?') !== -1 ? m.indexOf('?') : m.length))
      .then(m => {
        // look for links
        var compiled = m.slice();
        if (m.indexOf('t.co') > -1){
          var sliceIndex = m.length - m.indexOf('https://t.co');
          console.log(-sliceIndex, m.slice(-sliceIndex));
          new Bypasser(m.slice(-sliceIndex)).decrypt( (err, result) => {
            err && console.log('tco error', err);
            console.log(result);
            compiled = compiled.slice(0, m.indexOf('https://t.co')) + ' ' + result;
            console.log(compiled);
            config.blurt && client.say(config.chan, compiled);
          });
        } else {
          config.blurt && client.say(config.chan, compiled);
        }
      });
  // look for 'reply'
  m.indexOf('treply') === 0 &&
  config.ignore.indexOf(f) === -1 &&
  f.indexOf(config.ircn) === -1 &&
  f.indexOf(config.sn) === -1 &&
    reply(m.slice(6))
      .then(() => client.say(config.chan, config.ircn + ' got em') && console.log(config.ircn))
      .catch(e => client.say(config.chan, (e[0] && e[0].message) || e));
  // look for twits
  m.indexOf('ttwit') === 0 &&
  config.ignore.indexOf(f) === -1 &&
  f.indexOf(config.ircn) === -1 &&
  f.indexOf(config.sn) === -1 &&
    twit(m.slice(5))
      .then(() => console.log(config.ircn))
      .catch(e => client.say(config.chan, e[0].message || e));

  if (m.indexOf('trlbo blurt on') > -1){
    console.log('turning blurt off');
    config.blurt = true;
  }
  if (m.indexOf('trlbo blurt off') > -1){
    console.log('turning blurt off');
    config.blurt = false;
  }
  if (m.indexOf('toot') === 0){
    mastPost(m.slice('toot'.length + 1, m.length));
  }
});
