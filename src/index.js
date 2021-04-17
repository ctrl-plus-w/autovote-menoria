const { Builder, By, Key, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const chalk = require('chalk');

const config = require('../config.json');

const log = (message) => {
  const [start, end] = new Date()
    .toLocaleString('fr')
    .split('à')
    .map((x) => x.trim());

  console.log(`${chalk.blue(start + ' ' + end)} ${message}`);
};

const splitTime = (string) => {
  const h = string.split('h')[0];
  const m = string.split('h')[1].split('m')[0];
  const s = string.split('h')[1].split('m')[1].split('s')[0];
  return [h, m, s];
};

const formatTime = (time) => {
  const hrs = ~~(time / 3600);
  const mins = ~~((time % 3600) / 60);
  const secs = ~~time % 60;

  return `${hrs}:${mins}:${secs}`;
};

const countDown = (_secs) => {
  let curr = _secs;

  const remaining = (secs) => {
    log(formatTime(secs) + ' remaining.');
  };

  const end = (interval) => {
    clearInterval(interval);
    vote();
    log('Countdown finished.');
  };

  remaining(curr);

  const loop = setInterval(() => {
    curr -= config.GAP;
    remaining(curr);
    if (curr <= 0) end(loop);
  }, config.GAP * 1000);
};

const vote = async () => {
  const options = new firefox.Options();
  options.addArguments('--headless');

  log('Opening menoria with username : ' + config.USERNAME + '.');

  const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build();
  log('Driver created.');

  await driver.get(config.PATH);
  log('Accessing websited.');

  const input = await driver.findElement(By.id('username'));
  await input.sendKeys(config.USERNAME);
  await input.sendKeys(Key.RETURN);

  const errorCssPath =
    'html body div.website-wrapper main section.page-wrapper.vote-page div.container.vote-container div.vote-main-container div.panel.vote-interface-panel div.menoria-vote-form-container div.error';

  const successCssPath =
    'html body div.website-wrapper main section.page-wrapper.vote-page div.container.vote-container div.vote-main-container div.panel.vote-interface-panel div.menoria-vote-form-container div.success';

  driver
    .wait(until.elementLocated(By.css(successCssPath)), 10000)
    .then((x) => {
      log('Successfully voted.');
      countDown(1 * 60 * 60 + 30 * 60);
      driver.quit();
    })
    .catch((err) => {});

  driver
    .wait(until.elementLocated(By.css(errorCssPath)), 10000)
    .then(async (x) => {
      const errorMessage = await x.getAttribute('innerText');
      const splittedErrorMessage = errorMessage.split(' ');

      const [h, m, s] = splitTime(splittedErrorMessage[splittedErrorMessage.length - 1]);
      const totalSeconds = parseFloat(h) * 60 * 60 + parseFloat(m) * 60 + parseFloat(s);

      countDown(totalSeconds);
      driver.quit();
    })
    .catch((err) => {});
};

vote();
