import Homey from 'homey';
import Join from 'node-red-contrib-join-joaoapps/js/join';
import { Device, Devices } from 'node-red-contrib-join-joaoapps/js/device';

type Push = {
  text: string,
  deviceIds?: string[] | string,
  deviceNames?: string[],
  title?: string,
  url?: string,
  icon?: string
}

class JoinApp extends Homey.App {
  private join?: Join;

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    const apiKey = this.homey.settings.get('joinApiKey');
    if (apiKey) {
      this.join = new Join(this.homey.settings.get('joinApiKey'));
    }
    this.homey.settings.on('set', (key) => {
      if (key === 'joinApiKey') {
        this.log('Join API key updated');
        this.join = new Join(this.homey.settings.get('joinApiKey'));
      }
    })

    // // notification
    // this.homey.flow.getActionCard('join-notification')
    //   .registerRunListener(({ recipients: { name } }, flowState) => {
    //     this.sendPush({
    //       deviceNames: name.split(',')
    //     })
    //   })
    //   .getArgument('recipients').registerAutocompleteListener((query) => todo);

    this.log('Join App has been initialized');
  }

  async sendPush(push: Push, deviceFilter?: (device: Device, index: number, array: Devices) => Devices, options?: any) {
    if(!this.join) {
      throw new Error('No API key configured');
    }
    if(!push.text){
      throw new Error('text needs to be set');
    }     
  
    this.log(`Sending push: ${JSON.stringify(push)}`)
    var result = await this.join!.sendPush(push, deviceFilter, { ...options, node: {} }); // "node: {}" is a node red stuff workaround

    this.log(`Push results - Success: ${result.success}; Failure: ${result.failure}`)
    if (result.firstFailure) {
      throw new Error(result.firstFailure.message || "Couldn't send push");
    }
  }
}

module.exports = JoinApp;
