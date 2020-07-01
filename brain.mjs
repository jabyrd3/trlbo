const params = {
  screen_name: 'trlbo',
  tweet_mode: 'extended'
};
const getTweet = (id, thus) => {
  console.log(id);
  return new Promise((res) => {
    thus.tClient
      .get(`/statuses/show/${id}`, params)
      .then((t) => {
        t && console.log('tweet', t.full_text);
        thus.last = t;
        // todo: cache id here for reply with @handle
        res(`@${t.user.screen_name}: ${t.full_text.replace('\n\n', '\n')}`);
      })
      .catch(e => console.log(e));
  });
};
  // put a twit
const twit = (m, thus) => {
  console.log('twurting', m);
  return new Promise((res, rej) => {
    thus.irc.post('statuses/update', {status: m}, (e, t, r) => {
      console.log(e);
      if (e) {
        console.log(e);
        rej(e);
      }
      return res();
    });
  });
};

(f, t, m) => {
  console.log('message', f, t, m);
  m.indexOf('https://twitter.com') > -1 &&
  config.ignore.indexOf(f) === -1 &&
  m.indexOf('status') > -1 &&
    getTweet(m.slice(m.indexOf('status/') + 7, m.indexOf('?') !== -1 ? m.indexOf('?') : m.length), this)
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
            config.blurt && this.irc.say(config.chan, compiled);
          });
        } else {
          config.blurt && this.irc.say(config.chan, compiled);
        }
      });
  // look for 'reply'
  m.indexOf('treply') === 0 &&
  config.ignore.indexOf(f) === -1 &&
  f.indexOf(config.ircn) === -1 &&
  f.indexOf(config.sn) === -1 &&
    reply(m.slice(6))
      .then(() => this.irc.say(config.chan, config.ircn + ' got em') && console.log(config.ircn))
      .catch(e => this.irc.say(config.chan, (e[0] && e[0].message) || e));
  // look for twits
  m.indexOf('ttwit') === 0 &&
  config.ignore.indexOf(f) === -1 &&
  f.indexOf(config.ircn) === -1 &&
  f.indexOf(config.sn) === -1 &&
    twit(m.slice(5), this)
      .then(() => console.log(config.ircn))
      .catch(e => this.irc.say(config.chan, e[0].message || e));

  if (m.indexOf('trlbo blurt on') > -1){
    console.log('turning blurt on');
    config.blurt = true;
  }
  if (m.indexOf('trlbo blurt off') > -1){
    console.log('turning blurt off');
    config.blurt = false;
  }
  if (m.indexOf('toot') === 0){
    mastPost(m.slice('toot'.length + 1, m.length));
  }

};
