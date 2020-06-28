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
buyNumber = number => {
    (async () => {
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--headless',
                '--disable-gpu',
                '--window-size=1920x1080',
            ]
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
        await page.goto('https://www.byu.id/id');
        await page.screenshot({path: 'home.png'});
        await page.evaluate(() => {
            localStorage.setItem('persist:root', '{"user":"{\\"isLogin\\":true,\\"profile\\":{\\"user_id\\":4712996,\\"name\\":\\"yoga seriyawan\\",\\"email\\":\\"sedoyoga@gmail.com\\",\\"birth_date\\":null,\\"sub\\":\\"114800082472685121656\\",\\"source\\":\\"google-oauth2\\",\\"language_setting\\":null,\\"picture\\":\\"https://lh6.googleusercontent.com/-LRiX3TanMGM/AAAAAAAAAAI/AAAAAAAAAAA/AMZuuckK0zOGOQmWDx8a_pBzbYfyDcOOWg/photo.jpg\\",\\"account_status\\":\\"registered\\",\\"phone\\":null,\\"created_at\\":\\"2020-06-28T08:06:20.000000Z\\",\\"referral_code\\":null,\\"is_join_inspigo\\":false,\\"is_rated\\":false,\\"is_request_sim_success\\":false,\\"is_request_sim\\":false,\\"is_request_sim_approved\\":\\"0\\",\\"is_order_request_sim\\":false},\\"lexi\\":\\"eyJ0eXAiOiJKV1QiLCJraWQiOiJ3VTNpZklJYUxPVUFSZVJCL0ZHNmVNMVAxUU09IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJiNWFlMmIxMC0xM2Y3LTQyNmQtYWZkOS1kM2RhMThmZDc2NWYiLCJjdHMiOiJPQVVUSDJfR1JBTlRfU0VUIiwiYXV0aF9sZXZlbCI6MCwiYXVkaXRUcmFja2luZ0lkIjoiYTQ0MmVlMTQtZjM3ZS00NThmLWE2ZmUtZWJjOTY0Mzc4ZTlkLTEwMDc3OTg3NDQiLCJpc3MiOiJodHRwczovL2NpYW1hbXBhcHBic2QuY2lhbS50ZWxrb21zZWwuY29tOjEwMDEwL29wZW5hbS9vYXV0aDIvdHNlbC9ieXUvd2ViIiwidG9rZW5OYW1lIjoicmVmcmVzaF90b2tlbiIsInRva2VuX3R5cGUiOiJCZWFyZXIiLCJhdXRoR3JhbnRJZCI6IllvSnUzb2xwQlcxQWJOVGNjT2VhQnFMa2tTNC5yMUhXRHZOZklETUFYcTJCVFF1bkthOTVRcGciLCJhdWQiOiJiYmRkMmIwZTAzOWE0ZjZjODhmNzlmOTRiMTBhYTAwOSIsImFjciI6IjAiLCJuYmYiOjE1OTMzMzE1NzksIm9wcyI6IkdIODVlNEVPQ3VPVDR2NG5jUjJPVnNqUXhyMCIsImdyYW50X3R5cGUiOiJhdXRob3JpemF0aW9uX2NvZGUiLCJzY29wZSI6WyJvcGVuaWQiLCJwcm9maWxlIl0sImF1dGhfdGltZSI6MTU5MzMzMTU3OCwicmVhbG0iOiIvdHNlbC9ieXUvd2ViIiwiZXhwIjoxNTkzOTM2Mzc5LCJpYXQiOjE1OTMzMzE1NzksImV4cGlyZXNfaW4iOjYwNDgwMCwianRpIjoiWW9KdTNvbHBCVzFBYk5UY2NPZWFCcUxra1M0LkV6YjJKX1B0NkJ6LXIzbHR4Z1UtbjlQVkRocyJ9.vcR14N6NM3WchSl_B9ypdz9MXEtsJtuaWPHsvzb9RLilbqCVhKsvZ5mPm13w78XCiosQ3Xds7g8INh6zIqOH-hfXTLIGQuurjCCfgZmE6yAQXKnoyt_2pmvHQn0X5iIH-Qqz8Olvdgc4BlRuJfopP53DlwYtDHoxawtmvDVZzIWFbXKfvcXWoEyG9Auyo0ZdJfGFelvFSJAm7CmLNPqv76LFC5Exjqn779q8j17EkIcw5Vr0VmC2LlEVG59t8MWxQ-KG5VQmLNrEeGD6ZezFxS0luliyIiQ2wLZmHPelt3aZVbwe9qWtAUmz6yncLcxY9-FT_2sVo2TfCQsbRquGUA\\"}","userCiamReducer":"{\\"authId\\":\\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ3aGl0ZWxpc3Qtc3RhdGUiOiIwMzRkNGUxYS0xOWI1LTRlYjgtODVhOS1mNWZlZGQ2ZGMzNDUiLCJhdXRoSW5kZXhWYWx1ZSI6Imdvb2dsZSIsIm90ayI6ImRvOWZvaGx1YnNzcmhzcGxvZTZpYTZrY2xkIiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii90c2VsL2J5dS93ZWIiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRFFBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ETS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVKWkROVGIyRjRSa1p4WVRBdGRGTnJTazQzYjJkbkxrZFJRMGMyZDBkUlNURkVkemxwUlV0SGFXbFdSa2hoVUd0MmVtTm5kSHAxWjA1cFZuUk1iWGgxY1dkbWN6bHVVbXhyVVUxSFVIVjNOM2d6TjJWeVpWZHBkVzlYU2pWSldsQldSVFZRWkdkQlpscDRWRXBLYTNGZmNFSlpZbUpyY2w5NGNGaGxWVlE1WW10WGEyRkZjRFJOWkd0RmFGaDRiMjlKTkU1VFFqa3RURE5yVmtkNFIxaHBObVYyUlZCYVRFY3lNbEJWVFc5S05HTmhUVjlOUkdRelQybGZWMlZqVVZJdGRrOW1RMFpZV1drMk0xb3djSFpWTlVGUVNYVllObTl4WVZwek0xOWtPRGhSUVZaaWFHb3piVXBUVkdsMlR6Qk1WbGs0YkdkaFp6aDNhM1psYzBKdWN5MXZPWE5uYjNCVlh6RkxTazlwU1RGUVZVSTFiRGRZVTNaMWVqUnlTVkJVTFRNMFgzRkhaRFYxVDNKVlZIWmxkMll0TUVkZlFsTkdWMVozYzNCWllUWlhhWGM0VjNsTGMzRnBkbU5hWlUxeFpteFBPREZzUTJsRlRWODNSbkpZT0cxRlNHZE5NakZGT1ZRMllqSk1TMUpNWVVsME9HbzBNelV5ZURoaVVVRTNXVjlGUjJObGVWVnZTRE5qV0RsWFNqWkZNVUpoTVhCV04yZEpSRlZuY0hkeVUwbFVRbEV4U0VwTk1FMWtRVTlSWW1RM1pXczVjVVp3TFhWM1dIZHFWMWhoTXpGRUxYVkhPVk5IZVhKT1Z5MXVPR0ZzUVRSME9HdE9PVlZZU2xGNUxXUTJMVmRtYjFKcFJGcFNOMXBuY0RkUE5YcGZUMjR4Um5SVWFtRkNlSFowYUc5MlRsRkJkMk5hWWxwblpqTm9USGRsUjFGcGRuTlVkWFJNTXpkU1V6TkVTRUpCU1dnM2VtOUNiV1ZuV1RsZlRWazVOVWxhVEdFeWVqRlRkVnBWWjJsNlgyVlJTVTVNWW1sM09XRTVTVlZWZW1acWJGZzRhbGQ1ZEc5ZlltdFdVamxzZDAxV2JHRm5NVlYwYWtKcVRrcG5Wemd3VDBVMFdXVkpUSFJVT0dWcmQyNWtWa0oyT0ZCTU1rWnVhMDlZWmxZNVUyeE5hWE5oY2trNE1VbFlhWFp6TjNSdlYyZEJka1phYzBSZk1Va3RjazVRUVhaZlp6RlRaVTVCWjBscWJFdzJkM2xuY2toamRIaEVNSEp0TUhjeFNEVjRaRE5NYjNoR1VWOHpVMWROTTNGRWMxQjBWbVZPYVVaS09YZHZTR2N0YTFGa1ZtZHFVMmQwWjFobExUVXdkblZpYlc5dlUxVlFSVWxRWldaRmJXMHlkMnBKVkdkV1RGZE5NbFJaZGpGVk1FMTNNMWszY21SbVJtbFVaVXh5V1c5cGRtYzNYM1pmVTBST2NGbHBTR2RVVTI5Vk9UVlFUbFZXTTBwUlpsQmtWa2hOZWpORFMyd3lPVGMwTm5WS01IUjRkMGx0UlU5SlMxRTBOR2MwUkhOUU56aHlUbkl3U1hSWE5FeG9NVW8xWW5wcVJucGpXbTFZV0RoWFpXMWFTRUpzWDBGYWJVWk5VREE0YUZneFFrczBkbk5WV0haVE56VXlhRGRIU1hsTk5tNVJja1JwZGpkS1RsVnFWRVpRYVdNeU1WOXpTemQ0WWpOdlkycHZXV2QyUzFGSWRUaE9kekYyU1hweE0yZFBXRU4wVm5CSmNrNHhUM1o2TlRSSWJWbFpWa05oVG00eWVFbzFMVTV0U2pOM2NFeE9WRkZrYkdod2RteHNjRUYwZDFadVptcDZTbEJPUVdsQ05IRnlaVmhEV0RsRFJEUkJMbk16YkZweFNWUnJTMmhOZEZJdFVEbEtjRnBYYWxFLllld0U0Tk51bXBKalhNdm5EZXdBTk5YYXZXZWZLZHNIY1NuMWtLRGR1eFkiLCJleHAiOjE1OTMzMzE4NjgsImlhdCI6MTU5MzMzMTU2OH0.gvNDw_ZBMun2q_viYMCuIW5ij26m5gAMJdglYRmOZ2w\\",\\"profile\\":null,\\"provider\\":\\"google\\"}","flow":"{\\"selectPackage\\":{\\"id\\":\\"10290\\",\\"title\\":\\"paket Yang Bikin Deket 10 GB\\",\\"title_en\\":\\"Get Closer\\",\\"title_id\\":\\"Yang Bikin Deket\\",\\"description\\":\\"Data_10GB_1days_Rp10000\\",\\"description_en\\":\\"No restriction on certain apps/ network/location\\",\\"description_id\\":\\"Kuota gak dibagi-bagi aturan aplikasi/jaringan/wilayah tertentu\\",\\"product_id\\":\\"3\\",\\"desc\\":\\"Data_10GB_1days_Rp10000\\",\\"data_quota\\":10,\\"sms_quota\\":0,\\"voice_quota\\":0,\\"validity\\":1,\\"price\\":10000,\\"image\\":\\"https://www.byu.id/sites/default/files/bikin%20deket_7.png\\",\\"order_by\\":5,\\"is_active\\":\\"true\\",\\"field_image_package_d_large\\":\\"https://www.byu.id/sites/default/files/bikin%20deket_2.svg\\",\\"field_image_package_d_small\\":\\"https://www.byu.id\\",\\"field_image_package_m_large\\":\\"https://www.byu.id\\",\\"field_image_package_m_small\\":\\"https://www.byu.id\\",\\"image_mobile_large\\":\\"https://www.byu.id/sites/default/files/bikin%20deket_8.png\\",\\"image_mobile_small\\":\\"https://www.byu.id/sites/default/files/bikin%20deket-expand1x_1.png\\",\\"ijoin\\":\\"true\\",\\"irenew\\":\\"true\\",\\"is_special_package\\":\\"true\\",\\"is_unlimited\\":0,\\"notes\\":\\"\\",\\"package_subtitle_id\\":\\"Masa Berlaku 1x24 Jam\\",\\"package_subtitle_en\\":\\"Valid for 1x24 hours\\",\\"popup\\":{\\"title_id\\":\\"\\",\\"desc_id\\":\\"\\",\\"title_en\\":\\"\\",\\"desc_en\\":\\"\\"},\\"type\\":\\"package\\"},\\"onlySelectNumber\\":false,\\"purchasecreditSelectedId\\":null,\\"purchasecreditSelectedValue\\":null,\\"addonSelectedId\\":[],\\"nextNumberRequest\\":1593332815768,\\"numberStorage\\":null,\\"lockNumber\\":false,\\"numberSelectedId\\":null,\\"formData\\":{\\"userLocation\\":{}},\\"order\\":{},\\"onEditAdress\\":false,\\"courierSelected\\":{},\\"courier\\":[],\\"selectedVoucher\\":{},\\"fromLogin\\":1,\\"purchasecreditSelected\\":null,\\"nextPage\\":\\"/id/ijoin/choose-number\\",\\"loginFrom\\":\\"/id/ijoin/choose-addons\\",\\"numberSelected\\":null,\\"chooseNumberFlow\\":{\\"created_at\\":1593332515,\\"numberStorage\\":[{\\"id\\":\\"1593139\\",\\"msisdn\\":\\"6285156939481\\",\\"display_msisdn\\":\\"085156939481\\",\\"isActive\\":false},{\\"id\\":\\"1597767\\",\\"msisdn\\":\\"6285156942935\\",\\"display_msisdn\\":\\"085156942935\\",\\"isActive\\":false},{\\"id\\":\\"1597997\\",\\"msisdn\\":\\"6285156943093\\",\\"display_msisdn\\":\\"085156943093\\",\\"isActive\\":false},{\\"id\\":\\"1599155\\",\\"msisdn\\":\\"6285156943932\\",\\"display_msisdn\\":\\"085156943932\\",\\"isActive\\":false},{\\"id\\":\\"1599165\\",\\"msisdn\\":\\"6285156943938\\",\\"display_msisdn\\":\\"085156943938\\",\\"isActive\\":false}],\\"session_id\\":\\"SA-5EF8532391930\\",\\"now\\":1593332515,\\"timer\\":300,\\"nextNumberRequest\\":1593332815768,\\"lockNumber\\":false,\\"numberSelected\\":null,\\"numberSelectedId\\":null}}","packageByo":"{\\"packageByoHttp\\":{\\"isLoading\\":false,\\"timestamp\\":null,\\"status\\":0,\\"message\\":\\"\\",\\"data\\":null},\\"packageByoCms\\":{\\"isLoading\\":false,\\"timestamp\\":null,\\"status\\":0,\\"message\\":\\"\\",\\"data\\":null},\\"packageByoSelection\\":{}}","_persist":"{\\"version\\":-1,\\"rehydrated\\":true}"}');
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
        const [button] = await page.$x(`//button[contains(., '${number}')]`);
        if (button) {
            await button.click()
        }
        await page.screenshot({path: 'example.png'});
        await browser.close();
    })();
}

parsingResponseAndSendData = result => {
    let a = null

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
                    try {
                        buyNumber(a)
                    } catch (e) {
                        
                    }
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

//reload new number very 15-30 second
cron.schedule("15-30 * * * * *", () => {
    fetchDataNumber("?requestNew=1")
});
