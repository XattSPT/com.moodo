'use strict';

const Homey = require('homey');
const http = require('http.min');

class MoodoDevice extends Homey.Device {

    async onAdded(){
        try{
            console.log("adding new device")
            await this.onInit();  
        } catch (error) {
            console.log(error);
        }
    }

    onInit() {
        const capabilities = this.getCapabilities();
        this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));
        this.registerCapabilityListener('mode_interval', this.onCapabilitySetMode.bind(this));
        this.registerCapabilityListener('dim', this.onCapabilityFanSet.bind(this));
        this.registerCapabilityListener('shuffle', this.onCapabilityShuffleSet.bind(this));
        this.getdevicedata(this);
        let driver = this.getDriver()
        let data = this.getData()
        setTimeout(function(){driver.startsocketio(data)},1000)
    }

    async getdevicedata(data, callback){
    try{
        let mtoken = Homey.ManagerSettings.get('moodotoken')
        let devicee = this.getData() 
        let device = this
        let askdevice = {
            uri: "https://rest.moodo.co/api/boxes/"+devicee.id,
            json: true,
            headers: {'token': mtoken},
        }
        http.get(askdevice).then(function (result) {
            if (result.response.statusCode !== 200) return (new Error('no_devices'))
            if (result.data) {
                let onoff
                if (result.data.box.box_status == 1){
                    onoff = true
                } else {
                    onoff = false
                }
                let interval = device.ValuetoMode(result.data.box.interval, result.data.box.interval_type)
                device.setCapabilityValue("onoff", onoff)
                device.setCapabilityValue("shuffle", result.data.box.shuffle)
                device.setCapabilityValue("dim", result.data.box.fan_volume/100)
                device.setCapabilityValue("mode_interval", interval)
                //console.log("************ UPDATE DEVICE FROM CLOUD - " + devicee.name + "******************")
                //console.log("equip: ",devicee.name)
                //console.log("onoff: ",device.getCapabilityValue('onoff'))
                //console.log("mode: ",device.getCapabilityValue('mode_interval'))
                //console.log("fan_speed: ",device.getCapabilityValue('dim')/100)
                //console.log("shuffle: ",device.getCapabilityValue('shuffle'))
                return
            }
        })
    } catch (error) {
        console.log(error);
    }
    }

    async updatedevicedata(data, callback){
        try{
            let devicee = this.getData() 
            let device = this
            let onoff
            if (data.box_status == 1){
                onoff = true
            } else {
                onoff = false
            }
            let interval = device.ValuetoMode(data.interval, data.interval_type)
            await device.setCapabilityValue("onoff", onoff)
            await device.setCapabilityValue("shuffle", data.shuffle)
            await device.setCapabilityValue("dim", data.fan_volume/100)
            await device.setCapabilityValue("mode_interval", interval)
    
            //console.log("************ UPDATE DEVICE FROM EMITED SOCKET.IO - " + devicee.name + "******************")
            //console.log("equip: ",devicee.name)
            //console.log("onoff: ",device.getCapabilityValue('onoff'))
            //console.log("mode: ",device.getCapabilityValue('mode_interval'))
            //console.log("fan_speed: ",device.getCapabilityValue('dim')*100)
            //console.log("shuffle: ",device.getCapabilityValue('shuffle'))
        } catch (error) {
            console.log(error);
        }
    }

    async onCapabilityOnOff (value, opts){
        try{
            console.log("NEW SET ON OFF")
            await this.setCapabilityValue('onoff', value)
            let mtoken = Homey.ManagerSettings.get('moodotoken')
            let devicee = this.getData() 
            let askdevice = {
                uri: "https://rest.moodo.co/api/boxes/"+devicee.id,
                json: true,
                headers: {'token': mtoken},
                json: {
                    "fan_volume": this.getCapabilityValue('dim')*100,
                    "duration_minutes": 30  
                  }
            }
            if (value == true){
                await http.post(askdevice).then(function (result) {
                    if (result.response.statusCode !== 200) return (new Error('no_devices'))
                    if (result.data) {
                        return 
                    }
                })
            } else {
                await http.delete(askdevice).then(function (result) {
                    if (result.response.statusCode !== 200) return (new Error('no_devices'))
                    if (result.data) {
                        return 
                    }
                })
            }
        }catch (err) {
            throw new Error(err);
        }
    } 

    async onCapabilitySetMode (value, opts){
        try{
            console.log("SET NEW MODE")
            await this.setCapabilityValue('mode_interval', value)
            let mtoken = Homey.ManagerSettings.get('moodotoken')
            let devicee = this.getData() 
            let intervaldata = this.ModetoValue(value) 
            let askdevice = {
                uri: "https://rest.moodo.co/api/interval/"+devicee.id,
                json: true,
                headers: {'token': mtoken},
                json: {
                    "interval_type": intervaldata.interval_type, 
                  }
            }
            if (intervaldata.interval == true){
                await http.post(askdevice).then(function (result) {
                    if (result.response.statusCode !== 200) return (new Error('no_devices'))
                    if (result.data) {
                        return 
                    }
                })
            } else {
                await http.delete(askdevice).then(function (result) {
                    if (result.response.statusCode !== 200) return (new Error('no_devices'))
                    if (result.data) {
                        return 
                    }
                })
            }


            
        }catch (err) {
            throw new Error(err);
        }
    } 

    async onCapabilityShuffleSet (value, opts){
        try{
            console.log("SET NEW SHUFFLE")
            await this.setCapabilityValue('shuffle', value)
            let mtoken = Homey.ManagerSettings.get('moodotoken')
            let devicee = this.getData() 
            if (value == true){
                let askdevice = {
                    uri: "https://rest.moodo.co/api/shuffle/"+devicee.id,
                    json: true,
                    headers: {'token': mtoken},
                    json: {
                    "device_key": 9713,
                    "box_status": 1,
                    "can_interval_turn_on": true
                    }
                }
                await http.post(askdevice).then(function (result) {
                    if (result.response.statusCode !== 200) return (new Error('no_devices'))
                    if (result.data) {
                        return 
                    }
                })
            }else {
                let askdevice = {
                    uri: "https://rest.moodo.co/api/shuffle/"+devicee.id,
                    json: false,
                    headers: {'token': mtoken},
                }
                await http.delete(askdevice).then(function (result) {
                    if (result.response.statusCode !== 200) return (new Error('no_devices'))
                    if (result.data) {
                        return 
                    }
                })
            }
        }catch (err) {
            throw new Error(err);
        }
    } 


    async onCapabilityFanSet (value, opts){
        try{
            console.log("NEW FAN SET")
            await this.setCapabilityValue('dim', value)
            let mtoken = Homey.ManagerSettings.get('moodotoken')
            let devicee = this.getData() 
            let askdevice = {
                uri: "https://rest.moodo.co/api/intensity/"+devicee.id,
                json: true,
                headers: {'token': mtoken},
                json: {
                "fan_volume": value*100,
                }
            }
            await http.post(askdevice).then(function (result) {
                if (result.response.statusCode !== 200) return (new Error('no_devices'))
                if (result.data) {
                    return 
                }
                })
        }catch (err) {
            throw new Error(err);
        }
    } 

    ModetoValue (value){
        let interval
        let interval_type
        if (value == "off"){
            interval = false
            interval_type = 1
        } else{ 
            interval = true
            if (value == "econ"){
                interval_type = 2
            } else if (value == "efficient"){
                interval_type = 1
            } else if (value == "powerfull"){
                interval_type = 0
            }
        }
        let intervaldata ={
            'interval': interval,
            'interval_type': interval_type
        }
        return intervaldata
    }
    ValuetoMode (interval, interval_type){
        let value
        if (interval == false){
             value = "off"
        }else if (interval_type == 2){
             value = "econ"
        }else if (interval_type == 1){
            value = "efficient"
        }else if (interval_type == 0){
            value = "powerfull"
        }
        return value
    }



}

module.exports = MoodoDevice;
