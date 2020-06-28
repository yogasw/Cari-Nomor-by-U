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
const puppeteer = require('puppeteer');
const regex = new RegExp(process.env.REGEX, "gm");
let allMessage = []
let count = 0
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
//reload new number very 15-30 second

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
    let buy = true
    amqp.connect(process.env.RABBIT_MQ_SERVER, (error0, connection) => {
        if (error0) {
            throw error0;
        }
        connection.createChannel((error1, channel) => {
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
                    if (buy) {
                        console.log("masuk")
                        console.log("a", a)
                        console.log("buy", buy)
                        buyNumber(a)
                        buy = false
                        let message = {
                            "Target": process.env.TARGET_WA,
                            "Message": `Dapat Nomor by.U bagus nih ${a}`,
                            "Image": ""
                        }
                        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
                        console.log(" [x] Sent %s", JSON.stringify(message));
                    }
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
    count++
    console.log(`${count}. Check Number  ${number}`)
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
fetchDataNumber("?requestNew=1")
this.job = cron.schedule("15 * * * * *", () => {
    fetchDataNumber("?requestNew=1")
});

buyNumber = number => {
    console.log(number)
    if (this.job) {
        this.job.stop()
    }
    (async () => {
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--headless',
                '--disable-gpu',
                '--window-size=1800x1200',
            ]
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
        await page.goto('https://www.byu.id/id');
        await page.screenshot({path: 'home.png'});
        await page.evaluate(() => {
            localStorage.setItem('persist:root', `${process.env.DATA_LOCAL}`)
            localStorage.setItem('loginFrom', '/id/ijoin/choose-number')
        });
        await page.setRequestInterception(true)
        page.on('request', (request) => {
            const headers = request.headers();
            headers['Authorization'] = `Bearer ${process.env.TOKEN}`;
            request.continue({
                headers
            });
        });
        await page.goto('https://www.byu.id/id/ijoin/choose-number');
        await page.waitFor(10000)
        let selector = ".square-56.ta-c.br-full.base-shadow.c-pointer.bg-bright-sky-blue.transition-all-4s"
        const [button] = await page.$x(`//button[contains(., '${number}')]`);
        if (button) {
            await button.click()
        }
        await page.focus(selector)
        await page.click(selector)
        await page.screenshot({path: 'example.png', fullPage: true});
        await browser.close();
    })();
}
