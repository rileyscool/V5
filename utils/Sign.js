class SignClass {
    setLine(line, text) {
        const i = Number(line) - 1;
        if (!Number.isFinite(i) || Math.floor(i) !== i || i < 0 || i > 3) return;

        Client.setSignLine(i, String(text == null ? '' : text));
    }
}

export const Sign = new SignClass();
