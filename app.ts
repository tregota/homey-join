import Homey from 'homey';
import Join from 'node-red-contrib-join-joaoapps/js/join';
import { Device, Devices } from 'node-red-contrib-join-joaoapps/js/device';


const CACHETIMEOUT = 60000;  // ms

type Push = {
  text: string,
  deviceIds?: string[] | string,
  deviceNames?: string[] | string,
  title?: string,
  url?: string,
  smallicon?: string,
  icon?: string,
  image?: string,
  group?: string,
  app?: string
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
      .registerRunListener(({ recipients: { name: deviceNames }, text }, flowState) => {
        const title = this.homey.settings.get('joinNotificationTitle');
        const icon = this.homey.settings.get('joinIconUrl');
        const smallIcon = this.homey.settings.get('joinSmallIconUrl');
        this.sendPush({
          deviceNames,
          title: title || 'Homey',
          text,
          smallicon: smallIcon || icon ? undefined : 'https://raw.githubusercontent.com/tregota/homey-join/main/assets/notification.png',
          icon,
          group: title || 'Homey'
        })
      })
      .getArgument('recipients').registerAutocompleteListener((query) => Promise.resolve([{ 
        name: 'LYA-L29'
      }]));

    this.log('Join App has been initialized');
  }

  async sendPush(push: Push, deviceFilter?: (device: Device, index: number, array: Devices) => Devices, options?: any) {
    if (!push.text){
      throw new Error('text needs to be set');
    }
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

  // recipientsAutocomplete(filter: string, deviceFilter?: (device: Device) => boolean, onlyOne?: boolean): Promise<any> {
  //   let recipients = this.devices;
  //   if (deviceFilter) {
  //     recipients = this.devices.filter(deviceFilter);
  //   }
  //   if (filter) {
  //     let filters = filter.toLowerCase().split(',').map(x => x.trim())
  //     recipients = recipients.filter((device: Device) => device.deviceName.toLowerCase().indexOf(filter.toLowerCase()) >= 0);
  //   }
  //   if (onlyOne) {
  //     recipients = recipients.slice(0,1);
  //   }
  // }
}

module.exports = JoinApp;
