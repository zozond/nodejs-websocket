const socket = io();
const welcome = document.getElementById("welcome");
const enterRoom = document.getElementById("enter_room");
const room = document.getElementById("room")
const nickname = welcome.querySelector("#nickname");

room.hidden = true;

let roomName = ""
let isSetupNickname = false

const addMessage = (msg) => {
    const ul = room.querySelector("ul");
    const li = document.createElement("li")
    li.innerText = msg;
    ul.appendChild(li)
}

const handleMessageSubmit = (event) => {
    event.preventDefault();
    const input = room.querySelector("#msg input")
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${input.value}`);
        input.value = ""
    });
}

const handleNicknameSubmit = (event) => {
    event.preventDefault();
    const input = document.querySelector("#nickname input")
    console.log(input.value)
    socket.emit("nickname", input.value);
    input.value = ""
    isSetupNickname = true;
}

const showRoom = () => {
    room.hidden = false;
    welcome.hidden = true;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room: ${roomName}`;

    const msgForm = room.querySelector("#msg");
    msgForm.addEventListener("submit", handleMessageSubmit)
}

const handleRoomSubmit = (event) => {
    event.preventDefault();

    if (!isSetupNickname) { alert("Please input your nickname"); return; }

    const input = enterRoom.querySelector("input");
    socket.emit("enter_room", input.value, showRoom)
    roomName = input.value;
    input.value = ""

}

nickname.addEventListener("submit", handleNicknameSubmit)
enterRoom.addEventListener("submit", handleRoomSubmit)

socket.on("welcome", (user, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room: ${roomName} (${newCount})`;

    addMessage(`${user} joined!`);
})

socket.on("bye", (left, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room: ${roomName} (${newCount})`;

    addMessage(`${left} left`);
})

socket.on("new_message", (msg) => {
    addMessage(msg);
})

socket.on("room_change", (rooms) => {
    const roomList = document.getElementById('roomList').querySelector("ul")
    roomList.innerHTML = ""

    if (rooms.length === 0) {
        return;
    }

    rooms.forEach(room => {
        const li = document.createElement('li');
        li.innerText = room
        roomList.append(li)
    })
});