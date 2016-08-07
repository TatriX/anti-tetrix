export default {
    set: function (key: string, value: any) {
        localStorage.setItem("anti-tetrix." + key, JSON.stringify(value));
    },
    get: function (key: string) {
        let value = localStorage.getItem("anti-tetrix." + key);
        return value && JSON.parse(value);
    },
}
