import * as net from "net";
import * as os from "os";
console.log(process.env.LOCALAPPDATA);
//const server = net.createServer((socket) => {
//    console.log("Client connected");

//    socket.on("data", (data) => {
//        console.log("Received:", data);
//        socket.write(Buffer.from("Hello Client")); // Send response
//    });

//    socket.on("close", () => console.log("Client disconnected"));
//    socket.on("error", (err) => console.error("Socket error:", err));
//});

//server.listen(8080, () => console.log("Server listening on port 8080"));
