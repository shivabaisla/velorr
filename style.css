
const $ = (selector) => document.querySelector(selector);

const serversElement = $("#servers");
const channelsElement = $("#channels");
const messagesElement = $("#messages");
const messageInput = $("#messageInput");
const chatForm = $("#chatForm");
const chatName = $("#chatName");
const searchInput = $("#search");
const toastElement = $("#toast");

const STORAGE_KEY = "velorr_local_v1";

function makeId() {
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8);
}

function makeChannel(name = "general") {
  return {
    id: makeId(),
    name,
    messages: []
  };
}

function makeServer(name, channels = ["general"]) {
  return {
    id: makeId(),
    name,
    channels: channels.map(makeChannel)
  };
}

function initialData() {
  const lounge = makeServer("Velorr Lounge", [
    "general", "announcements"
  ]);
  const gaming = makeServer("Gaming Hub", [
    "general", "looking-for-group"
  ]);
  const friends = makeServer("Friends Zone", [
    "general"
  ]);

  return {
    servers: [lounge, gaming, friends],
    selectedServerId: lounge.id,
    selectedChannelId: lounge.channels[0].id
  };
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);

      if (Array.isArray(data.servers) && data.servers.length) {
        data.servers.forEach(server => {
          if (!Array.isArray(server.channels)) server.channels = [];
        });
        return data;
      }
    }
  } catch (error) {
    console.warn("VELORR data could not be loaded.", error);
  }

  return initialData();
}

let state = loadData();

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    showToast("Could not save data in this browser.");
  }
}

function getServer() {
  return state.servers.find(
    server => server.id === state.selectedServerId
  ) || state.servers[0];
}

function getChannel() {
  const server = getServer();
  if (!server) return null;

  return server.channels.find(
    channel => channel.id === state.selectedChannelId
  ) || server.channels[0] || null;
}

function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toastElement.classList.remove("show");
  }, 2400);
}

function escapeText(value) {
  return String(value);
}

function selectServer(serverId) {
  state.selectedServerId = serverId;

  const server = getServer();
  if (!server) return;

  if (!server.channels.length) {
    server.channels.push(makeChannel());
  }

  state.selectedChannelId = server.channels[0].id;
  saveData();
  render();
}

function selectChannel(channelId) {
  state.selectedChannelId = channelId;
  saveData();
  render();
}

function renderServers(query = "") {
  serversElement.replaceChildren();

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = state.servers.filter(server => {
    const serverMatches = server.name.toLowerCase()
      .includes(normalizedQuery);
    const channelMatches = server.channels.some(channel =>
      channel.name.toLowerCase().includes(normalizedQuery)
    );

    return !normalizedQuery || serverMatches || channelMatches;
  });

  $("#emptyServers").hidden = filtered.length !== 0;

  filtered.forEach((server, index) => {
    const button = document.createElement("button");
    button.className = "server";
    button.classList.toggle(
      "active", server.id === state.selectedServerId
    );

    const icon = document.createElement("span");
    icon.className = "server-icon " +
      ["purple", "blue", "pink"][index % 3];
    icon.textContent = server.name.charAt(0).toUpperCase();

    const details = document.createElement("span");
    const title = document.createElement("b");
    title.textContent = server.name;

    const subtitle = document.createElement("small");
    subtitle.textContent =
      `${server.channels.length} channel${server.channels.length === 1 ? "" : "s"}`;

    details.append(title, subtitle);
    button.append(icon, details);

    button.addEventListener("click", () => selectServer(server.id));
    serversElement.append(button);
  });
}

function renderChannels(query = "") {
  channelsElement.replaceChildren();

  const server = getServer();
  $("#emptyChannels").hidden = true;

  if (!server) {
    $("#selectedServerLabel").textContent = "Create a server to begin.";
    $("#channelHeading").textContent = "Channels";
    $("#emptyChannels").hidden = false;
    return;
  }

  $("#selectedServerLabel").textContent = server.name;
  $("#channelHeading").textContent = "Channels";

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = server.channels.filter(channel =>
    !normalizedQuery ||
    channel.name.toLowerCase().includes(normalizedQuery) ||
    server.name.toLowerCase().includes(normalizedQuery)
  );

  $("#emptyChannels").hidden = filtered.length !== 0;

  filtered.forEach(channel => {
    const button = document.createElement("button");
    button.className = "channel";
    button.classList.toggle(
      "active", channel.id === state.selectedChannelId
    );

    const icon = document.createElement("span");
    icon.className = "channel-icon";
    icon.textContent = "#";

    const name = document.createElement("b");
    name.textContent = channel.name;

    button.append(icon, name);
    button.addEventListener("click", () => selectChannel(channel.id));
    channelsElement.append(button);
  });
}

function renderMessages() {
  messagesElement.replaceChildren();

  const server = getServer();
  const channel = getChannel();

  if (!server || !channel) {
    chatName.textContent = "No channel selected";
    $("#chatSubtitle").textContent = "Create a server and channel";
    $("#chatIcon").textContent = "#";
    $("#chatForm").hidden = true;
    return;
  }

  $("#chatForm").hidden = false;
  chatName.textContent = channel.name;
  $("#chatSubtitle").textContent = server.name;
  $("#chatIcon").textContent = "#";

  if (!channel.messages.length) {
    const welcome = document.createElement("p");
    welcome.className = "system";
    welcome.textContent = `Welcome to #${channel.name} in ${server.name}!`;
    messagesElement.append(welcome);

    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "This is the beginning of this channel.";
    messagesElement.append(empty);
    return;
  }

  channel.messages.forEach(message => {
    const bubble = document.createElement("p");
    bubble.className = "bubble";
    bubble.textContent = escapeText(message.text);
    messagesElement.append(bubble);
  });

  messagesElement.scrollTop = messagesElement.scrollHeight;
}

function render() {
  const query = searchInput.value;
  renderServers(query);
  renderChannels(query);
  renderMessages();
}

$("#addServer").addEventListener("click", () => {
  const name = prompt("Enter your new server name:");
  if (!name || !name.trim()) return;

  const cleanName = name.trim().slice(0, 50);

  const duplicate = state.servers.some(
    server => server.name.toLowerCase() === cleanName.toLowerCase()
  );

  if (duplicate) {
    showToast("A server with this name already exists.");
    return;
  }

  const server = makeServer(cleanName);
  state.servers.push(server);
  state.selectedServerId = server.id;
  state.selectedChannelId = server.channels[0].id;

  saveData();
  render();
  showToast("Server created!");
});

$("#addChannel").addEventListener("click", () => {
  const server = getServer();

  if (!server) {
    showToast("Create a server first.");
    return;
  }

  const name = prompt("Enter channel name (e.g. general):");
  if (!name || !name.trim()) return;

  const cleanName = name.trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);

  if (!cleanName) {
    showToast("Please enter a valid channel name.");
    return;
  }

  const duplicate = server.channels.some(
    channel => channel.name.toLowerCase() === cleanName.toLowerCase()
  );

  if (duplicate) {
    showToast("This channel already exists in this server.");
    return;
  }

  const channel = makeChannel(cleanName);
  server.channels.push(channel);
  state.selectedChannelId = channel.id;

  saveData();
  render();
  showToast("Channel created!");
});

chatForm.addEventListener("submit", event => {
  event.preventDefault();

  const text = messageInput.value.trim();
  if (!text) return;

  const channel = getChannel();
  if (!channel) {
    showToast("Select a channel first.");
    return;
  }

  channel.messages.push({
    id: makeId(),
    text: text.slice(0, 2000),
    createdAt: new Date().toISOString()
  });

  saveData();
  messageInput.value = "";
  renderMessages();
  messageInput.focus();
});

searchInput.addEventListener("input", () => {
  render();
});

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("selected", item === button);
    });

    const page = button.dataset.page;
    if (page !== "Home") {
      showToast(`${page} will be added in a future version.`);
    }
  });
});

$("#profileButton").addEventListener("click", () => {
  showToast("Profiles and accounts are coming in a future version.");
});

window.addEventListener("storage", event => {
  if (event.key === STORAGE_KEY) {
    state = loadData();
    render();
  }
});

if (!getServer()) {
  state = initialData();
  saveData();
} else if (!getChannel()) {
  const server = getServer();

  if (!server.channels.length) {
    server.channels.push(makeChannel());
  }

  state.selectedChannelId = server.channels[0].id;
  saveData();
}

render();
    
