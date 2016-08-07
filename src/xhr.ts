export default function (url: string, success: (data: string) => void, method = "GET") {
    let xhr = new XMLHttpRequest();
    xhr.onload = function () {
        success(this.responseText);
    }
    xhr.onerror = function (error) {
        console.error(error);
    };
    xhr.open(method, url, true);
    xhr.send();
}
