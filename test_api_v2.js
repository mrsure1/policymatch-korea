const http = require('http');

// Corrected URL based on search results
const url = "http://apis.data.go.kr/B552735/kisedKstartupService01/getBizNoticeList?serviceKey=e6e5a6b21891f23bcdf5953b54dc89a335ddfff7fbf2be2a335c39c70c0960bb&pageNo=1&numOfRows=1&returnType=json";

console.log("Fetching from: " + url);

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log("Response:");
        console.log(data);
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
