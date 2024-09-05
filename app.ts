import Homey from 'homey';
import Join from 'node-red-contrib-join-joaoapps/js/join';
import { Device, Devices } from 'node-red-contrib-join-joaoapps/js/device';
import 'source-map-support/register'

const DEFAULTSMALLICON = 'https://raw.githubusercontent.com/tregota/homey-join/main/githubassets/notification.png';

// https://github.com/joaomgcd/node-red-contrib-join-joaoapps/blob/master/js/device.js
const DEVICETYPEICONS: {[key: number]: string | undefined} = {
  1: 'phone',
  2: 'tablet',
  3: 'chrome',
  4: 'windows10',
  5: 'tasker',
  6: 'firefox',
  7: 'group',
  8: 'tv',
  9: 'googleassistant',
  10: 'iphone',
  11: 'tablet',
  12: 'ifttt',
  13: 'ip',
  14: 'mqtt',
}

class JoinApp extends Homey.App {
  private apiKey?: string;

  private _join?: Join;
	get join(): Join {
    if (!this.apiKey) {
      throw new Error('No API key configured')
    }
    if(!this._join) {
      this._join = new Join(this.homey.settings.get('joinApiKey'));
    }
    return this._join;
	}

  get devices(): Promise<Devices> {
		return this.join.devices;
	}

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.apiKey = this.homey.settings.get('joinApiKey');
    this.homey.settings.on('set', (key) => {
      if (key === 'joinApiKey') {
        this.log('Join API key updated');
        this.apiKey = this.homey.settings.get('joinApiKey');
        this._join = undefined;
      }
    })

    // notification
    this.homey.flow.getActionCard('join-notification')
      .registerRunListener(async ({ devices: { ids: deviceIds }, text }) => {
        const title = this.homey.settings.get('joinNotificationTitle') || 'Homey';
        await this.sendPush({
          deviceIds,
          title,
          text,
          group: title
        });
      })
      .getArgument('devices').registerAutocompleteListener((query) => this.autocompleteDevices(query));

    // image
    this.homey.flow.getActionCard('join-image')
      .registerRunListener(async ({ devices: { ids: deviceIds }, text, droptoken }) => {
        const title = this.homey.settings.get('joinNotificationTitle') || 'Homey';
        await this.sendPush({
          deviceIds,
          title,
          text,
          image: droptoken.cloudUrl,
          group: title
        });
      })
      .getArgument('devices').registerAutocompleteListener((query) => this.autocompleteDevices(query));

    // command
    this.homey.flow.getActionCard('join-command')
      .registerRunListener(({ devices: { ids: deviceIds }, text }) =>
        this.sendPush({
          deviceIds,
          text
        })
      )
      .getArgument('devices').registerAutocompleteListener((query) => this.autocompleteDevices(query));

    // say
    this.homey.flow.getActionCard('join-say')
      .registerRunListener(({ devices: { ids: deviceIds }, say }) =>
        this.sendPush({
          deviceIds,
          say
        })
      )
      .getArgument('devices').registerAutocompleteListener((query) => this.autocompleteDevices(query));

    // do not disturb
    this.homey.flow.getActionCard('join-donotdisturb')
      .registerRunListener(({ devices: { ids: deviceIds }, interruptionFilter }) =>
        this.sendPush({
          deviceIds,
          interruptionFilter
        })
      )
      .getArgument('devices').registerAutocompleteListener((query) => this.autocompleteDevices(query));

    // URL
    this.homey.flow.getActionCard('join-url')
      .registerRunListener(({ devices: { ids: deviceIds }, url }) =>
        this.sendPush({
          deviceIds,
          url
        })
      )
      .getArgument('devices').registerAutocompleteListener((query) => this.autocompleteDevices(query));

    // wallpaper
    this.homey.flow.getActionCard('join-wallpaper')
      .registerRunListener(({ devices: { ids: deviceIds }, wallpapertype, droptoken }) =>
        this.sendPush({
          deviceIds,
          [wallpapertype]: droptoken.cloudUrl,
        })
      )
      .getArgument('devices').registerAutocompleteListener((query) => this.autocompleteDevices(query));

    // image
    this.homey.flow.getActionCard('join-volume')
      .registerRunListener(({ devices: { ids: deviceIds }, volumetype, volume }) =>
        this.sendPush({
          deviceIds,
          [volumetype]: volume,
        })
      )
      .getArgument('devices').registerAutocompleteListener((query) => this.autocompleteDevices(query));

    // find
    this.homey.flow.getActionCard('join-find')
      .registerRunListener(({ devices: { ids: deviceIds } }) =>
        this.sendPush({
          deviceIds,
          find: true
        })
      )
      .getArgument('devices').registerAutocompleteListener((query) => this.autocompleteDevices(query));

    // sms
    this.homey.flow.getActionCard('join-sms')
      .registerRunListener(({ devices: { ids: deviceIds }, smstext, smsnumber }) =>
        this.sendPush({
          deviceIds,
          smstext,
          smsnumber
        })
      )
      .getArgument('devices').registerAutocompleteListener((query) => this.autocompleteDevices(query));

    // mms
    this.homey.flow.getActionCard('join-mms')
      .registerRunListener(({ devices: { ids: deviceIds }, smsnumber, mmssubject, droptoken }) =>
        this.sendPush({
          deviceIds,
          smsnumber,
          mmssubject,
          mmsfile: droptoken.cloudUrl,
        })
      )
      .getArgument('devices').registerAutocompleteListener((query) => this.autocompleteDevices(query));

    // app
    this.homey.flow.getActionCard('join-app')
      .registerRunListener(({ devices: { ids: deviceIds }, app }) =>
        this.sendPush({
          deviceIds,
          app,
        })
      )
      .getArgument('devices').registerAutocompleteListener((query) => this.autocompleteDevices(query));

    // clipboard
    this.homey.flow.getActionCard('join-clipboard')
      .registerRunListener(({ devices: { ids: deviceIds }, clipboard }) =>
        this.sendPush({
          deviceIds,
          clipboard
        })
      )
      .getArgument('devices').registerAutocompleteListener((query) => this.autocompleteDevices(query));

    // call
    this.homey.flow.getActionCard('join-call')
      .registerRunListener(({ devices: { ids: deviceIds }, callnumber }) =>
        this.sendPush({
          deviceIds,
          callnumber
        })
      )
      .getArgument('devices').registerAutocompleteListener((query) => this.autocompleteDevices(query));

    this.log('Join App has been initialized');
  }

  async sendPush(push: any, deviceFilter?: (device: Device, index: number, array: Devices) => Devices, options?: any) {
    if (push.deviceIds && Array.isArray(push.deviceIds)) {
      push.deviceIds = push.deviceIds.join(',');
    }
    if (push.deviceNames && Array.isArray(push.deviceNames)) {
      push.deviceNames = push.deviceNames.join(',');
    }

    if(push.text && push.text.trim().startsWith('{')) {
      try {
        const json = JSON.parse(push.text);
        push = {
          ...push,
          text: undefined,
          ...json
        }
      }
      catch(err) {}
    }

    if (push.say && !push.language) {
      push.language = this.homey.settings.get('joinLanguageCode');
    }
    if (push.title) {
      if (!push.icon && !push.smallicon) {
        push.icon = this.homey.settings.get('joinIconUrl');
        push.smallicon = this.homey.settings.get('joinSmallIconUrl') || DEFAULTSMALLICON;
      }
      if (!push.group) {
        push.group = push.title;
      }
    }

    // this.log(`Sending push: ${JSON.stringify(push)}`)
        var result = await this.join.sendPush(push, deviceFilter, { ...options, node: {} }); // "node: {}" is a node red stuff workaround

    if (result.firstFailure) {
      throw new Error(result.firstFailure.message || "Couldn't send push");
    }
  }

  async autocompleteDevices(filter: string, deviceFilter?: (device: Device) => boolean): Promise<any> {
    let devices = !deviceFilter ? await this.devices : (await this.devices).filter(deviceFilter);
    let newMatches = devices;
    let prevMatches = new Devices();
    if(filter) {
      let deviceNames = filter.toLowerCase().split(',').map(x => x.trim())
      if (filter.trim().endsWith(',') === false) {
        const lastEntered = deviceNames.pop()!;
        newMatches = devices.filter((device: Device) => device.deviceName.toLowerCase().startsWith(lastEntered));
      }
      if (deviceNames.length > 0) {
        prevMatches = devices.filter((device: Device) => deviceNames.includes(device.deviceName.toLowerCase()));
        newMatches = newMatches.filter((device: Device) => deviceNames.includes(device.deviceName.toLowerCase()) === false);
      }
    }

    const results = [];
    for (const match of newMatches) {
      const combination = [...prevMatches, match];
      const type = prevMatches.length > 0 ? 'group' : DEVICETYPEICONS[match.deviceType];
      results.push({
        name: combination.map((d) => d.deviceName).join(', '),
        ids: combination.map((d) => d.deviceId).join(','),
        icon: type && `https://raw.githubusercontent.com/tregota/homey-join/main/githubassets/type-${type}.svg`
      })
    }

    return results;
  }
}

module.exports = JoinApp;
