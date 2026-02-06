const https = require('https');

const url = "https://apis.data.go.kr/1160100/service/GetKStartupService/getStartupSupport?serviceKey=e6e5a6b21891f23bcdf5953b54dc89a335ddfff7fbf2be2a335c39c70c0960bb&resultType=json&numOfRows=1&pageNo=1";

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(data);
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
