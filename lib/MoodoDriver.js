"use strict";

const Homey = require('homey');
const http = require('http.min');


class MoodoDriver extends Homey.Driver {

    async onInit() {
        /*try{
            if (this.getDevices().length > 0){
            }

            this.homey.flow.getActionCard('set_effect')
            .register()
            .registerRunListener( async args => {
              return args.device.onCapabilityFavsSet( args.effect.id)
            })
            .getArgument('effect')
            .registerAutocompleteListener(async ( query, args ) => {
              const effects = await args.device.refreshfavorites();
              return effects.map(effect => {
                return {
                    name: effect.title,
                    id: effect.id,
                }
              //}).filter( effect => {
              //  console.log(effect.title.toLowerCase().includes( query.toLowerCase() ))
              //  return effect.title.toLowerCase().includes( query.toLowerCase() );          
              });
            })
        
        } catch (error) {
            console.log(error);
        }*/
    }
    
    async gettoken(username, password){
    try{
        this.homey.settings.set('moodousername', username)
        this.homey.settings.set('moodopassword', password)
        let options={
            uri: 'https://rest.moodo.co/api/login',
            json: true,
            json: {
                "email": username,
                "password": password
            }
        }
        await http.post(options).then(function (result) {
            if (result.data) {
                console.log("Token - ", result.data)
                this.homey.settings.set('moodotoken', result.data.token)
                return 
            }
            if (result.response.statusCode !== 200) return (new Error('no_token'))
        })
        //this._syncTimeout = setTimeout(this.gettoken.bind(this), (24*3600*1000));
    } catch (error) {
        console.log(error);
    }
    }


    async getdevicescloud(data, callback){
        try{
        console.log("1")
        let mtoken = this.homey.settings.get('moodotoken')
        let askdevices = {
            uri: 'https://rest.moodo.co/api/boxes',
            json: true,
            headers: {'token': mtoken},
        }
        let devs = await http.get(askdevices).then(function (result) {
            console.log(result)
            if (result.response.statusCode !== 200) return (new Error('no_devices'))
            if (result.data) {
                let a;
                let b;
                let devices = []
                let device = []
                console.log(result.data)
                for (a = 0; a < result.data.boxes.length; a++) {
                         devices.push({
                            "name": result.data.boxes[a].name,
                            "data": {
                                "id": result.data.boxes[a].device_key,
                                "name": result.data.boxes[a].name,
                            },
                        }); 
                }
            return devices
            }
          })
        return callback(devs)
    } catch (error) {
        console.log(error);
    }
    }

    startsocketio(data){
        console.log("************* START SOCKET.IO ************")
        const io = require('socket.io-client');
        const socketm = io.connect('https://ws.moodo.co:9090', {reconnect: true});
        let mtoken = this.homey.settings.get('moodotoken')
        let driver = this
        socketm.on('connect', function(msg){
            console.log('Connected');
            console.log(msg)
            socketm.on('log', function (msg) {
                console.log(msg);
            });

            setTimeout(function () {
                socketm.emit('authenticate', mtoken, false);
                console.log('Authenticated');
            }, 1000);
            
            setTimeout(function () {
                socketm.emit('subscribe', 'homebridge');
                console.log('Subscribed');
            }, 2500);
        });
        console.log("espera")
        socketm.on('ws_event', function(object){
            //console.log('Event-Moodo');
            if(object.type == "box_config" || object.type == "box_shuffle" || object.type == "box_interval"){
                driver.updatedevice(object.data) 
            }
        })
    }

    async updatedevice(data){
        try{ 
            let driver = this
            let devices = await this.getDevices()
            for (let a = 0; a < devices.length; a++) {
                let dev = devices[0].getData()
                if( dev.id == data.device_key){ 
                    let device = driver.getDevice(dev)
                    device.updatedevicedata(data)
                }
            };
        } catch (error) {
            console.log(error);
        }
    }

    

    onPair (socket) {   
        let driver = this 
        socket.on('login', (data, callback) => {
            if (data.username === '' || data.password === '') return callback(null, false)
                this.gettoken(data.username, data.password)
                setTimeout(function(){callback(null, true)},3000)
        })
    
        socket.on('list_devices', (data, callback) => {
            this.getdevicescloud("devices", function(devices){
                callback(null, devices)} 
        )})
        
        socket.on('add_device', (device, callback) => {
          console.log('pairing', device)
        })
    }
}

module.exports = MoodoDriver;