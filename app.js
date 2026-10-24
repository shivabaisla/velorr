
const messages = document.getElementById("messages");
const input = document.getElementById("messageInput");
const form = document.getElementById("chatForm");
const chatName = document.getElementById("chatName");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = input.value.trim();
  if (!value) return;

  const bubble = document.createElement("p");
  bubble.className = "bubble";
  bubble.textContent = value;
  messages.appendChild(bubble);
  input.value = "";
  messages.scrollTop = messages.scrollHeight;
});

document.getElementById("servers").addEventListener("click", (event) => {
  const button = event.target.closest(".server");
  if (!button) return;

  document.querySelectorAll(".server").forEach((item) => {
    item.classList.toggle("active", item === button);
  });
  chatName.textContent = button.querySelector("b").textContent;
});

document.getElementById("search").addEventListener("input", (event) => {
  const query = event.target.value.toLowerCase();
  document.querySelectorAll(".server").forEach((server) => {
    server.hidden = !server.textContent.toLowerCase().includes(query);
  });
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("selected", item === button);
    });
    if (button.dataset.page !== "Home") {
      alert(button.dataset.page + " will be added in the next version!");
    }
  });
});

document.getElementById("addServer").addEventListener("click", () => {
  const name = prompt("Enter your community name:");
  if (!name || !name.trim()) return;

  const server = document.createElement("button");
  server.className = "server";
  server.dataset.name = name.trim();

  const icon = document.createElement("span");
  icon.className = "server-icon purple";
  icon.textContent = name.trim().charAt(0).toUpperCase();

  const details = document.createElement("span");
  const title = document.createElement("b");
  title.textContent = name.trim();
  const subtitle = document.createElement("small");
  subtitle.textContent = "New community";
  details.append(title, subtitle);
  server.append(icon, details);

  document.getElementById("servers").appendChild(server);
  server.click();
});
