const params = {
  screen_name: 'trlbo',
  tweet_mode: 'extended'
};
console.log('brain loaded');
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
    thus.tClient.post('statuses/update', {status: m}, (e, t, r) => {
      console.log(e);
      if (e) {
        console.log(e);
        rej(e);
      }
      return res();
    });
  });
};
(decode, f, t, m) => {
  // console.log('message', f, t, m);
  // look for twitter link
  t.indexOf('https://twitter.com') > -1 &&
  config.ignore.indexOf(f) === -1 &&
  t.indexOf('status') > -1 &&
    getTweet(t.slice(t.indexOf('status/') + 7, t.indexOf('?') !== -1 ? t.indexOf('?') : t.length).split(' ')[0], this)
      .then(tweet => {
        config.blurt && this.irc.say(m.args[0], decode(tweet));
      });
  // look for 'reply'
  false && m.indexOf('treply') === 0 &&
  config.ignore.indexOf(f) === -1 &&
  f.indexOf(config.ircn) === -1 &&
  f.indexOf(config.sn) === -1 &&
    reply(m.slice(6))
      .then(() => this.irc.say(config.chan, config.ircn + ' got em') && console.log(config.ircn))
      .catch(e => this.irc.say(config.chan, (e[0] && e[0].message) || e));
  // look for twits
  t.indexOf('twit') === 0 &&
  config.ignore.indexOf(f) === -1 &&
  f.indexOf(config.ircn) === -1 &&
  f.indexOf(config.sn) === -1 &&
    twit(t.slice(5), this)
      .then(() => console.log(config.ircn))
      .catch(e => console.log(e));

  if (t.indexOf('trlbo blurt on') > -1){
    console.log('turning blurt on');
    config.blurt = true;
  }
  if (t.indexOf('trlbo blurt off') > -1){
    console.log('turning blurt off');
    config.blurt = false;
  }
  if(t.indexOf('sup') === 0 && t.split(' ').length === 2){
    const sn = t.split(' ')[1]
    this.tClient.get('statuses/user_timeline', {
      screen_name: sn,
      include_rts: 1,
      count: 1
    })
      .then(tl => {
        console.log(m.args, tl[0].text)
        this.irc.say(m.args[0], `@${sn}: ${decode(tl[0].text)}`)
      })
      .catch(e => console.error(`latest tweet lookup failed`, e))
  }
};
