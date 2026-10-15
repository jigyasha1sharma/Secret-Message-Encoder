const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const method = document.getElementById("method");
const shiftValue = document.getElementById("shiftValue");

const encodeBtn = document.getElementById("encodeBtn");
const decodeBtn = document.getElementById("decodeBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const shiftGroup = document.getElementById("shiftGroup");
const inputError = document.getElementById("inputError");
const resultMessage = document.getElementById("resultMessage");
const historyList = document.getElementById("historyList");

let history = [];

try {
    const savedHistory = JSON.parse(
        localStorage.getItem("secretMessageHistory")
    );

    history = Array.isArray(savedHistory) ? savedHistory : [];
} catch {
    history = [];
}

function updateMethod() {
    shiftGroup.style.display =
        method.value === "caesar" ? "flex" : "none";
}

method.addEventListener("change", updateMethod);

function caesarCipher(text, shift, decode = false) {
    if (decode) {
        shift = -shift;
    }

    return text.replace(/[a-z]/gi, character => {
        const base = character === character.toUpperCase() ? 65 : 97;

        return String.fromCharCode(
            ((character.charCodeAt(0) - base + shift + 26) % 26) + base
        );
    });
}

function textToBinary(text) {
    const bytes = new TextEncoder().encode(text);

    return Array.from(bytes)
        .map(byte => byte.toString(2).padStart(8, "0"))
        .join(" ");
}

function binaryToText(binary) {
    const cleaned = binary.trim();

    if (cleaned === "") {
        return "";
    }

    const parts = cleaned.split(/\s+/);

    if (!parts.every(part => /^[01]{8}$/.test(part))) {
        throw new Error(
            "Binary must contain groups of 8 bits separated by spaces."
        );
    }

    const bytes = new Uint8Array(
        parts.map(part => parseInt(part, 2))
    );

    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function encodeBase64(text) {
    const bytes = new TextEncoder().encode(text);

    let binary = "";

    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary);
}

function decodeBase64(text) {
    const cleaned = text.trim();

    if (
        cleaned === "" ||
        cleaned.length % 4 !== 0 ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(cleaned)
    ) {
        throw new Error("Please enter valid Base64 text.");
    }

    const binary = atob(cleaned);

    const bytes = Uint8Array.from(
        binary,
        character => character.charCodeAt(0)
    );

    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function reverseText(text) {
    return Array.from(text).reverse().join("");
}

function convertText(decode = false) {
    const text = inputText.value;

    inputError.textContent = "";
    resultMessage.textContent = "";

    if (text.trim() === "") {
        inputError.textContent = "Please enter a message first.";
        outputText.value = "";
        return;
    }

    try {
        let result = "";

        switch (method.value) {
            case "caesar": {
                const shift = Number(shiftValue.value);

                if (
                    shiftValue.value.trim() === "" ||
                    !Number.isInteger(shift) ||
                    shift < 0 ||
                    shift > 25
                ) {
                    throw new Error(
                        "Shift value must be between 0 and 25."
                    );
                }

                result = caesarCipher(text, shift, decode);
                break;
            }

            case "binary":
                result = decode
                    ? binaryToText(text)
                    : textToBinary(text);
                break;

            case "base64":
                result = decode
                    ? decodeBase64(text)
                    : encodeBase64(text);
                break;

            case "reverse":
                result = reverseText(text);
                break;

            default:
                throw new Error("Please select a valid method.");
        }

        outputText.value = result;

        resultMessage.textContent = decode
            ? "Message decoded successfully."
            : "Message encoded successfully.";

        addToHistory({
            method: method.value,
            action: decode ? "Decode" : "Encode",
            input: text,
            output: result,
            date: new Date().toLocaleString()
        });

    } catch (error) {
        outputText.value = "";
        inputError.textContent = error.message;
    }
}

encodeBtn.addEventListener("click", () => {
    convertText(false);
});

decodeBtn.addEventListener("click", () => {
    convertText(true);
});

clearBtn.addEventListener("click", () => {
    inputText.value = "";
    outputText.value = "";

    inputError.textContent = "";
    resultMessage.textContent = "";
});

async function copyResult() {
    if (outputText.value === "") {
        resultMessage.textContent = "Nothing to copy.";
        return;
    }

    try {
        await navigator.clipboard.writeText(outputText.value);
        resultMessage.textContent = "Copied to clipboard!";
    } catch {
        outputText.focus();
        outputText.select();

        const copied = document.execCommand("copy");

        resultMessage.textContent = copied
            ? "Copied to clipboard!"
            : "Copy failed. Please copy the result manually.";

        outputText.setSelectionRange(0, 0);
    }
}

copyBtn.addEventListener("click", copyResult);

function addToHistory(entry) {
    history.unshift(entry);
    history = history.slice(0, 10);

    localStorage.setItem(
        "secretMessageHistory",
        JSON.stringify(history)
    );

    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = "";

    if (history.length === 0) {
        const item = document.createElement("li");

        item.className = "empty-message";
        item.textContent = "No conversions yet.";

        historyList.appendChild(item);
        return;
    }

    history.forEach(entry => {
        const item = document.createElement("li");

        const heading = document.createElement("strong");
        heading.textContent =
            `${entry.action} · ${entry.method.toUpperCase()}`;

        const date = document.createElement("p");
        date.textContent = entry.date;

        const preview = document.createElement("p");
        preview.textContent =
            `${entry.input.slice(0, 60)}${entry.input.length > 60 ? "..." : ""}`;

        item.append(heading, date, preview);

        historyList.appendChild(item);
    });
}

clearHistoryBtn.addEventListener("click", () => {
    history = [];

    localStorage.removeItem("secretMessageHistory");

    renderHistory();
});

updateMethod();
renderHistory();