class Message {
   private String sender;
   private String receiver;
   private String content;
  
   public Message(String sender, String receiver, String content) {
     this.sender = sender;
     this.receiver = receiver;
     this.content = content;
    }
  
    public String toString() {
      return sender + " → " + receiver + ": " + content;
    }
}
  
class MessageService {
     public void sendMessage(Message message) {
        System.out.println("Sending: " + message);
        // Тут могла б бути логіка збереження в базу або надсилання через WebSocket
     }
}

