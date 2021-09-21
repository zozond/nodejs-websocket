import express from "express";
import http from "http"
import { Server } from "socket.io"
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug")
app.set("views", __dirname + "/views")

app.use("/public", express.static(__dirname + "/public"))

app.get("/", (req, res) => {
    res.render("home")
});

app.get("/*", (req, res) => {
    res.redirect("/")
});

const handleListen = () => console.log(`Listening on http://localhost:3000`)

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
    }
});
instrument(wsServer, {
    auth: false
})

const publicRooms = () => {
    const { sockets: { adapter: { sids, rooms } } } = wsServer;

    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) == undefined) {
            publicRooms.push(key);
        }
    })
    return publicRooms;
}

const countRoom = (roomName) => {
    return wsServer.sockets.adapter.rooms.get(roomName)?.size
}

wsServer.on("connection", (socket) => {
    socket["nickname"] = "Anonymous"

    socket.onAny(event => {
        console.log(`Socket Event: ${event}`)
        console.log(wsServer.sockets.adapter);
    })

    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName)
        done();
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName))
        wsServer.sockets.emit("room_change", publicRooms());
    })

    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => {
            socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1);
        });
    })

    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms())
    })

    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    })

    socket.on("nickname", (nickname) => {
        socket["nickname"] = nickname
    })
})

// wss.on("connection", (socket) => {
//     socket["nickname"] = Math.random().toString(36).substr(2, 22);
//     sockets.push(socket);

//     console.log(`connected to browser ✔`)

//     socket.on("close", () => {
//         console.log("disconnected from the browser ❌")
//     })

//     socket.on("message", (msg) => {
//         const message = JSON.parse(msg.toString('utf-8'))

//         switch (message.type) {
//             case "new_message":
//                 sockets.forEach(aSocket => {
//                     if (socket !== aSocket) {
//                         aSocket.send(`${socket["nickname"]}: ${message.payload}`)
//                     }
//                 })
//                 break;
//             case "nickname":
//                 socket["nickname"] = message.payload
//                 break;
//         }
//     })

//     socket.send("hello!!");
// })

httpServer.listen(3000, handleListen)
// app.listen(3000, handleListen);