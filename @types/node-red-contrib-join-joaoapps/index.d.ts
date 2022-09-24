/// <reference types="node" />

declare module 'node-red-contrib-join-joaoapps/js/join' {
  export default class Join {
    constructor(apiKey: string);
    get devices();
    async sendPush(push: any, deviceFilter?: any, options?: any);
    sendCommand(command: string, deviceFilter?: any, options?: any);
    notify(title: string, text: string, deviceFilter?: any, options?: any);
  }
}

declare module 'node-red-contrib-join-joaoapps/js/device' {
  export class Devices extends Array<Device> {
    static get TYPE_ANDROID_PHONE();
    static get TYPE_ANDROID_TABLET();
    static get TYPE_CHROME_BROWSER();
    static get TYPE_WINDOWS_10();
    static get TYPE_TASKER();
    static get TYPE_FIREFOX();
    static get TYPE_GROUP();
    static get TYPE_ANDROID_TV();
    static get TYPE_GOOGLE_ASSISTANT();
    static get TYPE_IOS_PHONE();
    static get TYPE_IOS_TABLET();
    static get TYPE_IFTTT();
    static get TYPE_IP();
    static get TYPE_MQTT();
    send(options: any);
    sendPush(push: any, options: any);
    filter(predicate: (value: Device, index: number, array: Device[]) => unknown, thisArg?: any): Devices;
  }
  export class Device {
    deviceId: string;
    deviceName: string;
    deviceType: number;
    apiLevel: number;
    hasTasker: boolean;
    isAnyType(...types: number[]);
    get isAndroidPhone();
    get isAndroidTablet();
    get isAndroid();
    get isChrome();
    get isWindows10();
    get isGCM();
    get isIP();
    get isIFTTT();
    get onlySendPushes();
    get senderClass();
    get sender();
    get asDevices();
    send(options: any);
    sendPush(push: any, options: any);
  }
}

