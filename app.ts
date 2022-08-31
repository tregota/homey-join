import Homey from 'homey';
import Join from 'node-red-contrib-join-joaoapps/js/join';
import { Device, Devices } from 'node-red-contrib-join-joaoapps/js/device';


const CACHETIMEOUT = 60000;  // ms
const DEFAULTSMALLICON = 'https://raw.githubusercontent.com/tregota/homey-join/main/assets/notification.png';

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

  private renewDevicesAfter: number = 0;
  get devices() {
		return (async () => {
			if(this.renewDevicesAfter < Date.now()) {
        this._join = undefined;
        this.renewDevicesAfter = Date.now() + CACHETIMEOUT;
      }
      return this.join.devices;
		})();
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
      .registerRunListener(({ devices: { name: deviceNames }, text }) => {
        const title = this.homey.settings.get('joinNotificationTitle') || 'Homey';
        this.sendPush({
          deviceNames,
          title,
          text,
          group: title
        });
      })
      .getArgument('devices').registerAutocompleteListener((query) => Promise.resolve([{ 
        name: 'LYA-L29'
      }]));

    // image
    this.homey.flow.getActionCard('join-image')
      .registerRunListener(({ devices: { name: deviceNames }, text, droptoken }) => {
        const title = this.homey.settings.get('joinNotificationTitle') || 'Homey';
        this.sendPush({
          deviceNames,
          title,
          text,
          image: droptoken.cloudUrl,
          url: droptoken.cloudUrl,
          group: title
        });
      })
      .getArgument('devices').registerAutocompleteListener((query) => Promise.resolve([{ 
        name: 'LYA-L29'
      }]));

    // do not disturb
    this.homey.flow.getActionCard('join-donotdisturb')
      .registerRunListener(({ devices: { name: deviceNames }, interruptionFilter }) => {
        this.sendPush({
          deviceNames,
          interruptionFilter
        });
      })
      .getArgument('devices').registerAutocompleteListener((query) => Promise.resolve([{ 
        name: 'LYA-L29'
      }]));

    // command
    this.homey.flow.getActionCard('join-command')
      .registerRunListener(({ devices: { name: deviceNames }, command: text }) => {
        this.sendPush({
          deviceNames,
          text
        });
      })
      .getArgument('devices').registerAutocompleteListener((query) => Promise.resolve([{ 
        name: 'LYA-L29'
      }]));

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

    this.log(`Sending push: ${JSON.stringify(push)}`)
    var result = await this.join.sendPush(push, deviceFilter, { ...options, node: {} }); // "node: {}" is a node red stuff workaround

    this.log(`Push results - Success: ${result.success}; Failure: ${result.failure}`)
    if (result.firstFailure) {
      throw new Error(result.firstFailure.message || "Couldn't send push");
    }
  }

  // devicesAutocomplete(filter: string, deviceFilter?: (device: Device) => boolean, onlyOne?: boolean): Promise<any> {
  //   let devices = this.devices;
  //   if (deviceFilter) {
  //     devices = this.devices.filter(deviceFilter);
  //   }
  //   if (filter) {
  //     let filters = filter.toLowerCase().split(',').map(x => x.trim())
  //     devices = devices.filter((device: Device) => device.deviceName.toLowerCase().indexOf(filter.toLowerCase()) >= 0);
  //   }
  //   if (onlyOne) {
  //     devices = devices.slice(0,1);
  //   }
  // }
}

module.exports = JoinApp;
