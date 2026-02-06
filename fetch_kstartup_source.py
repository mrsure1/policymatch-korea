import requests

url = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}
response = requests.get(url, headers=headers)
with open('temp_kstartup.html', 'w', encoding='utf-8') as f:
    f.write(response.text)
print("Fetched temp_kstartup.html")
