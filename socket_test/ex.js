import io from "socket.io-client"

const socket = io("http://localhost:3000");

// Số tiến trình trong hệ thống (N)
const TOTAL_PROCESSES = 2;

// Lamport Clock và trạng thái tiến trình
let lamportClock = 0;
let queue = [];
let requestingCS = false;
let replyCount = 0;
const processId = Math.random().toString(36).substring(7); // ID tiến trình ngẫu nhiên

// Gửi yêu cầu vào Critical Section (CS)
function requestCS() {
    lamportClock++;
    requestingCS = true;
    replyCount = 0;

    const requestMessage = {
        type: "REQUEST",
        clock: lamportClock,
        id: processId,
    };

    console.log(`[${processId}] REQUEST sent with Lamport = ${lamportClock}`);
    socket.emit("message", requestMessage);
}
socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
});
// Xử lý tin nhắn từ các tiến trình khác
socket.on("message", (msg) => {
    lamportClock = Math.max(lamportClock, msg.clock) + 1;

    if (msg.type === "REQUEST") {
        handleRequest(msg);
    } else if (msg.type === "REPLY") {
        handleReply();
    } else if (msg.type === "RELEASE") {
        handleRelease(msg);
    }
});

// Xử lý yêu cầu REQUEST
function handleRequest(msg) {
    const isHigherPriority =
        msg.clock < lamportClock || (msg.clock === lamportClock && msg.id < processId);
    // current process is higher priority
    if (requestingCS && !isHigherPriority) {
        console.log(`[${processId}] Delayed REPLY to ${msg.id}`);
        queue.push(msg); // Trì hoãn trả lời
    } else {
        sendReply(msg.id);
    }
}

// Gửi phản hồi REPLY
function sendReply(targetId) {
    const replyMessage = {
        type: "REPLY",
        clock: lamportClock,
        id: processId,
    };

    console.log(`[${processId}] REPLY sent to ${targetId}`);
    socket.emit("message", replyMessage);
}

// Xử lý phản hồi REPLY
function handleReply() {
    replyCount++;

    if (replyCount === TOTAL_PROCESSES - 1) {
        console.log(`[${processId}] Entering CS`);
        setTimeout(exitCS, 2000); // Giả lập xử lý trong CS
    }
}

// Thoát khỏi Critical Section
function exitCS() {
    console.log(`[${processId}] Exiting CS`);
    requestingCS = false;

    const releaseMessage = {
        type: "RELEASE",
        clock: lamportClock,
        id: processId,
    };

    socket.emit("message", releaseMessage);

    // Xử lý các yêu cầu đang chờ
    while (queue.length > 0) {
        const delayedRequest = queue.shift();
        sendReply(delayedRequest.id);
    }
}

// Xử lý RELEASE
function handleRelease(msg) {
    console.log(`[${processId}] RELEASE received from ${msg.id}`);
    lamportClock = Math.max(lamportClock, msg.clock);
}

// Tự động gửi yêu cầu vào CS sau mỗi 10 giây
setInterval(() => {
    requestCS();
}, 10000);
