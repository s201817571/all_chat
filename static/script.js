document.addEventListener("DOMContentLoaded", function() {
  loadMessages();
  
  const textarea = document.getElementById("messageInput");
  textarea.addEventListener("keypress", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});

function loadMessages() {
  fetch('/messages')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("messagesContainer");
      container.innerHTML = "";
      
      // Messages are already sorted by timestamp from Flask
      data.forEach(msg => {
        appendMessage(msg, container);
      });
      
      // Scroll to bottom after loading all messages
      scrollToBottom(container);
    })
    .catch(err => {
      console.error("Error loading messages:", err);
    });
}

function appendMessage(msg, container) {
  const div = document.createElement("div");
  div.className = "message sent";
  div.setAttribute('data-id', msg.id);
  
  // Detect email or URL
  const text = msg.text
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
    .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<span class="email" onclick="copyToClipboard(\'$1\')">$1</span>');
  
  div.innerHTML = `
    <button class="delete-btn" onclick="deleteMessage(${msg.id})">×</button>
    <div>${text}</div>
    <span class="timestamp">${msg.timestamp}</span>
  `;
  
  // Append to end (messages are sorted chronologically)
  container.appendChild(div);
}

function sendMessage() {
  const textarea = document.getElementById("messageInput");
  const text = textarea.value.trim();
  if (!text) return;
  
  // Disable button and textarea while sending
  const button = document.querySelector('button');
  button.disabled = true;
  textarea.disabled = true;
  button.style.opacity = '0.6';
  
  fetch('/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // Clear the input
      textarea.value = "";
      // Reload messages to show the new one
      loadMessages();
    } else {
      alert('Error sending message: ' + (data.error || 'Unknown error'));
    }
  })
  .catch(err => {
    console.error("Error sending message:", err);
    alert('Error sending message. Please try again.');
  })
  .finally(() => {
    // Re-enable button and textarea
    button.disabled = false;
    textarea.disabled = false;
    button.style.opacity = '1';
  });
}

function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  
  fetch(`/messages/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        loadMessages();
      } else {
        alert('Error deleting message: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      console.error("Error deleting message:", err);
      alert('Error deleting message. Please try again.');
    });
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Create a WhatsApp-like notification
    const notification = document.createElement('div');
    notification.textContent = `Copied: ${text}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #323232;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      z-index: 1000;
      font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 2 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}