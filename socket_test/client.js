import io from "socket.io-client"

(async () => {
    const socket = io("http://localhost:3000");
    const group_id = '674817d4ff55e5ffe142729b'
    let roomUsers = []
    let processID = 0;
    let socketID = ""
    let userEmail = ""
    // Số tiến trình trong hệ thống (N)
    let TOTAL_PROCESSES = roomUsers.length;
    // Lamport Clock và trạng thái tiến trình
    let lamportClock = 0;
    let temp_lamportClock = 0;
    let queue = [];
    let requestingCS = false;
    let inCS = false
    let replyCount = 0;
    let waitingQueue = []

    function requestCS() {
        temp_lamportClock = lamportClock
        lamportClock++;
        requestingCS = true;
        replyCount = 0;
        inCS = false
        waitingQueue = roomUsers
        waitingQueue = waitingQueue.filter(user => user.socketID != socketID)

        const requestMessage = {
            type: "REQUEST",
            clock: lamportClock,
            id: processID,
            group_id: group_id,
            from: socketID,
            fromUser: userEmail
        };

        console.log(`[${processID}] REQUEST sent with Lamport = ${lamportClock}`);
        socket.emit("message", requestMessage)
        if (waitingQueue.length == 0) {
            console.log(`[${processID}] Entering CS`);
            inCS = true
            setTimeout(exitCS, 20000); // Giả lập xử lý trong CS
        }
    }
    // Xử lý yêu cầu REQUEST
    function handleRequest(msg) {
        const isHigherPriority =
            msg.clock < temp_lamportClock || (msg.clock === temp_lamportClock && msg.id < processID);
        // current process is higher priority

        if (inCS || (requestingCS && !isHigherPriority)) {
            console.log(`[${processID}] Delayed REPLY to ${msg.id}`);
            queue.push(msg); // Trì hoãn trả lời
        } else {
            sendReply(msg);
        }
    }

    // Gửi phản hồi REPLY
    function sendReply(msg) {
        const replyMessage = {
            type: "REPLY",
            clock: lamportClock,
            id: processID,
            group_id: group_id,
            from: socketID,
            to: msg.from,
            fromUser: userEmail
        };
        console.log(`[${processID}] REPLY sent to ${msg.id}`);
        socket.emit("message", replyMessage)

    }

    // Xử lý phản hồi REPLY
    function handleReply(msg) {
        replyCount++;
        // handle reply with socketID then update new waiting queue
        waitingQueue = waitingQueue.filter(user => user.socketID != msg.from)
        if (replyCount === TOTAL_PROCESSES - 1) {
            console.log(`[${processID}] Entering CS`);
            inCS = true
            const enterMessage = {
                type: "ENTER",
                clock: lamportClock,
                id: processID,
                group_id: group_id,
                from: socketID,
                fromUser: userEmail
            };
            socket.emit("message", enterMessage);
            setTimeout(exitCS, 20000); // Giả lập xử lý trong CS
        }
    }

    // Thoát khỏi Critical Section
    function exitCS() {
        console.log(`[${processID}] Exiting CS`);
        requestingCS = false;
        inCS = false

        const releaseMessage = {
            type: "RELEASE",
            clock: lamportClock,
            id: processID,
            group_id: group_id,
            from: socketID,
            fromUser: userEmail
        };

        socket.emit("message", releaseMessage);

        // Xử lý các yêu cầu đang chờ
        while (queue.length > 0) {
            const delayedRequest = queue.shift();
            sendReply(delayedRequest);
        }
    }

    // Xử lý RELEASE
    function handleRelease(msg) {
        console.log(`[${processID}] RELEASE received from ${msg.id}`);
        lamportClock = Math.max(lamportClock, msg.clock);
    }
    socket.on("message", (msg) => {
        if (msg.type === "REQUEST") {
            lamportClock = Math.max(lamportClock, msg.clock) + 1;
            handleRequest(msg);
        } else if (msg.type === "REPLY") {
            handleReply(msg);
        } else if (msg.type === "RELEASE") {
            lamportClock = Math.max(lamportClock, msg.clock) + 1;
            handleRelease(msg);
        }
    });
    socket.emit("joinRoom", { group_id: group_id }, (respone) => {
        socketID = respone.socketID
        processID = parseInt(respone.id)
        lamportClock = processID + 5
        userEmail = respone.user.email
        console.log(socketID, processID, lamportClock)
    })
    socket.on("roomStatus", (data) => {
        roomUsers = data
        TOTAL_PROCESSES = roomUsers.length
    })

    socket.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);
    });
    socket.on("userLeaverRoom", (data) => {
        const pos_room = roomUsers.map(e => e.socketID).indexOf(data);
        roomUsers = roomUsers.filter(user => user.socketID != data)
        TOTAL_PROCESSES = roomUsers.length
        const pos_queue = waitingQueue.map(e => e.socketID).indexOf(data);
        console.log(waitingQueue, replyCount)
        waitingQueue = waitingQueue.filter(user => user.socketID != data)
        if (pos_room != -1 && pos_queue == -1) replyCount = replyCount - 1 // -1 do da reply roi`
        console.log(waitingQueue, replyCount)
        if (!inCS && waitingQueue.length == 0 && requestingCS) { // do remove thang cuoi cung ra khoi queue
            console.log(`[${processID}] Entering CS`);
            inCS = true
            setTimeout(exitCS, 20000); // Giả lập xử lý trong CS
        }
    })
    socket.on("userLeave", (data) => {
        const pos_room = roomUsers.map(e => e.socketID).indexOf(data);
        roomUsers = roomUsers.filter(user => user.socketID != data)
        TOTAL_PROCESSES = roomUsers.length
        const pos_queue = waitingQueue.map(e => e.socketID).indexOf(data);
        waitingQueue = waitingQueue.filter(user => user.socketID != data)
        if (pos_room != -1 && pos_queue == -1) replyCount = replyCount - 1 // -1 do da reply roi`
        if (!inCS && waitingQueue.length == 0 && requestingCS) { // do remove thang cuoi cung ra khoi queue
            console.log(`[${processID}] Entering CS`);
            inCS = true
            setTimeout(exitCS, 20000); // Giả lập xử lý trong CS
        }
    })
    // setTimeout(requestCS, 15000)
})()