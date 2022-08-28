import Homey from 'homey';
import Join from 'node-red-contrib-join-joaoapps/js/join';
import { Device, Devices } from 'node-red-contrib-join-joaoapps/js/device';


const CACHETIMEOUT = 60000;  // ms

type Push = {
  deviceIds?: string[] | string,
  deviceNames?: string[] | string,
  title?: string,
  text?: string,
  icon?: string,
  smallicon?: string,
  url?: string,
  image?: string,
  group?: string,
  app?: string,
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
        this.sendNotification({
          deviceNames,
          text
        });
      })
      .getArgument('devices').registerAutocompleteListener((query) => Promise.resolve([{ 
        name: 'LYA-L29'
      }]));

    // image
    this.homey.flow.getActionCard('join-image')
      .registerRunListener(({ devices: { name: deviceNames }, text, droptoken }) => {
        this.sendNotification({
          deviceNames,
          text,
          image: droptoken.cloudUrl
        });
      })
      .getArgument('devices').registerAutocompleteListener((query) => Promise.resolve([{ 
        name: 'LYA-L29'
      }]));

    // json
    this.homey.flow.getActionCard('join-json')
      .registerRunListener(({ devices: { name: deviceNames }, json }) => {
        try {
          this.sendPush({
            deviceNames,
            ...JSON.parse(json)
          });
        }
        catch(err) {
          throw new Error('Invalid JSON');
        }
      })
      .getArgument('devices').registerAutocompleteListener((query) => Promise.resolve([{ 
        name: 'LYA-L29'
      }]));

    this.log('Join App has been initialized');
  }

  async sendNotification(notification: any) {
    const title = this.homey.settings.get('joinNotificationTitle');
    const icon = this.homey.settings.get('joinIconUrl');
    const smallicon = this.homey.settings.get('joinSmallIconUrl');

    let push = {
      title: title || 'Homey',
      smallicon,
      icon,
      group: title || 'Homey',
      ...notification
    }

    if(notification.text && notification.text.trim().startsWith('{')) {
      try {
        push = {
          ...push,
          text: undefined,
          ...JSON.parse(notification.text)
        }
      }
      catch(err) {}
    }

    if (!push.icon && !push.smallicon) {
      push.smallicon = 'https://raw.githubusercontent.com/tregota/homey-join/main/assets/notification.png';
    }

    this.sendPush(push);
  }

  async sendPush(push: Push, deviceFilter?: (device: Device, index: number, array: Devices) => Devices, options?: any) {
    if (push.deviceIds && Array.isArray(push.deviceIds)) {
      push.deviceIds = push.deviceIds.join(',');
    }
    if (push.deviceNames && Array.isArray(push.deviceNames)) {
      push.deviceNames = push.deviceNames.join(',');
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
