/**
 * Created on : 28/06/20
 * Author     : arioki
 * Name       : Yoga Setiawan
 * GitHub     : https://github.com/arioki
 */
require('dotenv').config()
const fetch = require('node-fetch');
const cron = require('node-cron')
const amqp = require('amqplib/callback_api');

const regex = new RegExp(process.env.REGEX, "gm");
let allMessage = []
let stopRequestNew = false
const defaultHeader = {
    headers: {
        "Accept": "application/json; charset=utf-8",
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "lang": "id",
        "Platform": "android",
        "Timestamp": "1593303027884",
        "Authorization": `Bearer ${process.env.TOKEN}`,
        "User-Agent": "okhttp/3.12.1",
    }
}

fetchDataNumber = (params) => {
    fetch(process.env.BASE_URL + `api/number${params}`, defaultHeader)
        .then(res => res.json())
        .then(json => {
            if (json.message === "ok") parsingResponseAndSendData(json)
        })
        .catch(err => {

        });
}
parsingResponseAndSendData = result => {
    let a = null
    amqp.connect(process.env.RABBIT_MQ_SERVER, function (error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1;
            }

            const queue = 'wa-text';
            channel.assertQueue(queue, {
                durable: false
            });

            result.data.forEach(data => {

                a = checkNumber(data.display_msisdn)
                if (a && checkMessage(a)) {
                    let message = {
                        "Target": process.env.TARGET_WA,
                        "Message": `Dapat Nomor by.U bagus nih ${a}`,
                        "Image": ""
                    }

                    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
                    console.log(" [x] Sent %s", JSON.stringify(message));
                }
            })
        });
        setTimeout(function () {
            connection.close();
            //process.exit(0);
        }, 500);
    });
}
checkNumber = number => {
    if (regex.exec(number) !== null) {
        return number
    } else {
        let array_elements = number.split("")
        array_elements.sort();
        array_elements.push(" ")
        let current = null
        let count = 0
        let total = []
        for (let i = 0; i < array_elements.length; i++) {
            if (array_elements[i] !== current) {
                if (count >= process.env.MINIMUM_LOOP_NUMBER) {
                    total.push({
                        number: current,
                        count: count
                    })
                }
                current = array_elements[i]
                count = 1
            } else {
                count++
            }
        }
        if (total.length > 0) {
            let string = ""
            total.forEach(data => {
                if (data.count > 1) {
                    string = string + ` ${data.number}X${data.count}`
                }
            })
            return `${string} ${number}`
        } else {
            return false
        }
    }
}
checkMessage = msg => {
    let uniq = true
    allMessage.forEach(data => {
        if (data === msg) {
            uniq = false
        }
    })
    if (uniq) {
        allMessage.push(msg)
    }
    return uniq
}

cron.schedule("15-30 * * * * *", () => {
    if (stopRequestNew) {
        //reload new number every 5 minutes
        fetchDataNumber("?")
    } else {
        //reload new number very 15-30 second
        fetchDataNumber("?requestNew=1")
    }
});
