export default class Hp {
    private max: number;
    private current: number;

    constructor(private selector: string) { }

    public set(hp: number) {
        this.current = this.max = hp;
        this.update();
    }

    public dec(dmg: number) {
        this.current = Math.max(0, this.current - dmg);
        this.update();
    }

    public dead(): boolean {
        return this.current <= 0;
    }

    private update() {
        let hpBar = document.getElementById(this.selector);
        let current = hpBar.getElementsByTagName("div")[0];
        current.style.width = this.current / this.max * 100 + "%";
        let text = hpBar.getElementsByTagName("span")[0];
        text.textContent = this.current + " / " + this.max;
    }

}
