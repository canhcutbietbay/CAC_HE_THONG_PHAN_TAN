import io from "socket.io-client"

(async () => {
    const socket = io("http://localhost:3000");
    socket.on("dashboard", (data) => {
        console.log(data[0][1].queue);
        console.log("-------------------")
    })
})()