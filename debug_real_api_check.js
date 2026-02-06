const http = require('http');

const KEY = 'e6e5a6b21891f23bcdf5953b54dc89a335ddfff7fbf2be2a335c39c70c0960bb';
// Using the endpoint for "Small and Medium Business Support Policy Information" (1342000)
const BASE_URL = 'http://apis.data.go.kr/1342000/LgrstrBizInfoService/getLgrstrBizInfoList';
const URL = `${BASE_URL}?serviceKey=${encodeURIComponent(KEY)}&pageNo=1&numOfRows=1&resultType=json`;

console.log('--- API Connectivity Test ---');
console.log(`URL: ${URL}`);

const req = http.get(URL, (res) => {
    let rawData = '';
    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        console.log('--- Response Start ---');
        console.log(rawData.substring(0, 500));
        console.log('--- Response End ---');

        if (res.statusCode === 200) {
            if (rawData.trim().startsWith('<')) {
                console.log('RESULT: FAIL - Received XML (Likely Key/Auth Error)');
                if (rawData.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR')) console.log('Reason: Key Not Registered');
                if (rawData.includes('LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR')) console.log('Reason: Quota Exceeded');
            } else {
                try {
                    const json = JSON.parse(rawData);
                    if (json.getLgrstrBizInfoList) {
                        console.log('RESULT: SUCCESS - Valid JSON Data Received');
                    } else {
                        console.log('RESULT: FAIL - JSON Received but missing expected data structure');
                    }
                } catch (e) {
                    console.log('RESULT: FAIL - Invalid JSON');
                }
            }
        } else {
            console.log(`RESULT: FAIL - HTTP Error ${res.statusCode}`);
        }
    });
});

req.on('error', (e) => {
    console.error(`Network Error: ${e.message}`);
});

req.end();
