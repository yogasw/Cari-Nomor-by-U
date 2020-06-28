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
    result.data.forEach(data => {
        a = checkNumber(data.display_msisdn)
        if (a && checkMessage(a)) {
            if (buy) {
                console.log("masuk")
                console.log("a", a)
                console.log("buy", buy)
                buyNumber(a)
                sendMessage(a)
                buy = false
            }
        }
    })
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
            localStorage.setItem('persist:root', '{"user":"{"isLogin":true,"profile":{"user_id":4430348,"name":"Yoga Setiawan","email":"yogainformatika@gmail.com","birth_date":null,"sub":"100697101602674527414","source":"google-oauth2","language_setting":"id","picture":"https://lh3.googleusercontent.com/a-/AOh14GjSbLChvu6RQNnHX3XPJsBC6jOmkRLR21VmxTtBFw","account_status":"registered","phone":null,"created_at":"2020-06-11T21:56:22.000000Z","referral_code":null,"is_join_inspigo":false,"is_rated":false,"is_request_sim_success":false,"is_request_sim":false,"is_request_sim_approved":"0","is_order_request_sim":false},"lexi":"eyJ0eXAiOiJKV1QiLCJraWQiOiJ3VTNpZklJYUxPVUFSZVJCL0ZHNmVNMVAxUU09IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiI2NzRlMzFhMy0zNzAyLTRhNTEtYmViYy00MTgwZjY0NzczYTgiLCJjdHMiOiJPQVVUSDJfR1JBTlRfU0VUIiwiYXV0aF9sZXZlbCI6MCwiYXVkaXRUcmFja2luZ0lkIjoiNzU2MWI2MmQtMTQ5Yy00NjZkLThlMjUtYWQ4NzRmODMwODM0LTk5MjYyNjQ4NCIsImlzcyI6Imh0dHBzOi8vY2lhbWFtcGFwcGJzZC5jaWFtLnRlbGtvbXNlbC5jb206MTAwMTAvb3BlbmFtL29hdXRoMi90c2VsL2J5dS93ZWIiLCJ0b2tlbk5hbWUiOiJyZWZyZXNoX3Rva2VuIiwidG9rZW5fdHlwZSI6IkJlYXJlciIsImF1dGhHcmFudElkIjoiNHozb1RDMlFub2gxTkNjOE5XcU5QQ2VNelo4LjVFRzhwbUNZcS1BRk1uOFBQZ0ZVVXF0SWd4SSIsImF1ZCI6ImJiZGQyYjBlMDM5YTRmNmM4OGY3OWY5NGIxMGFhMDA5IiwiYWNyIjoiMCIsIm5iZiI6MTU5MzMzNzg2NCwib3BzIjoia1ZmT08ycVJyaTZUMlZGdEYzSzVaM0l5WFMwIiwiZ3JhbnRfdHlwZSI6ImF1dGhvcml6YXRpb25fY29kZSIsInNjb3BlIjpbIm9wZW5pZCIsInByb2ZpbGUiXSwiYXV0aF90aW1lIjoxNTkzMzM3ODYzLCJyZWFsbSI6Ii90c2VsL2J5dS93ZWIiLCJleHAiOjE1OTM5NDI2NjQsImlhdCI6MTU5MzMzNzg2NCwiZXhwaXJlc19pbiI6NjA0ODAwLCJqdGkiOiI0ejNvVEMyUW5vaDFOQ2M4TldxTlBDZU16WjguMFJKS29jd1ZIdWljemQ2UHhXZ1BuaExFOEVJIn0.XVYZjNaWFnuzkvLG83uGEL1PAxqWEXtBxM4QR_Yq1N2D3hQhYIh8OQKNjEEeYP6UcYc9p8mVmu9zVRAH922xcdNGdnFVfe0l_ae-_hlx9SUQ86j4uUh9yhX562YwZ9jl4to-486IHF2H7jFPrjZQ_b8faScSY7Fl1V3xpmfXgh0GWJIbtIlx95MWJw7LEuJgA8fwiTXtqEpQxAFoJXfNKV5XOchxcXGh9sOEfPojme29sb4VaTEEk9q5R-QCAt9AY4mxE0klUeXObTozFz-pvYlxDjXrwcCh3jqlAXTCRAEWJqr1vEjSZV3ACEwurQHzKx-oprJwWPoNOBmo4JjCdg"}","userCiamReducer":"{"authId":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ3aGl0ZWxpc3Qtc3RhdGUiOiJkZTc3YjVjYS01ZDRhLTRmZTEtOWU1ZC0xNjA0OWVkOGM5ZDciLCJhdXRoSW5kZXhWYWx1ZSI6Imdvb2dsZSIsIm90ayI6ImEyM3NvMGxhYXN0dXBkZXByZmI2N3Bzcm4zIiwiYXV0aEluZGV4VHlwZSI6InNlcnZpY2UiLCJyZWFsbSI6Ii90c2VsL2J5dS93ZWIiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRFFBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ESS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTQwZEdoaU1qTnFUblppVjFneVRtODBZVUZrYTNsbkxqTTRTMHAwUms1UU1rdE9XRVZETmpsRlpteFhlVXBwTFVGWFlYaHBVbXcyWjFvMlJYQTRSM1ZVTTB4eGFVdzNaa2t5VFhRelZtdFZSa2xzTlhwWVUwcE5VbmRWVTBsVVgyMUJkMDFCYVhsTVRFZDVZMjF4ZVZJeVZsRlhTRTlTTWpSdU1VbHljRlJrTUVaSVl6ZzVTRTVMUVRWc2JYRXlXVFZZUlVaUVRsOXRPRXRuTjNObGVHNXhOMUZFWTFVek4weE5URXB3TTFkWFRuSkRZbWh6TURSTWJFSnpOVXBCV0VGalJGSkNXVmN0ZG5rd1pXZ3dia1oyVkVWV1NXcFlWa2t5WkdWaWFYbHNkVVZtWlVkcU5VMXZjM05tVWpoTlRXVk5iVkZsUWtsZlYwcGplRUl0TWxkck5XZFJkMkpWTVhob1Fqa3hUelZzYkhSUWNEbDZPVEJRWVVWVGFFWnBkblU0UVhoYU1VbEdkbVJrZWtGVloyTkZNMnMxYVMxNFRVbERPRWRCV1V0Rk5UWk1RVU5vTmt0dlNuQmxNakV0WjFsbk1ucFVVRUZrYW5GUVdGZ3RZMmRIYkZoUFZXRnZWM1pCTW5BeFJFVk1VR1Z5WkZWdmNXNVVRa1pQUVUwNFNtTmpTakpHTVUwMGIwcGtVMnRDYkU1WlVEazNZMWhVWkVWMVdVSm5SbHBtVW01b1Z6UlVkV1JQVjJSWk5qWkJVVmhMTW0wMmVGVnRabXhKVW1Ob01uZEpkbmt6ZEV4blNIUldRMWQ0V0ZVemRtWkhTVjlXUm5CMVdVcHhjVFJuTlhWQ2FrUlFWVXh4TTI1V1MyUm9OemgyUVRsWVpFYzNRbHBSUXpCRWNIZElVSG80ZEZoTlVqZDJiMUZ1YVU4NFpsSkJOREJrZEROU1JEWjNha1JFU1d0blpGOVdRVVp0UjI1U1oxOU1aVlZIVnpCMVdFSmFSVE5GVFUxcFIwWXdhWFIwWDBreFRGVldlbVJUVWxjMFdYcHVRWGMxTFhKdlMzTlhWVVIxVEdKMFJsaFhhVGRRU0hGS1NEWnZMVzExU0U1aloxa3phR0ZNWlUwMmJtVm9WSGwxY0ZOd2FYVmhkRWx1TTJreFgzZE9lazVuY1c1VE1XeGlNR2hPVkRGdFIyeGpZbU5yT0dkcFdESmhVSE5FVjE5T1lsOXZNM1l3VW1zMlZXNUpOekk0T1ZkS05XOXdhekJTTFV4Q2FIcEhWVVpwVDJsM00yVXhjRjlUVlhaWVgxWnFNblJ6Y1dwd1pHY3RlamhUUjBKbmRXTlFkVFZvY2pOT1dWOXhWbTlOVjFoUWJYZzVVMkZ1YkZCcVZIQm9aRUZoU0hkalZtdDRRME13VVV0d1h6QXhTMmhRTlZNMmIxWjNlbTlsZW1KUlRXWlFZM3BWU1dSTWVtNURReTFsWVhCRmRHaFRhV3RRVFY5Sk1HNHdhSE5DU25KNVVFMHdablIzVEU0MFpHWm5OVGd4ZWpKeE5FZzBYMmR5ZFhSZlNFMXVSVFJOV0ZWdVpFMU9iMFJsTWpSVU0wMXpTMGx3WkhwT1QwUlJiamRsYVMweVVYQmxjM1ZsYW5SMFEwaDJZM1JTVUd0cmVFbzRabUZKT1d0V2FIUmZjRzlKUW10SFkybFJPRVJrV1RoV05YTlZXa2RqV1ZSUGVqSndSMHhFYVhoeVRrMW9hRUk1V0ZCNFJISmthbDk0ZEdsSVlVNVhWR1J4V1hWS2VrcFZRbEpJTWxVemFHWkdTMEk0ZG04elpqWldVMU5XZUZocE5qQTJNV1ppWlZoekxVVklOV2RvU0RaaVJIbFpjVlZKWkhOd1F6bGxkVXQzV0Y5TE9HTjNMbFo2V0RadFEwVkRlbVpqWkU1ellVVnhNMEY2WkZFLjctdUZSZ2JXQW91OTdzWXVlZ1F3SVNBUVZIelpJVXRCRG9NU3R5LWZOcHMiLCJleHAiOjE1OTMzMzgxNTAsImlhdCI6MTU5MzMzNzg1MH0.AtxkZRG00w-r-RjhkVrm_l4XbBa8Cim0RI396fx-dTk","profile":null,"provider":"google"}","flow":"{"selectPackage":{"id":"10290","title":"paket Yang Bikin Deket 10 GB","title_en":"Get Closer","title_id":"Yang Bikin Deket","description":"Data_10GB_1days_Rp10000","description_en":"No restriction on certain apps/ network/location","description_id":"Kuota gak dibagi-bagi aturan aplikasi/jaringan/wilayah tertentu","product_id":"3","desc":"Data_10GB_1days_Rp10000","data_quota":10,"sms_quota":0,"voice_quota":0,"validity":1,"price":10000,"image":"https://www.byu.id/sites/default/files/bikin%20deket_7.png","order_by":5,"is_active":"true","field_image_package_d_large":"https://www.byu.id/sites/default/files/bikin%20deket_2.svg","field_image_package_d_small":"https://www.byu.id","field_image_package_m_large":"https://www.byu.id","field_image_package_m_small":"https://www.byu.id","image_mobile_large":"https://www.byu.id/sites/default/files/bikin%20deket_8.png","image_mobile_small":"https://www.byu.id/sites/default/files/bikin%20deket-expand1x_1.png","ijoin":"true","irenew":"true","is_special_package":"true","is_unlimited":0,"notes":"","package_subtitle_id":"Masa Berlaku 1x24 Jam","package_subtitle_en":"Valid for 1x24 hours","popup":{"title_id":"","desc_id":"","title_en":"","desc_en":""},"type":"package"},"onlySelectNumber":false,"purchasecreditSelectedId":null,"purchasecreditSelectedValue":null,"addonSelectedId":[],"nextNumberRequest":1593338336278,"numberStorage":null,"lockNumber":false,"numberSelectedId":null,"formData":{"userLocation":{}},"order":{},"onEditAdress":false,"courierSelected":{},"courier":[],"selectedVoucher":{},"fromLogin":0,"nextPage":"/profile","loginFrom":"/","numberSelected":null,"chooseNumberFlow":{"created_at":1593338002,"numberStorage":[{"id":"1600847","msisdn":"6285156946213","display_msisdn":"085156946213","isActive":false},{"id":"1600857","msisdn":"6285156946218","display_msisdn":"085156946218","isActive":false},{"id":"1600883","msisdn":"6285156946243","display_msisdn":"085156946243","isActive":false},{"id":"1600967","msisdn":"6285156946290","display_msisdn":"085156946290","isActive":false},{"id":"1602917","msisdn":"6285156947625","display_msisdn":"085156947625","isActive":false}],"session_id":"SA-5EF8689239196","now":1593338036,"timer":266,"nextNumberRequest":1593338336278,"lockNumber":false,"numberSelected":null,"numberSelectedId":null}}","packageByo":"{"packageByoHttp":{"isLoading":false,"timestamp":null,"status":0,"message":"","data":null},"packageByoCms":{"isLoading":false,"timestamp":null,"status":0,"message":"","data":null},"packageByoSelection":{}}","_persist":"{"version":-1,"rehydrated":true}"}')
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

sendMessage = number => {
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

            let message = {
                "Target": process.env.TARGET_WA,
                "Message": `Dapat Nomor by.U bagus nih ${number}`,
                "Image": ""
            }
            channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
            console.log(" [x] Sent %s", JSON.stringify(message));
            setTimeout(function () {
                connection.close();
                //process.exit(0);
            }, 500);
        })
    })
}
